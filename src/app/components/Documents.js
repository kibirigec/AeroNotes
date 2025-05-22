import React, { useState, useRef, useEffect } from 'react';
import DocumentCard from './DocumentCard';

const Documents = ({ 
  documents, 
  isLoadingDocuments, 
  onAddDocument, 
  onDeleteDocument, 
  onToggleAutoDelete,
  formatLastEdited,
  getDocRemainingTime 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef(null);

  // Check for dark mode on mount and when it changes
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      // Apply dark mode directly to the component
      const container = document.getElementById('documents-container');
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

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid document file (PDF, DOC, DOCX, or TXT)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    // Call the onAddDocument with the file
    onAddDocument(formData)
      .then(() => {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      })
      .catch(error => {
        console.error('Error uploading document:', error);
        alert('Failed to upload document. Please try again.');
        setIsUploading(false);
        setUploadProgress(0);
      })
      .finally(() => {
        clearInterval(progressInterval);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      });
  };

  return (
    <div 
      id="documents-container"
      className="w-full bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg p-6 border border-blue-100 dark:border-blue-900"
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Documents</h2>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            disabled={isUploading}
            style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow transition text-sm dark:bg-blue-700 dark:hover:bg-blue-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>

      {isUploading && (
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700" style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}>
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            Uploading document... {uploadProgress}%
          </p>
        </div>
      )}
      
      {isLoadingDocuments ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : documents.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center h-60 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-200 dark:border-blue-800"
          style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
        >
          <svg className="h-12 w-12 text-blue-300 dark:text-blue-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-blue-500 dark:text-blue-400">No documents yet. Upload your first one!</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow transition text-sm dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onToggleAutoDelete={onToggleAutoDelete}
              onDeleteDocument={onDeleteDocument}
              formatLastEdited={formatLastEdited}
              getDocRemainingTime={getDocRemainingTime}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents; 