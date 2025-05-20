import { supabase } from './supabaseClient';

// Table names
const DOCUMENTS_TABLE = 'documents';
const STORAGE_BUCKET = 'aeronotes-documents';

// Fetch all documents for the current user
export const fetchDocuments = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
  
  return data;
};

// Create a new document
export const createDocument = async (formData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const file = formData.get('file');
    const title = formData.get('title');

    if (!file) {
      throw new Error('No file provided');
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    // Store files in user-specific folders
    const filePath = `${user.id}/${fileName}`;

    // Try to upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file. Please try again.');
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    // Create document record in the database
    const { data, error } = await supabase
      .from(DOCUMENTS_TABLE)
      .insert([
        {
          title,
          content: publicUrl,
          file_path: filePath,
          auto_delete: false,
          user_id: user.id // Explicitly set user_id
        }
      ])
      .select()
      .single();

    if (error) {
      // If database insert fails, delete the uploaded file
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createDocument:', error);
    throw error;
  }
};

// Update a document
export const updateDocument = async (id, updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .update({
      ...updates,
      last_edited: new Date().toISOString(),
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating document:', error);
    throw error;
  }
  
  return data[0];
};

// Toggle auto-delete for a document
export const toggleDocumentAutoDelete = async (id, autoDelete) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .update({ auto_delete: autoDelete })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a document
export const deleteDocument = async (id) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First get the document to get the file path
    const { data: doc, error: fetchError } = await supabase
      .from(DOCUMENTS_TABLE)
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the file from storage
    if (doc.file_path) {
      const { error: deleteFileError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([doc.file_path]);

      if (deleteFileError) {
        console.error('Error deleting file from storage:', deleteFileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete the document record
    const { error } = await supabase
      .from(DOCUMENTS_TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
}; 