import supabase from './supabase';

// Storage bucket for images
const IMAGES_BUCKET = 'images';

// Table for image metadata
const IMAGES_TABLE = 'images';

// Fetch all images metadata
export const fetchImageMetadata = async () => {
  const { data, error } = await supabase
    .from(IMAGES_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching images metadata:', error);
    throw error;
  }
  
  return data;
};

// Upload a new image
export const uploadImage = async (file, alt) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to upload an image');
  }
  
  // Generate a unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Upload to storage
  const { error: uploadError } = await supabase
    .storage
    .from(IMAGES_BUCKET)
    .upload(filePath, file);
  
  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }
  
  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(IMAGES_BUCKET)
    .getPublicUrl(filePath);
  
  // Save metadata to the database
  const { data, error } = await supabase
    .from(IMAGES_TABLE)
    .insert([{
      url: publicUrl,
      alt: alt || `Image ${fileName}`,
      file_name: fileName,
      file_path: filePath,
      user_id: user.id
    }])
    .select();
  
  if (error) {
    console.error('Error saving image metadata:', error);
    throw error;
  }
  
  return data[0];
};

// Delete an image (both storage and metadata)
export const deleteImage = async (id, filePath) => {
  // Delete from storage
  const { error: storageError } = await supabase
    .storage
    .from(IMAGES_BUCKET)
    .remove([filePath]);
  
  if (storageError) {
    console.error('Error deleting image from storage:', storageError);
  }
  
  // Delete metadata regardless of storage deletion success
  const { error: metadataError } = await supabase
    .from(IMAGES_TABLE)
    .delete()
    .eq('id', id);
  
  if (metadataError) {
    console.error('Error deleting image metadata:', metadataError);
    throw metadataError;
  }
  
  return true;
}; 