import supabase from './supabase';

const FILES_TABLE = 'files';
const DOCUMENTS_BUCKET = 'aeronotes-documents'; // Bucket for documents

// Default expiry days for documents if auto-delete is on
const DEFAULT_DOCUMENT_EXPIRY_DAYS = 7;

/**
 * Fetch all document-type files
 */
export const fetchDocuments = async () => {
  const { data, error } = await supabase
    .from(FILES_TABLE)
    .select('id, file_name, content_type, created_at, updated_at, auto_delete, expiry_date, file_path, bucket_id')
    .eq('bucket_id', DOCUMENTS_BUCKET) // Filter by document bucket
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
  
  // The 'content' (public URL) for documents needs to be constructed
  return data.map(doc => ({
    ...doc,
    title: doc.file_name, // Use file_name as title
    content: supabase.storage.from(doc.bucket_id).getPublicUrl(doc.file_path).data.publicUrl,
    lastEdited: doc.updated_at // map updated_at to lastEdited for compatibility if needed
  }));
};

/**
 * Create a new document file record and upload the file to storage.
 * @param {FormData} formData - Must contain 'file', 'autoDelete' (string 'true'/'false'), and optionally 'expiryDays' (number)
 */
export const createDocument = async (formData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("User not authenticated");
    throw new Error("User not authenticated");
  }

  const file = formData.get('file');
  const autoDelete = formData.get('autoDelete') === 'true';
  const expiryDays = formData.get('expiryDays') 
    ? parseInt(formData.get('expiryDays'), 10) 
    : DEFAULT_DOCUMENT_EXPIRY_DAYS;

  if (!file) {
    throw new Error('No file provided for document upload.');
  }

  const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  // Include user_id as folder prefix to match storage policies
  const filePath = `${user.id}/${uniqueFileName}`;

  // 1. Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false // Don't upsert, always create new if name collides (though Date.now() makes it unlikely)
    });

  if (uploadError) {
    console.error('Error uploading document file:', uploadError);
    throw new Error(`Failed to upload document file: ${uploadError.message}`);
  }

  // 2. Calculate expiry date if auto-delete is enabled
  let expiryDate = null;
  if (autoDelete) {
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
  }

  // 3. Insert metadata into the files table
  const { data: dbData, error: dbError } = await supabase
    .from(FILES_TABLE)
    .insert({
      user_id: user.id,
      bucket_id: DOCUMENTS_BUCKET,
      file_path: uploadData.path, // Use the path returned by storage upload
      file_name: file.name, // Original file name for display
      content_type: file.type,
      auto_delete: autoDelete,
      expiry_date: expiryDate
    })
    .select('id, file_name, content_type, created_at, updated_at, auto_delete, expiry_date, file_path, bucket_id')
    .single();

  if (dbError) {
    console.error('Error inserting document metadata:', dbError);
    // Attempt to delete the already uploaded file if DB insert fails
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([uploadData.path]);
    throw dbError;
  }

  return {
    ...dbData,
    title: dbData.file_name,
    content: supabase.storage.from(dbData.bucket_id).getPublicUrl(dbData.file_path).data.publicUrl,
    lastEdited: dbData.updated_at
  };
};

/**
 * Update document metadata (e.g., toggle auto_delete, change expiry_date)
 * @param {string} id - The ID of the file record in the 'files' table.
 * @param {object} updates - Object containing fields to update, e.g., { auto_delete: true, expiry_date: newDate }
 */
export const updateDocument = async (id, updates) => {
  // Ensure certain fields are not tampered with
  const validUpdates = { ...updates };
  delete validUpdates.id;      // Prevent id spoofing
  delete validUpdates.bucket_id; // Bucket should not change
  delete validUpdates.file_path; // File path should not change via this function

  const { data, error } = await supabase
    .from(FILES_TABLE)
    .update(validUpdates)
    .eq('id', id)
    .eq('bucket_id', DOCUMENTS_BUCKET)
    .select('id, file_name, content_type, created_at, updated_at, auto_delete, expiry_date, file_path, bucket_id')
    .single();
  
  if (error) {
    console.error('Error updating document metadata:', error);
    throw error;
  }
  
  return {
    ...data,
    title: data.file_name,
    content: supabase.storage.from(data.bucket_id).getPublicUrl(data.file_path).data.publicUrl,
    lastEdited: data.updated_at
  };
};

/**
 * Toggle auto-delete for a document and set/clear its expiry date.
 * @param {string} id - The ID of the file record.
 * @param {boolean} autoDelete - The new auto_delete status.
 * @param {number} [expiryDays=DEFAULT_DOCUMENT_EXPIRY_DAYS] - Optional number of days for expiry if autoDelete is true.
 */
export const toggleDocumentAutoDelete = async (id, autoDelete, expiryDays = DEFAULT_DOCUMENT_EXPIRY_DAYS) => {
  let newExpiryDate = null;
  if (autoDelete) {
    newExpiryDate = new Date();
    // Handle fractional days properly (e.g., 1/24 = 1 hour)
    if (expiryDays < 1) {
      // For fractional days, convert to seconds and add them
      newExpiryDate.setSeconds(newExpiryDate.getSeconds() + expiryDays * 24 * 60 * 60);
    } else {
      // For whole days, use setDate
      newExpiryDate.setDate(newExpiryDate.getDate() + expiryDays);
    }
  }
  
  return updateDocument(id, { 
    auto_delete: autoDelete, 
    expiry_date: newExpiryDate 
  });
};

/**
 * Delete a document: removes from storage and from the 'files' table.
 * @param {string} id - The ID of the file record in the 'files' table.
 */
export const deleteDocument = async (id) => {
  // 1. Get the file record to find its path and bucket
  const { data: fileRecord, error: fetchError } = await supabase
    .from(FILES_TABLE)
    .select('file_path, bucket_id')
    .eq('id', id)
    .eq('bucket_id', DOCUMENTS_BUCKET)
    .single();

  if (fetchError) {
    console.error('Error fetching document for deletion:', fetchError);
    throw fetchError;
  }

  if (!fileRecord) {
    throw new Error('Document not found.');
  }

  // 2. Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from(fileRecord.bucket_id)
    .remove([fileRecord.file_path]);

  if (storageError) {
    console.error('Error deleting document from storage:', storageError);
    // Depending on policy, you might still want to delete the DB record or handle error differently
    // For now, we'll throw, but this could leave an orphaned DB record.
    throw storageError; 
  }

  // 3. Delete the metadata record from the files table
  const { error: dbError } = await supabase
    .from(FILES_TABLE)
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting document metadata:', dbError);
    throw dbError;
  }
  
  return true; // Successfully deleted
}; 