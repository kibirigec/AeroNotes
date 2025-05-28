import { useState, useEffect, useCallback } from 'react';
import {
  fetchImageMetadata as fetchGalleryImagesService,
  uploadImage as uploadGalleryImageService,
  deleteImage as deleteGalleryImageService,
  toggleImageAutoDelete as toggleImageAutoDeleteService,
} from '../imageService'; // Adjust path as needed

export function useGalleryImages(enabled = true) {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoadingGalleryImages, setIsLoadingGalleryImages] = useState(enabled);

  const loadGalleryImages = useCallback(async () => {
    if (!enabled) {
      setGalleryImages([]);
      setIsLoadingGalleryImages(false);
      return;
    }
    setIsLoadingGalleryImages(true);
    try {
      const imagesData = await fetchGalleryImagesService();
      setGalleryImages(imagesData || []); // Ensure it's an array
    } catch (error) {
      console.error("Error fetching gallery images in useGalleryImages:", error);
      setGalleryImages([]);
    } finally {
      setIsLoadingGalleryImages(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      loadGalleryImages();
    } else {
      setGalleryImages([]);
      setIsLoadingGalleryImages(false);
    }
  }, [loadGalleryImages, enabled]);

  const handleImageUpload = useCallback(async (file, altText, autoDelete, expiryDays) => {
    if (!enabled) {
      console.warn("useGalleryImages: Attempted to upload image while disabled.");
      return;
    }
    setIsLoadingGalleryImages(true); // Set loading true during upload
    try {
      const newImageFromDb = await uploadGalleryImageService(file, altText, autoDelete, expiryDays);
      setGalleryImages(prevImages => [newImageFromDb, ...prevImages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      return newImageFromDb;
    } catch (error) {
      console.error("Error uploading image in useGalleryImages:", error);
      throw error;
    } finally {
      setIsLoadingGalleryImages(false); // Reset loading state
    }
  }, [enabled]);

  const handleDeleteImage = useCallback(async (imageId) => {
    if (!enabled) {
      console.warn("useGalleryImages: Attempted to delete image while disabled.");
      return;
    }
    
    // Store original state for potential rollback
    const originalImages = [...galleryImages];
    
    try {
      // Delete from database first
      await deleteGalleryImageService(imageId);
      
      // Then update local state (optimistic update after database success)
      setGalleryImages(imgs => imgs.filter(img => img.id !== imageId));
    } catch (error) {
      console.error("Error deleting image in useGalleryImages:", error);
      // Keep original state if database deletion failed
      setGalleryImages(originalImages);
      throw error;
    }
  }, [enabled, galleryImages]);

  const handleToggleImageAutoDelete = useCallback(async (imageId, newAutoDeleteState, expiryDays) => {
    if (!enabled) {
      console.warn("useGalleryImages: Attempted to toggle auto-delete while disabled.");
      return;
    }
    const imgIndex = galleryImages.findIndex(img => img.id === imageId);
    if (imgIndex === -1) return;
    const originalImage = galleryImages[imgIndex];

    let optimisticExpiryDate = originalImage.expiry_date;
    if (newAutoDeleteState && expiryDays) {
      const newExpiry = new Date();
      if (expiryDays < 1) { // Handle fractional days for shorter expiries
        newExpiry.setSeconds(newExpiry.getSeconds() + expiryDays * 24 * 60 * 60);
      } else {
        newExpiry.setDate(newExpiry.getDate() + expiryDays);
      }
      optimisticExpiryDate = newExpiry.toISOString();
    } else if (!newAutoDeleteState) {
      optimisticExpiryDate = null;
    }

    const optimisticImage = {
      ...originalImage,
      auto_delete: newAutoDeleteState,
      expiry_date: optimisticExpiryDate,
    };
    setGalleryImages(prevImgs => prevImgs.map(img => (img.id === imageId ? optimisticImage : img)));

    try {
      const updatedImageFromDb = await toggleImageAutoDeleteService(imageId, newAutoDeleteState, expiryDays);
      setGalleryImages(prevImgs => prevImgs.map(img => (img.id === imageId ? updatedImageFromDb : img)));
    } catch (error) {
      console.error("Error toggling image auto-delete in useGalleryImages:", error);
      setGalleryImages(prevImgs => prevImgs.map(img => (img.id === imageId ? originalImage : img))); // Revert
    }
  }, [enabled, galleryImages]);

  return {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler: handleImageUpload,
    deleteImageHandler: handleDeleteImage,
    toggleImageAutoDeleteHandler: handleToggleImageAutoDelete,
    reloadGalleryImages: loadGalleryImages,
    setGalleryImages
  };
} 