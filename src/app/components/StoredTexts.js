"use client";
import { useState, useEffect, useRef } from "react";

export default function StoredTexts({ texts, onToggleAutoDelete, onDeleteNote }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isInteractingMap, setIsInteractingMap] = useState({});
  const [copiedItemId, setCopiedItemId] = useState(null);
  const [copyFallbackUsed, setCopyFallbackUsed] = useState(false);
  const [showMobileClipboardInfo, setShowMobileClipboardInfo] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  // Check if we're in development and not using HTTPS
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isHTTPS = window.location.protocol === 'https:';
  const showHTTPSNotice = isDevelopment && !isHTTPS && texts.length > 0;

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
    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    try {
      // Method 1: Try modern clipboard API first (works on most modern browsers with HTTPS)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedItemId(itemId);
        setCopyFallbackUsed(false);
        setTimeout(() => {
          setCopiedItemId(null);
        }, 2000);
        return;
      }
      
      // Method 2: Fallback for iOS Safari and other browsers
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('tabindex', '-1');
      
      document.body.appendChild(textArea);
      
      // For iOS Safari, we need to use a different approach
      if (isIOS) {
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }
      
      // Execute copy command
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedItemId(itemId);
        setCopyFallbackUsed(false);
        setTimeout(() => {
          setCopiedItemId(null);
        }, 2000);
      } else {
        throw new Error('Copy command was unsuccessful');
      }
      
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopyFallbackUsed(true);
      
      // Method 3: Final fallback - show alert with text to manually copy
      if (isIOS) {
        // For iOS, show informative message
        setShowMobileClipboardInfo(true);
        setTimeout(() => {
          alert('Text copied to clipboard! On iOS, you may need to manually paste using the "Paste" option in the context menu.');
        }, 100);
        setTimeout(() => {
          setShowMobileClipboardInfo(false);
        }, 5000);
      } else if (isMobile) {
        // For other mobile browsers
        setTimeout(() => {
          alert(`📱 Manual Copy Required:\n\n${textToCopy}\n\nPlease manually select and copy the text above.`);
        }, 100);
      } else {
        // For desktop browsers
        prompt('Copy this text:', textToCopy);
      }
      
      // Reset fallback flag after a short delay
      setTimeout(() => {
        setCopyFallbackUsed(false);
      }, 3000);
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
    <div 
      id="stored-texts-container"
      className="w-full h-full flex flex-col bg-slate-50/90 dark:bg-blue-950/70 rounded-2xl shadow-lg border border-slate-300 dark:border-blue-800"
    >
      <div 
        onClick={toggleExpanded}
        className="flex justify-between items-center p-6 cursor-pointer"
      >
        <h2 className="text-xl font-semibold text-slate-800 dark:text-blue-100">Stored Texts</h2>
        <div className="flex items-center gap-2">
          {texts.length > 0 && (
            <span className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-0.5 font-semibold shadow">
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
      
      {/* Mobile clipboard info banner */}
      {showMobileClipboardInfo && (
        <div className="mx-6 mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
          <div className="flex items-start">
            <span className="text-amber-600 dark:text-amber-400 text-lg mr-2">📱</span>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Mobile Copy Guide:</strong> Due to browser security, automatic copy isn&apos;t available. 
              Long press the text in the alert to select it, then choose &quot;Copy&quot; from the menu.
            </div>
          </div>
        </div>
      )}
      
      {/* HTTPS development notice */}
      {showHTTPSNotice && (
        <div className="mx-6 mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start">
            <span className="text-blue-600 dark:text-blue-400 text-lg mr-2">🔒</span>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Development Notice:</strong> For full clipboard functionality on mobile devices, 
              the app should be served over HTTPS. Currently using HTTP for development.
            </div>
          </div>
        </div>
      )}
      
      {/* Content with animation */}
      <div 
        className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex-1 p-6 pt-0 whitespace-pre-wrap text-slate-800 dark:text-blue-100 overflow-auto">
          {texts.length > 0 ? (
            <ul className="space-y-3">
              {texts.map((item) => (
                <li 
                  key={item.id} 
                  className={`p-3 bg-white dark:bg-blue-900/40 rounded-lg border flex flex-col sm:flex-row sm:justify-between sm:items-start shadow-sm transition-all duration-300 gap-3 ${
                    item.autoDelete && item.expiry_date
                      ? 'amber-border-effect' 
                      : 'border-slate-300 dark:border-blue-700'
                  }`}
                >
                  <span className="flex-1 min-w-0 break-words overflow-wrap-anywhere text-slate-500 dark:text-slate-400 sm:pr-4">{item.text}</span>
                  <div className="flex items-center flex-shrink-0 justify-end sm:justify-start">
                    <button 
                      onClick={() => handleCopyText(item.text, item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleCopyText(item.text, item.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredButton(`copy-${item.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      title={copyFallbackUsed ? "Copy (manual method)" : "Copy text"}
                      className={`p-2 z-10 mr-2 rounded-lg transition-all duration-150 ease-in-out shadow-lg hover:shadow-xl border font-medium
                        ${copyFallbackUsed 
                          ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600' 
                          : 'bg-blue-100 dark:bg-[#152047] border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600'
                        }
                        ${hoveredButton === `copy-${item.id}` ? 'transform -translate-y-0.5' : ''}
                      `}
                      aria-label={`Copy text: ${item.text.substring(0, 50)}${item.text.length > 50 ? '...' : ''}`}
                    >
                      {copiedItemId === item.id ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteNote(item.id)}
                      onMouseEnter={() => setHoveredButton(`delete-${item.id}`)}
                      onMouseLeave={() => setHoveredButton(null)}
                      title="Delete note immediately"
                      className={`p-2 mr-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-150 ease-in-out border font-medium
                        bg-red-100 dark:bg-[#152047] border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 
                        hover:bg-red-200 dark:hover:bg-red-900/30 hover:border-red-400 dark:hover:border-red-600
                        ${hoveredButton === `delete-${item.id}` ? 'transform -translate-y-0.5' : ''}
                      `}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="flex flex-col items-end min-h-[2.5rem]">
                      <label htmlFor={`auto-delete-${item.id}`} className="text-xs sm:text-sm text-slate-600 dark:text-blue-300 text-center sm:text-right">
                        Auto-delete
                      </label>
                      {item.autoDelete && item.expiry_date && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 mt-0.5 text-center sm:text-right">
                          Expires {formatRelativeExpiry(item.expiry_date)}
                        </span>
                      )}
                      {item.autoDelete && !item.expiry_date && (
                         <span className="text-xs text-green-500 dark:text-green-400 mt-0.5 text-center sm:text-right">
                          On (Expiry pending)
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleToggleClick(item.id)}
                      className={`
                        w-10 h-5 flex items-center rounded-full p-0.5 ml-2 sm:ml-3
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
            <div 
              className="flex flex-col items-center justify-center h-40 bg-white/80 dark:bg-blue-900/30 rounded-xl border border-dashed border-slate-400 dark:border-blue-700"
            >
              <svg className="h-10 w-10 text-slate-400 dark:text-blue-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <p className="text-slate-500 dark:text-blue-400 text-sm">No stored texts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 