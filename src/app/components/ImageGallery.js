"use client";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ContentSkeleton } from './Skeletons';

// Component for individual image item with auto-delete controls
const ImageItem = ({ image, onDelete, onToggleAutoDelete }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');

  // Format remaining time like the text notes component
  const formatRemainingTime = (isoString) => {
    if (!isoString) return 'N/A';
    const now = new Date();
    const expiry = new Date(isoString);
    if (isNaN(expiry.getTime())) return 'Invalid Date';

    const diffSeconds = Math.round((expiry - now) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds > 0) { // Future
      if (diffSeconds < 60) return `${diffSeconds}s`;
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays === 1) return `1 day`;
      return `${diffDays} days`;
    } else { // Past or now
      if (diffSeconds > -60) return `Expired`; // Within the last minute
      if (diffMinutes > -60) return `Expired ${-diffMinutes}m ago`;
      if (diffHours > -24) return `Expired ${-diffHours}h ago`;
      if (diffDays === -1) return `Expired 1 day ago`;
      return `Expired ${-diffDays} days ago`;
    }
  };

  useEffect(() => {
    if (image.auto_delete && image.expiry_date) {
      const updateRemainingTime = () => {
        setRemainingTime(formatRemainingTime(image.expiry_date));
      };
      updateRemainingTime();
      const intervalId = setInterval(updateRemainingTime, 60000); // Update every minute
      return () => clearInterval(intervalId);
    } else {
      setRemainingTime('');
    }
  }, [image.auto_delete, image.expiry_date]);

  const handleToggleClick = () => {
    if (isInteracting) return;
    setIsInteracting(true);
    
    if (!image.auto_delete) {
      // Auto-enable with 1 hour (1/24 days)
      onToggleAutoDelete(image.id, true, 1/24).finally(() => setIsInteracting(false));
    } else {
      // Turn off auto-delete
      onToggleAutoDelete(image.id, false).finally(() => setIsInteracting(false));
    }
  };
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${image.alt || image.file_name}"?`)) {
      onDelete(image.id); // Pass only ID, path is fetched in service
    }
  };

  return (
    <div className={`group aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-white dark:bg-blue-900/40 border-2 relative transition-all duration-300 ${
      image.auto_delete && image.expiry_date 
        ? 'amber-border-effect' 
        : 'border-blue-300 dark:border-blue-700'
    }`}>
      <img 
        src={image.url} 
        alt={image.alt || image.file_name || 'Gallery image'}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {/* Subtle expiry time for auto-delete items */}
      {image.auto_delete && image.expiry_date && (
        <div className="absolute top-2 left-2 bg-slate-700/80 dark:bg-slate-800/90 text-orange-400 text-xs px-2 py-1 rounded-md shadow-md backdrop-blur-sm border border-slate-500/30">
          {remainingTime ? `${remainingTime}` : 'Processing...'}
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
        {/* Top section for auto-delete controls */}
        <div className="flex justify-end items-start">
          {/* Auto-delete status and toggle */}
          <div className="flex items-center bg-black/40 backdrop-blur-sm rounded-full px-1 py-1">
            <label htmlFor={`auto-delete-img-${image.id}`} className="text-xs text-white font-medium mr-1.5">
              Auto-del
            </label>
            <button
              id={`auto-delete-img-${image.id}`}
              onClick={handleToggleClick}
              className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-300 ${image.auto_delete ? 'bg-green-500' : 'bg-gray-500 hover:bg-gray-400'} ${isInteracting ? 'opacity-70' : ''}`}
              aria-pressed={image.auto_delete}
              aria-label="Toggle auto-delete for image (1 hour)"
              disabled={isInteracting}
            >
              <span className={`bg-white dark:bg-gray-100 w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${image.auto_delete ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Bottom section for image name and action buttons */}
        <div className="flex justify-between items-end">
            <p className="text-white text-sm font-medium truncate mr-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1" title={image.alt || image.file_name}>{image.alt || image.file_name}</p>
            <div className="flex items-center space-x-2">
              {/* Download button */}
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = image.url;
                  link.download = image.file_name || 'image';
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex-shrink-0 text-blue-300 hover:text-blue-200 bg-black/50 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                aria-label="Download image"
                title="Download image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </button>
              
              {/* Delete button */}
              <button 
                onClick={handleDelete}
                className="flex-shrink-0 text-red-400 hover:text-red-300 bg-black/50 backdrop-blur-sm rounded-full p-1.5 transition-colors"
                aria-label="Delete image"
                title="Delete image"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default function ImageGallery({ 
  images = [], 
  isLoading = false, 
  onImageUpload,
  onImageDelete,
  onToggleImageAutoDelete
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [uploadAutoDelete, setUploadAutoDelete] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (selectedFile && onImageUpload) {
      // Use 1/24 days (1 hour) as the default expiry when auto-delete is enabled
      await onImageUpload(selectedFile, altText, uploadAutoDelete, uploadAutoDelete ? 1/24 : undefined);
      setSelectedFile(null);
      setAltText("");
      setUploadAutoDelete(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Main content rendering
  let content;
  if (isLoading) {
    return <ContentSkeleton type="gallery" />;
  } else if (images.length === 0) {
    content = (
      <div 
        className="flex flex-col items-center justify-center h-60 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 p-6"
      >
        <svg className="h-12 w-12 text-blue-700 dark:text-blue-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p className="text-blue-700 dark:text-blue-300 text-center">No images yet. Upload your first image below!</p>
      </div>
    );
  } else {
    content = (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((image) => (
          <ImageItem 
            key={image.id}
            image={image}
            onDelete={onImageDelete}
            onToggleAutoDelete={onToggleImageAutoDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-blue-800"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Image Gallery</h2>
      </div>

      {/* Upload Section */}
      <div 
        className="mb-6 p-4 bg-white/50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700"
      >
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100 mb-3">Upload New Image</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-800 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-700 cursor-pointer"
            />
            <input 
              type="text" 
              placeholder="Alt text (optional)" 
              value={altText} 
              onChange={(e) => setAltText(e.target.value)}
              className="flex-grow p-2 rounded-md border-2 border-blue-300 bg-white dark:bg-blue-900/50  focus:border-blue-500 outline-none placeholder-blue-400 dark:placeholder-blue-500"
            />
          </div>
          {/* Auto-delete options for upload */}
          <div className="flex flex-col sm:flex-row gap-3 items-center mt-1 relative">
            <div className="flex items-center">
              <input 
                type="checkbox"
                id="upload-auto-delete"
                checked={uploadAutoDelete}
                onChange={(e) => {
                  setUploadAutoDelete(e.target.checked);
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
              />
              <label htmlFor="upload-auto-delete" className="text-sm text-blue-700">
                Auto-delete this image in 1 hour?
              </label>
            </div>
          </div>
          
          <button
            onClick={handleUploadClick}
            disabled={!selectedFile || isLoading}
            className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold py-2 px-4 sm:px-6 rounded-xl shadow transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:self-end"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path stroke-linecap="round" stroke-linejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            Upload
          </button>
        </div>
        {selectedFile && (
          <p className="text-xs text-gray-600 mt-2">Selected: {selectedFile.name}</p>
        )}
      </div>
      
      {/* Gallery Display */}
      {content}
    </div>
  );
} 