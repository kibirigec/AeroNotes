import supabase from './supabase';

const FILES_TABLE = 'files';
const IMAGES_BUCKET = 'images'; // Bucket specifically for images

// Default expiry days for images if auto-delete is on
const DEFAULT_IMAGE_EXPIRY_DAYS = 30;

/**
 * Fetch all image-type files
 */
export const fetchImageMetadata = async () => {
  const { data, error } = await supabase
    .from(FILES_TABLE)
    .select('id, file_name, content_type, created_at, updated_at, auto_delete, expiry_date, file_path, bucket_id, alt') // Assuming 'alt' is specific to images and you might add it to files table or handle differently
    .eq('bucket_id', IMAGES_BUCKET) // Filter by image bucket
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching image metadata:', error);
    throw error;
  }
  
  return data.map(img => ({
    ...img,
    url: supabase.storage.from(img.bucket_id).getPublicUrl(img.file_path).data.publicUrl
    // alt text might be stored in a dedicated column if you add one, or in a JSON metadata column in 'files'
  }));
};

/**
 * Upload a new image, store its metadata in the 'files' table.
 * @param {File} file - The image file to upload.
 * @param {string} [alt] - Alt text for the image.
 * @param {boolean} [autoDelete=false] - Whether to auto-delete the image.
 * @param {number} [expiryDays=DEFAULT_IMAGE_EXPIRY_DAYS] - Days until expiry if autoDelete is true.
 */
export const uploadImage = async (file, alt, autoDelete = false, expiryDays = DEFAULT_IMAGE_EXPIRY_DAYS) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("User not authenticated");
    throw new Error("User not authenticated");
  }

  const uniqueFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  // Include user_id as folder prefix to match storage policies
  const filePath = `${user.id}/${uniqueFileName}`;

  // 1. Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading image file:', uploadError);
    throw uploadError;
  }

  // 2. Calculate expiry date
  let expiryDate = null;
  if (autoDelete) {
    expiryDate = new Date();
    // Handle fractional days properly (e.g., 1/24 = 1 hour)
    if (expiryDays < 1) {
      // For fractional days, convert to seconds and add them
      expiryDate.setSeconds(expiryDate.getSeconds() + expiryDays * 24 * 60 * 60);
    } else {
      // For whole days, use setDate
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
    }
  }

  // 3. Insert metadata into the files table
  // Consider adding an 'alt' column to your 'files' table or a generic metadata jsonb column 
  // if alt text is important and distinct for images.
  const { data: dbData, error: dbError } = await supabase
    .from(FILES_TABLE)
    .insert({
      user_id: user.id,
      bucket_id: IMAGES_BUCKET,
      file_path: uploadData.path,
      file_name: file.name,
      content_type: file.type,
      auto_delete: autoDelete,
      expiry_date: expiryDate,
      alt: alt
    })
    .select('id, file_name, content_type, created_at, updated_at, auto_delete, expiry_date, file_path, bucket_id, alt')
    .single();

  if (dbError) {
    console.error('Error saving image metadata:', dbError);
    await supabase.storage.from(IMAGES_BUCKET).remove([uploadData.path]);
    throw dbError;
  }

  return {
    ...dbData,
    url: supabase.storage.from(dbData.bucket_id).getPublicUrl(dbData.file_path).data.publicUrl,
    // alt is now part of dbData if the column exists and was selected
    // The select statement now includes 'alt', so dbData.alt should be populated.
    // If alt was not provided during upload and the DB column allows NULL, dbData.alt might be null.
    // The ImageItem component can have its own fallback if dbData.alt is null or undefined.
  };
};

/**
 * Update image metadata (e.g., toggle auto_delete, change expiry_date, alt text)
 * @param {string} id - The ID of the file record in the 'files' table.
 * @param {object} updates - Object containing fields to update.
 */
export const updateImageMetadata = async (id, updates) => {
  const validUpdates = { ...updates };
  delete validUpdates.id;
  delete validUpdates.bucket_id;
  delete validUpdates.file_path;

  const { data, error } = await supabase
    .from(FILES_TABLE)
    .update(validUpdates)
    .eq('id', id)
    .eq('bucket_id', IMAGES_BUCKET)
    .select('id, file_name, content_type, created_at, updated_at, auto_delete, expiry_date, file_path, bucket_id, alt')
    .single();
  
  if (error) {
    console.error('Error updating image metadata:', error);
    throw error;
  }
  
  return {
    ...data,
    url: supabase.storage.from(data.bucket_id).getPublicUrl(data.file_path).data.publicUrl,
    // alt should now be part of data due to the select statement
  };
};

/**
 * Toggle auto-delete for an image and set/clear its expiry date.
 * @param {string} id - The ID of the file record.
 * @param {boolean} autoDelete - The new auto_delete status.
 * @param {number} [expiryDays=DEFAULT_IMAGE_EXPIRY_DAYS] - Optional number of days for expiry.
 */
export const toggleImageAutoDelete = async (id, autoDelete, expiryDays = DEFAULT_IMAGE_EXPIRY_DAYS) => {
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
  
  return updateImageMetadata(id, { 
    auto_delete: autoDelete, 
    expiry_date: newExpiryDate 
  });
};


/**
 * Delete an image: removes from storage and from the 'files' table.
 * @param {string} id - The ID of the file record in the 'files' table.
 */
export const deleteImage = async (id) => {
  const { data: fileRecord, error: fetchError } = await supabase
    .from(FILES_TABLE)
    .select('file_path, bucket_id')
    .eq('id', id)
    .eq('bucket_id', IMAGES_BUCKET)
    .single();

  if (fetchError) {
    console.error('Error fetching image for deletion:', fetchError);
    throw fetchError;
  }

  if (!fileRecord) {
    throw new Error('Image not found.');
  }

  const { error: storageError } = await supabase.storage
    .from(fileRecord.bucket_id)
    .remove([fileRecord.file_path]);

  if (storageError) {
    console.error('Error deleting image from storage:', storageError);
    throw storageError;
  }

  const { error: dbError } = await supabase
    .from(FILES_TABLE)
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting image metadata:', dbError);
    throw dbError;
  }
  
  return true;
}; 