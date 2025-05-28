"use client";

import ImageGallery from "./ImageGallery";

export default function GalleryView({
  images,
  isLoading,
  onImageUpload,
  onImageDelete,
  onToggleImageAutoDelete,
  onRefresh
}) {
  return (
    <div className="w-full">
      <ImageGallery 
        images={images} 
        isLoading={isLoading} 
        onImageUpload={onImageUpload} 
        onImageDelete={onImageDelete}
        onToggleImageAutoDelete={onToggleImageAutoDelete}
        onRefresh={onRefresh}
      />
    </div>
  );
} 