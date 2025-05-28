import imageCompression from 'browser-image-compression';

// Compression configuration
const COMPRESSION_CONFIG = {
  // Maximum file size in MB before compression
  maxSizeMB: 2,
  
  // Maximum width/height (maintains aspect ratio)
  maxWidthOrHeight: 1920,
  
  // Quality (0-1, where 1 is highest quality)
  initialQuality: 0.8,
  
  // Use web worker for better performance
  useWebWorker: true,
  
  // Preserve EXIF data
  preserveExif: false,
  
  // File type to convert to (optional)
  fileType: undefined, // Keep original format by default
};

/**
 * Compress an image file with intelligent quality adjustment
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  // Don't compress if file is already small
  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB <= 0.5) {
    console.log(`Image ${file.name} is already small (${fileSizeMB.toFixed(2)}MB), skipping compression`);
    return file;
  }

  // Merge with default config
  const config = {
    ...COMPRESSION_CONFIG,
    ...options,
  };

  try {
    console.log(`Compressing image: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
    
    // First attempt with standard quality
    let compressedFile = await imageCompression(file, config);
    let attempts = 1;
    
    // If still too large, try with lower quality
    while (compressedFile.size > config.maxSizeMB * 1024 * 1024 && config.initialQuality > 0.3 && attempts < 3) {
      config.initialQuality -= 0.2;
      console.log(`File still large, retrying with quality: ${config.initialQuality}`);
      compressedFile = await imageCompression(file, config);
      attempts++;
    }
    
    const compressedSizeMB = compressedFile.size / 1024 / 1024;
    const compressionRatio = ((file.size - compressedFile.size) / file.size * 100).toFixed(1);
    
    console.log(`Compression complete:
      Original: ${fileSizeMB.toFixed(2)}MB
      Compressed: ${compressedSizeMB.toFixed(2)}MB
      Saved: ${compressionRatio}%
      Quality: ${config.initialQuality}`);
    
    return compressedFile;
    
  } catch (error) {
    console.error('Image compression failed:', error);
    console.log('Falling back to original file');
    return file;
  }
};

/**
 * Get compression info without actually compressing
 * @param {File} file - The image file to analyze
 * @returns {Object} - Information about potential compression
 */
export const getCompressionInfo = (file) => {
  const fileSizeMB = file.size / 1024 / 1024;
  const isImage = file.type.startsWith('image/');
  
  if (!isImage) {
    return {
      canCompress: false,
      reason: 'Not an image file',
      currentSize: fileSizeMB,
    };
  }
  
  if (fileSizeMB <= 0.5) {
    return {
      canCompress: false,
      reason: 'File already small enough',
      currentSize: fileSizeMB,
    };
  }
  
  return {
    canCompress: true,
    currentSize: fileSizeMB,
    estimatedCompressedSize: fileSizeMB * 0.3, // Rough estimate
    estimatedSavings: fileSizeMB * 0.7,
  };
};

/**
 * Resize image to specific dimensions while maintaining aspect ratio
 * @param {File} file - The image file to resize
 * @param {Object} options - Resize options
 * @returns {Promise<File>} - Resized image file
 */
export const resizeImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
  } = options;
  
  try {
    const resizedFile = await imageCompression(file, {
      maxWidthOrHeight: Math.min(maxWidth, maxHeight),
      initialQuality: quality,
      useWebWorker: true,
    });
    
    console.log(`Image resized: ${file.name}
      Original: ${(file.size / 1024 / 1024).toFixed(2)}MB
      Resized: ${(resizedFile.size / 1024 / 1024).toFixed(2)}MB`);
    
    return resizedFile;
    
  } catch (error) {
    console.error('Image resize failed:', error);
    return file;
  }
};

export default compressImage; 