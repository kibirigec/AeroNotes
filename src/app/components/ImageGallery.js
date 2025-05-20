"use client";
import { useState, useRef } from "react";
// import GalleryTransition from "./transitions/GalleryTransition"; // Removing for simplification

export default function ImageGallery({ 
  images = [], 
  isLoading = false, 
  onImageUpload, 
  onImageDelete 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState("");
  const fileInputRef = useRef(null); // For resetting file input

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (selectedFile && onImageUpload) {
      await onImageUpload(selectedFile, altText);
      setSelectedFile(null);
      setAltText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };

  const handleDeleteClick = (image) => {
    if (onImageDelete) {
      // Add a confirmation dialog for better UX
      if (window.confirm(`Are you sure you want to delete "${image.alt || image.file_name}"?`)) {
        onImageDelete(image.id, image.file_path);
      }
    }
  };

  // Main content rendering
  let content;
  if (isLoading) {
    content = (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  } else if (images.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center h-60 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-200 dark:border-blue-800 p-6">
        <svg className="h-12 w-12 text-blue-300 dark:text-blue-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p className="text-blue-500 dark:text-blue-400 text-center">No images yet. Upload your first image below!</p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <div key={image.id} className="group aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-white dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 relative">
            <img 
              src={image.url} 
              alt={image.alt || 'Gallery image'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-white text-sm font-medium truncate">{image.alt || image.file_name}</p>
              <button 
                onClick={() => handleDeleteClick(image)}
                className="mt-1 self-start text-red-500 hover:text-red-400 bg-white/20 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                aria-label="Delete image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Image Gallery</h2>
      </div>

      {/* Upload Section */}
      <div className="mb-6 p-4 bg-white/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100 mb-2">Upload New Image</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-800 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-700 cursor-pointer"
          />
          <input 
            type="text" 
            placeholder="Alt text (optional)" 
            value={altText} 
            onChange={(e) => setAltText(e.target.value)}
            className="flex-grow p-2 rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-900/50 focus:ring-2 focus:ring-blue-500 outline-none placeholder-blue-400 dark:placeholder-blue-500"
          />
          <button
            onClick={handleUploadClick}
            disabled={!selectedFile || isLoading} // Disable if no file or already loading/uploading
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow transition text-sm dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:self-end"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Upload
          </button>
        </div>
        {selectedFile && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Selected: {selectedFile.name}</p>
        )}
      </div>
      
      {/* Gallery Display */}
      {content}
    </div>
  );
} 