import { useState, useEffect, useCallback } from 'react';
import {
  fetchImageMetadata as fetchGalleryImagesService,
  uploadImage as uploadGalleryImageService,
  deleteImage as deleteGalleryImageService,
  toggleImageAutoDelete as toggleImageAutoDeleteService,
} from '../imageService'; // Adjust path as needed

export function useGalleryImages(user) {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoadingGalleryImages, setIsLoadingGalleryImages] = useState(true);

  const loadGalleryImages = useCallback(async () => {
    if (!user) {
      setIsLoadingGalleryImages(false);
      setGalleryImages([]);
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
  }, [user]);

  useEffect(() => {
    loadGalleryImages();
  }, [loadGalleryImages]);

  const handleImageUpload = useCallback(async (file, altText, autoDelete, expiryDays) => {
    if (!user) throw new Error("User must be logged in to upload an image");
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
  }, [user]);

  const handleDeleteImage = useCallback(async (imageId) => {
    const originalImages = [...galleryImages];
    setGalleryImages(imgs => imgs.filter(img => img.id !== imageId)); // Optimistic update
    try {
      await deleteGalleryImageService(imageId);
    } catch (error) {
      console.error("Error deleting image in useGalleryImages:", error);
      setGalleryImages(originalImages); // Revert on error
    }
  }, [galleryImages]);

  const handleToggleImageAutoDelete = useCallback(async (imageId, newAutoDeleteState, expiryDays) => {
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
  }, [galleryImages]);

  return {
    galleryImages,
    isLoadingGalleryImages,
    uploadImageHandler: handleImageUpload,
    deleteImageHandler: handleDeleteImage,
    toggleImageAutoDeleteHandler: handleToggleImageAutoDelete,
    reloadGalleryImages: loadGalleryImages,
  };
} 