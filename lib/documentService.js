import supabase from './supabase';

// Table names
const DOCUMENTS_TABLE = 'documents';

// Fetch all documents for the current user
export const fetchDocuments = async () => {
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
export const createDocument = async (title) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to create a document');
  }
  
  const { data, error } = await supabase
    .from(DOCUMENTS_TABLE)
    .insert([
      { 
        title, 
        auto_delete: false,
        last_edited: new Date().toISOString(),
        user_id: user.id
      }
    ])
    .select();
  
  if (error) {
    console.error('Error creating document:', error);
    throw error;
  }
  
  return data[0];
};

// Update a document
export const updateDocument = async (id, updates) => {
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
  return updateDocument(id, { auto_delete: autoDelete });
};

// Delete a document
export const deleteDocument = async (id) => {
  const { error } = await supabase
    .from(DOCUMENTS_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
  
  return true;
}; 