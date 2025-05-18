"use client";
import { useState } from "react";
import GalleryTransition from "./transitions/GalleryTransition";

export default function ImageGallery({ initialImages = [] }) {
  const [images, setImages] = useState(initialImages);
  // Gallery expanded state
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  // Handle adding a new image
  const handleAddImage = () => {
    // In a real app, this would open a file picker
    // For demo purposes, we'll add a random Unsplash image
    const randomId = Math.floor(Math.random() * 1000);
    const newImage = {
      id: Date.now(),
      url: `https://source.unsplash.com/random/300x200?sig=${randomId}`,
      alt: `Image ${images.length + 1}`
    };
    
    setImages([...images, newImage]);
  };

  // Delete an image
  const handleDeleteImage = (imageId) => {
    setImages(images.filter(img => img.id !== imageId));
  };

  // Toggle gallery expanded state
  const toggleGallery = () => {
    setGalleryExpanded(!galleryExpanded);
  };

  // Gallery content - this will be wrapped by our transition component
  const galleryContent = (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Images</h2>
        <div className="flex gap-2">
          {galleryExpanded && (
            <button
              onClick={handleAddImage}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow transition text-sm dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Image
            </button>
          )}
          <button 
            onClick={toggleGallery}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow text-sm dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-1"
          >
            {galleryExpanded ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Close
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
                View All Images
              </>
            )}
          </button>
        </div>
      </div>
      
      {galleryExpanded ? (
        // Grid view for expanded gallery
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {/* Add image placeholder */}
          <div 
            onClick={handleAddImage}
            className="aspect-[4/3] rounded-xl shadow-md bg-white/90 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 border-dashed hover:scale-105 cursor-pointer flex items-center justify-center"
          >
            <div className="flex flex-col items-center text-blue-500 dark:text-blue-300">
              <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              <span className="text-sm font-medium">Add Image</span>
            </div>
          </div>
          
          {/* Image items */}
          {images.map((image) => (
            <div key={image.id} className="aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-white dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 hover:scale-105">
              <div className="relative w-full h-full">
                <img 
                  src={image.url} 
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 flex items-end justify-between p-3">
                  <p className="text-white text-sm truncate">{image.alt}</p>
                  <button 
                    className="text-white hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Horizontal scrolling view for collapsed gallery
        <div className="relative">
          <div className="overflow-x-auto pb-4 hide-scrollbar">
            <div className="flex space-x-4 w-max">
              {/* Add image placeholder */}
              <div 
                onClick={handleAddImage}
                className="flex-none w-52 h-40 rounded-xl shadow-md bg-white/90 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 border-dashed hover:scale-105 cursor-pointer flex items-center justify-center"
              >
                <div className="flex flex-col items-center text-blue-500 dark:text-blue-300">
                  <svg className="h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <span className="text-sm font-medium">Add Image</span>
                </div>
              </div>
              
              {/* Image items */}
              {images.map((image) => (
                <div key={image.id} className="flex-none w-52 h-40 rounded-xl overflow-hidden shadow-md bg-white dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 hover:scale-105">
                  <div className="relative w-full h-full">
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 flex items-end p-3">
                      <p className="text-white text-sm truncate">{image.alt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Left-right indicators */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-blue-900/80 rounded-r-full p-1 shadow-md">
            <svg className="h-6 w-6 text-blue-500 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-blue-900/80 rounded-l-full p-1 shadow-md">
            <svg className="h-6 w-6 text-blue-500 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
        </div>
      )}

      {/* No images state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-200 dark:border-blue-800">
          <svg className="h-10 w-10 text-blue-300 dark:text-blue-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="text-blue-500 dark:text-blue-400 text-sm">No images yet. Add your first image!</p>
        </div>
      )}
    </>
  );

  return (
    <GalleryTransition 
      isExpanded={galleryExpanded} 
      onToggle={toggleGallery}
    >
      {galleryContent}
    </GalleryTransition>
  );
} 