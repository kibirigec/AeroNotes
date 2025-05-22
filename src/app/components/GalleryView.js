"use client";

import { useEffect } from "react";
import ImageGallery from "./ImageGallery"; // Assuming ImageGallery is in the same directory

export default function GalleryView({
  images,
  isLoading,
  onImageUpload,
  onImageDelete,
  onToggleImageAutoDelete
}) {
  // Force component to respect theme
  useEffect(() => {
    const elements = document.querySelectorAll('.force-theme');
    elements.forEach(el => {
      el.style.colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }, []);

  return (
    <div className="force-theme">
      <ImageGallery 
        images={images} 
        isLoading={isLoading} 
        onImageUpload={onImageUpload} 
        onImageDelete={onImageDelete}
        onToggleImageAutoDelete={onToggleImageAutoDelete}
      />
    </div>
  );
} 