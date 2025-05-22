"use client";
import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow, parseISO } from 'date-fns';

// Component for individual image item with auto-delete controls
const ImageItem = ({ image, onDelete, onToggleAutoDelete, isDarkMode }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [showExpiryOptions, setShowExpiryOptions] = useState(false);
  const [selectedExpiryDays, setSelectedExpiryDays] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    if (image.auto_delete && image.expiry_date) {
      const updateRemainingTime = () => {
        const expiry = parseISO(image.expiry_date);
        const now = new Date();
        if (expiry > now) {
          setRemainingTime(formatDistanceToNow(expiry, { addSuffix: true }));
        } else {
          setRemainingTime('Expired');
        }
      };
      updateRemainingTime();
      const intervalId = setInterval(updateRemainingTime, 60000); // Update every minute
      return () => clearInterval(intervalId);
    } else {
      setRemainingTime('');
    }
  }, [image.auto_delete, image.expiry_date]);

  const expiryOptions = [
    { label: '10 seconds', value: 10 / 86400 }, // Approx 0.0001157 days
    { label: '1 day', value: 1 },
    { label: '7 days', value: 7 },
    { label: '15 days', value: 15 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
  ];

  const handleToggleClick = () => {
    if (isInteracting) return;
    setIsInteracting(true);
    if (!image.auto_delete) {
      setShowExpiryOptions(true);
      setIsInteracting(false); // Allow interaction with options
      return;
    }
    // If turning off
    onToggleAutoDelete(image.id, false).finally(() => setIsInteracting(false));
  };

  const handleExpirySelect = (days) => {
    setSelectedExpiryDays(days);
    setIsInteracting(true);
    onToggleAutoDelete(image.id, true, days)
      .then(() => {
        setShowExpiryOptions(false);
        setSelectedExpiryDays(null);
      })
      .finally(() => setIsInteracting(false));
  };
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${image.alt || image.file_name}"?`)) {
      onDelete(image.id); // Pass only ID, path is fetched in service
    }
  };

  return (
    <div 
      className="group aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-white dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 relative"
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      <img 
        src={image.url} 
        alt={image.alt || image.file_name || 'Gallery image'}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
        {/* Top section for auto-delete controls */}
        <div className="flex justify-end items-start relative">
          {/* Auto-delete status and toggle */}
          <div className="flex flex-col items-end text-right">
            {image.auto_delete && image.expiry_date && (
              <span className="text-xs text-orange-300 bg-black/50 px-1.5 py-0.5 rounded-sm mb-0.5">
                {remainingTime ? `Expires ${remainingTime}` : 'Processing...'}
              </span>
            )}
            <div className="flex items-center">
              <label htmlFor={`auto-delete-img-${image.id}`} className="text-xs text-blue-200 mr-1.5">
                Auto-del
              </label>
              <button
                id={`auto-delete-img-${image.id}`}
                onClick={handleToggleClick}
                className={`w-9 h-4 flex items-center rounded-full p-0.5 transition-colors duration-300 ${image.auto_delete ? 'bg-green-500' : 'bg-gray-500 hover:bg-gray-400'} ${isInteracting ? 'opacity-70' : ''}`}
                aria-pressed={image.auto_delete}
                aria-label="Toggle auto-delete for image"
                disabled={isInteracting && !showExpiryOptions}
              >
                <span className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${image.auto_delete ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Expiry options dropdown */}
          {showExpiryOptions && (
            <div className="absolute top-full right-0 mt-1 bg-gray-700 rounded-md shadow-lg z-20 p-1.5 border border-gray-600 w-36">
              <h5 className="text-xs font-medium text-blue-200 mb-1 px-1">Set Expiry:</h5>
              {expiryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleExpirySelect(option.value)}
                  className={`w-full text-left px-2 py-1 text-xs rounded ${selectedExpiryDays === option.value ? 'bg-blue-600 text-white' : 'hover:bg-gray-600 text-gray-200'}`}
                >
                  {option.label}
                </button>
              ))}
              <button onClick={() => {setShowExpiryOptions(false); setIsInteracting(false);}} className="mt-1 w-full text-xs text-gray-400 hover:text-gray-200 py-0.5">Cancel</button>
            </div>
          )}
        </div>

        {/* Bottom section for image name and delete button */}
        <div className="flex justify-between items-end">
            <p className="text-white text-sm font-medium truncate mr-2" title={image.alt || image.file_name}>{image.alt || image.file_name}</p>
            <button 
              onClick={handleDelete}
              className="flex-shrink-0 text-red-400 hover:text-red-300 bg-black/40 backdrop-blur-sm rounded-full p-1.5 transition-colors"
              aria-label="Delete image"
              disabled={isInteracting}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
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
  const [uploadExpiryDays, setUploadExpiryDays] = useState(30);
  const [showUploadExpiryOptions, setShowUploadExpiryOptions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef(null);

  // Check for dark mode on mount and when it changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      // Apply dark mode directly to the component
      const container = document.getElementById('gallery-container');
      if (container) {
        container.style.colorScheme = isDark ? 'dark' : 'light';
      }
    };

    // Check initially
    checkDarkMode();

    // Watch for changes to the dark mode class
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });

    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const uploadExpiryOptions = [
    { label: '10 seconds', value: 10 / 86400 }, // Approx 0.0001157 days
    { label: '7 days', value: 7 },
    { label: '15 days', value: 15 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
  ];

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (selectedFile && onImageUpload) {
      await onImageUpload(selectedFile, altText, uploadAutoDelete, uploadAutoDelete ? uploadExpiryDays : undefined);
      setSelectedFile(null);
      setAltText("");
      setUploadAutoDelete(false);
      setShowUploadExpiryOptions(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
      <div 
        className="flex flex-col items-center justify-center h-60 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-200 dark:border-blue-800 p-6"
        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
      >
        <svg className="h-12 w-12 text-blue-300 dark:text-blue-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p className="text-blue-500 dark:text-blue-400 text-center">No images yet. Upload your first image below!</p>
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
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      id="gallery-container"
      className="w-full bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900"
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Image Gallery</h2>
      </div>

      {/* Upload Section */}
      <div 
        className="mb-6 p-4 bg-white/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
      >
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100 mb-3">Upload New Image</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-800 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-700 cursor-pointer"
              style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
            />
            <input 
              type="text" 
              placeholder="Alt text (optional)" 
              value={altText} 
              onChange={(e) => setAltText(e.target.value)}
              className="flex-grow p-2 rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-900/50 focus:ring-2 focus:ring-blue-500 outline-none placeholder-blue-400 dark:placeholder-blue-500"
              style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
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
                  if (e.target.checked) {
                    setShowUploadExpiryOptions(true);
                  } else {
                    setShowUploadExpiryOptions(false);
                  }
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
              />
              <label htmlFor="upload-auto-delete" className="text-sm text-blue-700 dark:text-blue-300">
                Auto-delete this image?
              </label>
            </div>

            {uploadAutoDelete && showUploadExpiryOptions && (
              <div className="flex items-center gap-2">
                 <select
                    value={uploadExpiryDays}
                    onChange={(e) => setUploadExpiryDays(parseInt(e.target.value, 10))}
                    className="p-1.5 rounded-md border border-blue-300 dark:border-blue-700 bg-white dark:bg-blue-900/50 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                  >
                    {uploadExpiryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
              </div>
            )}
            {uploadAutoDelete && !showUploadExpiryOptions && uploadAutoDelete && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Expires in {uploadExpiryDays} days.</p>
            )}
          </div>
          
          <button
            onClick={handleUploadClick}
            disabled={!selectedFile || isLoading}
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