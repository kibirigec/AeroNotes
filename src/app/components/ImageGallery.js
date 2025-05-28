"use client";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow, parseISO } from 'date-fns';
import Image from 'next/image';
import { ContentSkeleton } from './Skeletons';
import { compressImage, getCompressionInfo } from '../../../lib/utils/imageCompression';

// Component for individual image item with auto-delete controls
const ImageItem = ({ image, onDelete, onToggleAutoDelete }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageUrl, setImageUrl] = useState(image.url);

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

  // Auto-retry for recent images that fail to load
  useEffect(() => {
    if (imageError && image.isRecent && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
      console.log(`Auto-retrying image load for ${image.file_name} in ${retryDelay}ms (attempt ${retryCount + 1})`);
      
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
        setImageLoading(true);
        // Add a new cache buster for retry
        setImageUrl(image.url.split('?')[0] + `?cb=${Date.now()}`);
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [imageError, image.isRecent, image.url, image.file_name, retryCount]);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
    setRetryCount(0); // Reset retry count on success
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleManualRetry = () => {
    setImageError(false);
    setImageLoading(true);
    setRetryCount(0);
    // Force a new cache buster for manual retry
    setImageUrl(image.url.split('?')[0] + `?cb=${Date.now()}`);
  };

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
      {/* Loading state */}
      {imageLoading && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-blue-800/50">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {image.isRecent ? 'Processing...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Error state with retry info */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-blue-800/50">
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <svg className="h-8 w-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {image.isRecent && retryCount < 3 ? 
                `Loading... (attempt ${retryCount + 1})` : 
                'Failed to load'
              }
            </span>
            {(!image.isRecent || retryCount >= 3) && (
              <button 
                onClick={handleManualRetry}
                className="text-xs text-blue-500 hover:text-blue-600 underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
      
      <img 
        src={imageUrl} 
        alt={image.alt || image.file_name || 'Gallery image'}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        width={300}
        height={225}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
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
                onClick={async () => {
                  try {
                    // Use fetch to download the image as blob for better cross-browser support
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = image.file_name || `image_${Date.now()}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading image:', error);
                    // Fallback to direct link if fetch fails
                    const link = document.createElement('a');
                    link.href = imageUrl;
                    link.download = image.file_name || `image_${Date.now()}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="flex-shrink-0 text-blue-300 hover:text-blue-200 bg-black/50 backdrop-blur-sm rounded-md p-1.5 transition-colors"
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
                className="flex-shrink-0 text-red-400 hover:text-red-300 bg-black/50 backdrop-blur-sm rounded-md p-1.5 transition-colors"
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
  onToggleImageAutoDelete,
  onRefresh
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState("");
  const [uploadAutoDelete, setUploadAutoDelete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [showSyncNotification, setShowSyncNotification] = useState(false);
  const fileInputRef = useRef(null);

  // Show sync notification when recent images are detected
  useEffect(() => {
    const recentImages = images.filter(img => img.isRecent);
    if (recentImages.length > 0) {
      setShowSyncNotification(true);
      const timer = setTimeout(() => {
        setShowSyncNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [images]);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Get compression info for the selected file
      const info = getCompressionInfo(file);
      setCompressionInfo(info);
    }
  };

  const handleUploadClick = async () => {
    if (selectedFile && onImageUpload) {
      setIsUploading(true);
      
      try {
        let fileToUpload = selectedFile;
        
        // Compress image if it's compressible
        if (compressionInfo?.canCompress) {
          setIsCompressing(true);
          try {
            fileToUpload = await compressImage(selectedFile);
            console.log(`Compression saved ${((selectedFile.size - fileToUpload.size) / 1024 / 1024).toFixed(2)}MB`);
          } catch (error) {
            console.error('Compression failed, using original file:', error);
            fileToUpload = selectedFile;
          } finally {
            setIsCompressing(false);
          }
        }
        
        // Use 1/24 days (1 hour) as the default expiry when auto-delete is enabled
        await onImageUpload(fileToUpload, altText, uploadAutoDelete, uploadAutoDelete ? 1/24 : undefined);
        setSelectedFile(null);
        setAltText("");
        setUploadAutoDelete(false);
        setCompressionInfo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Give a small delay to ensure the new image appears
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          }
        }, 500);
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
        setIsCompressing(false);
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
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold py-1.5 px-3 rounded-lg shadow transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Refresh gallery"
          >
            <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Sync notification */}
      {showSyncNotification && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            <span className="text-sm text-green-700 dark:text-green-300">
              Syncing new images from other devices...
            </span>
          </div>
        </div>
      )}

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
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mt-1">
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
              <label htmlFor="upload-auto-delete" className="text-sm text-blue-700 dark:text-blue-300">
                Auto-delete this image in 1 hour?
              </label>
            </div>
            
            <button
              onClick={handleUploadClick}
              disabled={!selectedFile || isLoading || isUploading}
              className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold py-2 px-4 rounded-xl shadow transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sm:ml-auto"
            >
              {isCompressing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Compressing...
                </>
              ) : isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                   <path strokeLineCap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
        {selectedFile && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Selected:</span> {selectedFile.name}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                <span className="font-medium">Size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              
              {compressionInfo && (
                <div className="mt-1">
                  {compressionInfo.canCompress ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>Image will be compressed (~{compressionInfo.estimatedSavings.toFixed(1)}MB saved)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{compressionInfo.reason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Gallery Display */}
      {content}
    </div>
  );
} 