"use client";

import ImageGallery from "./ImageGallery"; // Assuming ImageGallery is in the same directory

export default function GalleryView({
  images,
  isLoading,
  onImageUpload,
  onImageDelete,
  onToggleImageAutoDelete
}) {
  return (
    <ImageGallery 
      images={images} 
      isLoading={isLoading} 
      onImageUpload={onImageUpload} 
      onImageDelete={onImageDelete}
      onToggleImageAutoDelete={onToggleImageAutoDelete}
    />
  );
} 