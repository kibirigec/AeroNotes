import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AUTO_DELETE_SETTINGS_TABLE = 'auto_delete_settings';

/**
 * Fetch auto-delete settings for the current user
 * @returns {Promise<Object>} The user's auto-delete settings
 */
export const fetchAutoDeleteSettings = async () => {
  const { data, error } = await supabase
    .from(AUTO_DELETE_SETTINGS_TABLE)
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "no rows returned" error
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
  // First check if we have settings already
  const { data: existingSettings } = await supabase
    .from(AUTO_DELETE_SETTINGS_TABLE)
    .select('id')
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
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new settings
    const { data, error } = await supabase
      .from(AUTO_DELETE_SETTINGS_TABLE)
      .insert({
        document_timeout_seconds: settings.document_timeout_seconds,
        note_timeout_seconds: settings.note_timeout_seconds,
        image_timeout_seconds: settings.image_timeout_seconds,
      })
      .select()
      .single();

    if (error) throw error;
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
  // Format the field name based on table (documents use snake_case, others may use camelCase)
  const autoDeleteField = table === 'documents' ? 'auto_delete' : 'auto_delete';
  const timeoutField = 'auto_delete_timeout_seconds';
  
  const updateData = {
    [autoDeleteField]: autoDelete,
  };
  
  // Add custom timeout if provided
  if (customTimeout !== null) {
    updateData[timeoutField] = customTimeout;
  }
  
  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export default {
  fetchAutoDeleteSettings,
  updateAutoDeleteSettings,
  formatDuration,
  calculateRemainingTime,
  toggleAutoDelete,
}; 