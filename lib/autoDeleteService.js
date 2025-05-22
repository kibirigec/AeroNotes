import supabase from './supabase';

const AUTO_DELETE_SETTINGS_TABLE = 'auto_delete_settings';

/**
 * Fetch auto-delete settings for the current user
 * @returns {Promise<Object>} The user's auto-delete settings
 */
export const fetchAutoDeleteSettings = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from(AUTO_DELETE_SETTINGS_TABLE)
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
    console.error('Error fetching auto-delete settings:', error);
    throw error;
  }

  // If no settings exist yet, return default values
  if (!data) {
    return {
      document_timeout_seconds: 86400, // 24 hours
      note_timeout_seconds: 3600,      // 1 hour
      image_timeout_seconds: 43200,    // 12 hours
    };
  }

  return data;
};

/**
 * Update auto-delete settings for the current user
 * @param {Object} settings - The settings to update
 * @param {number} settings.document_timeout_seconds - Document timeout in seconds
 * @param {number} settings.note_timeout_seconds - Note timeout in seconds
 * @param {number} settings.image_timeout_seconds - Image timeout in seconds
 * @returns {Promise<Object>} The updated settings
 */
export const updateAutoDeleteSettings = async (settings) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First check if we have settings already
  const { data: existingSettings } = await supabase
    .from(AUTO_DELETE_SETTINGS_TABLE)
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existingSettings) {
    // Update existing settings
    const { data, error } = await supabase
      .from(AUTO_DELETE_SETTINGS_TABLE)
      .update({
        document_timeout_seconds: settings.document_timeout_seconds,
        note_timeout_seconds: settings.note_timeout_seconds,
        image_timeout_seconds: settings.image_timeout_seconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSettings.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating auto-delete settings:', error);
      throw error;
    }
    return data;
  } else {
    // Insert new settings
    const { data, error } = await supabase
      .from(AUTO_DELETE_SETTINGS_TABLE)
      .insert({
        user_id: user.id,
        document_timeout_seconds: settings.document_timeout_seconds,
        note_timeout_seconds: settings.note_timeout_seconds,
        image_timeout_seconds: settings.image_timeout_seconds,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating auto-delete settings:', error);
      throw error;
    }
    return data;
  }
};

/**
 * Format seconds into a human-readable duration
 * @param {number} seconds - The duration in seconds
 * @returns {string} Formatted duration (e.g., "1 hour", "2 days")
 */
export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
};

/**
 * Calculate remaining time until deletion
 * @param {Object} item - The item with scheduled_deletion timestamp
 * @returns {number} Remaining time in seconds, or 0 if auto-delete is off
 */
export const calculateRemainingTime = (item) => {
  if (!item.auto_delete || !item.scheduled_deletion) return 0;
  
  const deletionTime = new Date(item.scheduled_deletion).getTime();
  const currentTime = Date.now();
  const remainingMs = Math.max(0, deletionTime - currentTime);
  
  return Math.floor(remainingMs / 1000); // Convert to seconds
};

/**
 * Toggle auto-delete for a specific item
 * @param {string} table - The table name ('documents', 'notes', 'images')
 * @param {string} id - The item ID
 * @param {boolean} autoDelete - The new auto-delete status
 * @param {number} [customTimeout] - Optional custom timeout in seconds
 * @returns {Promise<Object>} The updated item
 */
export const toggleAutoDelete = async (table, id, autoDelete, customTimeout = null) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let expiry_date = null;
  
  if (autoDelete) {
    const timeoutSeconds = customTimeout ? customTimeout * 24 * 60 * 60 : 7 * 24 * 60 * 60; // Default to 7 days
    expiry_date = new Date(Date.now() + timeoutSeconds * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from(table)
    .update({ 
      auto_delete: autoDelete,
      expiry_date: expiry_date
    })
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only update their own items
    .select()
    .single();
    
  if (error) {
    console.error('Error toggling auto-delete:', error);
    throw error;
  }
  return data;
};

const autoDeleteService = {
  fetchAutoDeleteSettings,
  updateAutoDeleteSettings,
  formatDuration,
  calculateRemainingTime,
  toggleAutoDelete,
};

export default autoDeleteService; 