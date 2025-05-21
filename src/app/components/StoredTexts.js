"use client";
import { useState, useEffect, useRef } from "react";

export default function StoredTexts({ texts, onToggleAutoDelete }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isInteractingMap, setIsInteractingMap] = useState({});
  const [copiedItemId, setCopiedItemId] = useState(null);

  // Force re-render periodically for relative time updates if needed for expiry
  // This is a simple way, could be optimized with a more targeted approach if performance issues arise
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 60000); // Update every minute to refresh relative times
    return () => clearInterval(interval);
  }, []);

  // Toggle expansion
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatRelativeExpiry = (isoString) => {
    if (!isoString) return 'N/A';
    const now = new Date();
    const expiry = new Date(isoString);
    if (isNaN(expiry.getTime())) return 'Invalid Date';

    const diffSeconds = Math.round((expiry - now) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds > 0) { // Future
      if (diffSeconds < 60) return `in ${diffSeconds}s`;
      if (diffMinutes < 60) return `in ${diffMinutes}m`;
      if (diffHours < 24) return `in ${diffHours}h`;
      if (diffDays === 1) return `in 1 day`;
      return `in ${diffDays} days`;
    } else { // Past or now
      if (diffSeconds > -60) return `Expired`; // Within the last minute
      if (diffMinutes > -60) return `Expired ${-diffMinutes}m ago`;
      if (diffHours > -24) return `Expired ${-diffHours}h ago`;
      if (diffDays === -1) return `Expired 1 day ago`;
      return `Expired ${-diffDays} days ago`;
    }
  };

  const handleCopyText = async (textToCopy, itemId) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedItemId(itemId);
      setTimeout(() => {
        setCopiedItemId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleToggleClick = (itemId) => {
    if (isInteractingMap[itemId]) return;

    setIsInteractingMap(prev => ({ ...prev, [itemId]: true }));

    setTimeout(() => {
      onToggleAutoDelete(itemId);
      
      setTimeout(() => {
        setIsInteractingMap(prev => ({ ...prev, [itemId]: false }));
      }, 300 + 50);
    }, 150);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white/80 dark:bg-blue-950/70 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-900">
      <div 
        onClick={toggleExpanded}
        className="flex justify-between items-center p-6 cursor-pointer"
      >
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Stored Texts</h2>
        <div className="flex items-center gap-2">
          {texts.length > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {texts.length}
            </span>
          )}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 text-blue-500 dark:text-blue-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Content with animation */}
      <div 
        className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex-1 p-6 pt-0 whitespace-pre-wrap text-blue-900 dark:text-blue-100 overflow-auto">
          {texts.length > 0 ? (
            <ul className="space-y-2">
              {texts.map((item) => (
                <li key={item.id} className="p-3 bg-white/70 dark:bg-blue-900/40 rounded-lg border border-blue-100 dark:border-blue-800 flex justify-between items-start">
                  <span className="flex-1 pr-4 break-all">{item.text}</span>
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleCopyText(item.text, item.id)}
                      title="Copy text"
                      className="p-1.5 mr-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-300 transition-colors"
                    >
                      {copiedItemId === item.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <div className="flex flex-col items-end min-h-[2.5rem]">
                      <label htmlFor={`auto-delete-${item.id}`} className="text-sm text-blue-700 dark:text-blue-300">
                        Auto-delete
                      </label>
                      {item.autoDelete && item.expiry_date && (
                        <span className="text-xs text-orange-500 dark:text-orange-300 mt-0.5">
                          Expires {formatRelativeExpiry(item.expiry_date)}
                        </span>
                      )}
                      {item.autoDelete && !item.expiry_date && (
                         <span className="text-xs text-green-500 dark:text-green-400 mt-0.5">
                          On (Expiry pending)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleClick(item.id)}
                      className={`
                        w-10 h-5 flex items-center rounded-full p-0.5 
                        transition-colors duration-300 ease-in-out 
                        transition-transform duration-150 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800
                        ${
                          item.autoDelete 
                            ? 'bg-green-500 dark:bg-green-600' 
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }
                        ${isInteractingMap[item.id] ? 'scale-95' : 'scale-100'}
                      `}
                      aria-pressed={item.autoDelete}
                      aria-label={`Toggle auto-delete for note ${item.text ? item.text.substring(0,20) : ''}`}
                      disabled={isInteractingMap[item.id]}
                    >
                      <span
                        className={`
                          bg-white dark:bg-gray-100 w-4 h-4 rounded-full shadow-md 
                          transform transition-transform duration-300 ease-in-out
                          ${
                            item.autoDelete ? 'translate-x-5' : 'translate-x-0'
                          }
                        `}
                      />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 bg-white/50 dark:bg-blue-900/30 rounded-xl border border-dashed border-blue-200 dark:border-blue-800">
              <svg className="h-10 w-10 text-blue-300 dark:text-blue-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <p className="text-blue-500 dark:text-blue-400 text-sm">No stored texts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 