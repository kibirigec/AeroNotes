import supabase from './supabase';

// Table names
const NOTES_TABLE = 'notes';
const DEFAULT_NOTE_EXPIRY_HOURS = 1;

// Fetch all notes
export const fetchNotes = async () => {
  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .select('*') // Selects all columns, including the new expiry_date and existing "autoDelete"
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
  
  // Supabase client should map quoted "autoDelete" to autoDelete in JS objects.
  // expiry_date (snake_case in DB) will also be mapped to expiry_date in JS by default.
  return data;
};

// Create a new note
export const createNote = async (text, autoDelete = true) => { // autoDelete defaults to true
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("User not authenticated");
    throw new Error("User not authenticated");
  }

  let expiryDate = null;
  if (autoDelete) {
    expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + DEFAULT_NOTE_EXPIRY_HOURS);
  }
  
  const noteToInsert = { 
    user_id: user.id,
    text: text,
    "autoDelete": autoDelete, // Explicitly use quoted "autoDelete" to match DB schema if issues persist
    created_at: new Date().toISOString(),
    expiry_date: expiryDate ? expiryDate.toISOString() : null // Add expiry_date
  };

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .insert([noteToInsert])
    .select(); // Select all columns of the newly created note
  
  if (error) {
    console.error('Error creating note:', error);
    // Log the noteToInsert for debugging if there's an error
    console.error('Note data that failed:', noteToInsert);
    throw error;
  }
  
  return data[0];
};

// Toggle auto-delete for a note
export const toggleNoteAutoDelete = async (id, newAutoDeleteState) => {
  let expiryDate = null;
  if (newAutoDeleteState) {
    expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + DEFAULT_NOTE_EXPIRY_HOURS);
  }

  const updatePayload = {
    "autoDelete": newAutoDeleteState, // Explicitly use quoted "autoDelete"
    expiry_date: expiryDate ? expiryDate.toISOString() : null
    // DO NOT update created_at anymore
  };

  const { data, error } = await supabase
    .from(NOTES_TABLE)
    .update(updatePayload)
    .eq('id', id)
    .select(); // Select all columns of the updated note
  
  if (error) {
    console.error('Error toggling note auto-delete:', error);
    console.error('Update payload that failed for note id ' + id + ':', updatePayload);
    throw error;
  }
  
  return data[0];
};

// Delete a note
export const deleteNote = async (id) => {
  const { error } = await supabase
    .from(NOTES_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
  
  return true;
}; 