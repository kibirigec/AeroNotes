import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

const DocumentCard = ({ 
  doc, 
  onToggleAutoDelete, 
  onDeleteDocument, 
  formatLastEdited, 
  getDocRemainingTime,
  isDarkMode
}) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showTimeoutOptions, setShowTimeoutOptions] = useState(false);
  const [selectedExpiryDays, setSelectedExpiryDays] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    if (doc.auto_delete && doc.expiry_date) {
      const updateRemainingTime = () => {
        const expiry = parseISO(doc.expiry_date);
        const now = new Date();
        if (expiry > now) {
          setRemainingTime(formatDistanceToNow(expiry, { addSuffix: true }));
        } else {
          setRemainingTime('Expired');
        }
      };
      updateRemainingTime();
      const intervalId = setInterval(updateRemainingTime, 60000);
      return () => clearInterval(intervalId);
    } else {
      setRemainingTime('');
    }
  }, [doc.auto_delete, doc.expiry_date]);

  const getFileExtension = (urlOrPathOrFileName) => {
    if (!urlOrPathOrFileName) return '';
    const targetString = doc.content || urlOrPathOrFileName;
    const pathWithoutQuery = targetString.split('?')[0];
    const parts = pathWithoutQuery.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const fileExtension = getFileExtension(doc.file_name);

  const isPdf = fileExtension === 'pdf';
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension);
  const canPreviewInModal = isPdf || isOfficeDoc;

  const handleOpenClick = () => {
    if (canPreviewInModal) {
      setIsPreviewModalOpen(true);
    } else if (doc.content) {
      window.open(doc.content, '_blank', 'noopener,noreferrer');
    } else {
      alert('No content available to open.');
    }
  };

  const closeModal = () => {
    setIsPreviewModalOpen(false);
  };

  let previewUrl = '';
  if (isPdf) {
    previewUrl = doc.content;
  } else if (isOfficeDoc) {
    previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(doc.content)}&embedded=true`;
  }

  const handleToggleAutoDelete = async () => {
    if (isInteracting) return;
    setIsInteracting(true);

    try {
      await onToggleAutoDelete(doc.id, !doc.auto_delete);
    } catch (error) {
      console.error("Failed to toggle auto delete:", error);
    } finally {
      setTimeout(() => {
        setIsInteracting(false);
      }, 500);
    }
  };

  const expiryOptions = [
    { label: '10 seconds', value: 10 / 86400 }, // Approx 0.0001157 days
    { label: '1 day', value: 1 },
    { label: '3 days', value: 3 },
    { label: '7 days', value: 7 },
    { label: '15 days', value: 15 },
    { label: '30 days', value: 30 },
  ];

  const handleExpirySelect = (days) => {
    setSelectedExpiryDays(days);
    setIsInteracting(true);
    
    setTimeout(() => {
      onToggleAutoDelete(doc.id, true, days);
      setShowTimeoutOptions(false);
      
      setTimeout(() => {
        setIsInteracting(false);
        setSelectedExpiryDays(null);
      }, 300);
    }, 150);
  };

  const closeTimeoutSelector = () => {
    setShowTimeoutOptions(false);
    setSelectedExpiryDays(null);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${doc.title || doc.file_name}"?`)) {
      onDeleteDocument(doc.id);
    }
  };

  // Document type icon
  const getDocumentIcon = () => {
    const type = doc.content_type || '';
    if (type.includes('pdf')) {
      return (
        <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.includes('word') || type.includes('doc')) {
      return (
        <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else if (type.includes('text') || type.includes('txt')) {
      return (
        <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    }
    // Default document icon
    return (
      <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
      </svg>
    );
  };

  return (
    <>
      <div 
        className="p-4 bg-white/70 dark:bg-blue-900/40 rounded-lg border border-blue-100 dark:border-blue-800 flex flex-col"
        style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {getDocumentIcon()}
            <h3 className="ml-2 text-lg font-medium text-blue-800 dark:text-blue-100 truncate max-w-[200px]" title={doc.title || doc.file_name}>
              {doc.title || doc.file_name}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-end">
              {doc.auto_delete && doc.expiry_date && (
                <span className="text-xs text-orange-500 dark:text-orange-300 mb-1">
                  {getDocRemainingTime ? getDocRemainingTime(doc.expiry_date) : `Expires soon`}
                </span>
              )}
              <div className="flex items-center">
                <label htmlFor={`auto-delete-doc-${doc.id}`} className="text-xs text-blue-700 dark:text-blue-300 mr-1.5">
                  Auto-del
                </label>
                <button
                  id={`auto-delete-doc-${doc.id}`}
                  onClick={handleToggleAutoDelete}
                  className={`w-9 h-4 flex items-center rounded-full p-0.5 transition-colors duration-300 ${doc.auto_delete ? 'bg-green-500' : 'bg-gray-500 hover:bg-gray-400'} ${isInteracting ? 'opacity-70' : ''}`}
                  aria-pressed={doc.auto_delete}
                  aria-label="Toggle auto-delete for document"
                  disabled={isInteracting}
                >
                  <span className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${doc.auto_delete ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatLastEdited ? formatLastEdited(doc.updated_at || doc.created_at) : 'Recently added'}
            </span>
            <a 
              href={doc.content} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center"
            >
              View
              <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </div>
        </div>
        
        <div className="flex justify-end mt-3">
          <button 
            onClick={handleDelete}
            className="flex items-center text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Delete
          </button>
        </div>
      </div>

      {canPreviewInModal && isPreviewModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8 md:p-12 lg:p-16"
          onClick={closeModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full h-full flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <h5 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">{doc.file_name || 'Document Preview'}</h5>
              <button 
                onClick={closeModal}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
                aria-label="Close preview"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </button>
            </div>
            <iframe
              src={previewUrl}
              width="100%"
              height="100%" 
              title={doc.file_name || 'Document Preview'}
              className="flex-grow border-none"
            >
              Your browser does not support iframes or the content cannot be displayed. You can try to <a href={doc.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">download the document here</a>.
            </iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentCard; 