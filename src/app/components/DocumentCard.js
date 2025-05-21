import React, { useState } from 'react';

const DocumentCard = ({ 
  doc, 
  onToggleAutoDelete, 
  onDeleteDocument, 
  formatLastEdited, 
  getDocRemainingTime 
}) => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const getFileExtension = (urlOrPath) => {
    if (!urlOrPath) return '';
    const pathWithoutQuery = urlOrPath.split('?')[0];
    const parts = pathWithoutQuery.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const fileExtension = getFileExtension(doc.content || doc.title); // Prefer doc.content for URL, fallback to title if it might contain filename

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
    // Ensure doc.content is properly encoded for the Google Docs Viewer URL
    previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(doc.content)}&embedded=true`;
  }

  const handleToggleClick = () => {
    if (isInteracting) return;

    setIsInteracting(true);

    setTimeout(() => {
      onToggleAutoDelete(doc.id);

      setTimeout(() => {
        setIsInteracting(false);
      }, 300 + 50);
    }, 150);
  };

  return (
    <>
      <div className="bg-white/90 dark:bg-blue-900/40 rounded-xl p-4 border border-blue-100 dark:border-blue-800 hover:shadow-md transition flex flex-col">
        <div className="flex items-start">
          <div className="bg-blue-100 dark:bg-blue-800/60 p-2 rounded-lg mr-3">
            <svg className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-100 " title={doc.title}>{doc.title}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Last edited: {formatLastEdited(doc.lastEdited)}
                </p>
                <div className="flex mt-3">
                  <button 
                    onClick={handleOpenClick}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 mr-3"
                  >
                    Open
                  </button>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 mr-3">Share</button>
                  <button 
                    onClick={() => onDeleteDocument(doc.id)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="flex flex-col items-end mr-2 h-8">
                    <label htmlFor={`auto-delete-doc-${doc.id}`} className="text-xs text-blue-700 dark:text-blue-300">
                      Auto-delete
                    </label>
                    {doc.autoDelete && doc.createdAt && (
                      <span className="text-xs text-orange-500 dark:text-orange-300 mt-0.5">
                        Deleting in {getDocRemainingTime(doc)}s
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleToggleClick}
                    className={`
                      w-10 h-5 flex items-center rounded-full p-0.5 
                      transition-colors duration-300 ease-in-out 
                      transition-transform duration-150 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800
                      ${doc.autoDelete ? 'bg-green-500 dark:bg-green-600' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}
                      ${isInteracting ? 'scale-95' : 'scale-100'}
                    `}
                    aria-pressed={doc.autoDelete}
                    aria-label={`Toggle auto-delete for ${doc.title}`}
                    disabled={isInteracting}
                  >
                    <span className={`
                      bg-white dark:bg-gray-100 w-4 h-4 rounded-full shadow-md 
                      transform transition-transform duration-300 ease-in-out
                      ${doc.autoDelete ? 'translate-x-5' : 'translate-x-0'}
                    `} />
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              <h5 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">{doc.title || 'Document Preview'}</h5>
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
              title={doc.title || 'Document Preview'}
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