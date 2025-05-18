"use client";
import { useState, useEffect, useRef } from "react";

export default function StoredTexts({ texts, onToggleAutoDelete }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Toggle expansion
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Calculate remaining time for auto-delete
  const getRemainingTime = (item) => {
    // Check both possible property names for autoDelete
    const isAutoDelete = item.autoDelete !== undefined ? item.autoDelete : item.auto_delete;
    if (!isAutoDelete) return null;
    
    // Check both possible property names for createdAt
    const createdTime = item.createdAt || (item.created_at ? new Date(item.created_at).getTime() : null);
    if (!createdTime) return null;
    
    const elapsedTime = Date.now() - createdTime;
    const remainingTime = Math.max(0, 7000 - elapsedTime);
    
    // Return as seconds with one decimal place
    return (remainingTime / 1000).toFixed(1);
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
        className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 pt-0 whitespace-pre-wrap text-blue-900 dark:text-blue-100 overflow-auto max-h-[300px] lg:max-h-[284px]">
          {texts.length > 0 ? (
            <ul className="space-y-2">
              {texts.map((item, index) => (
                <li key={item.id || index} className="p-3 bg-white/70 dark:bg-blue-900/40 rounded-lg border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                  <span className="flex-1 pr-4">{item.content}</span>
                  <div className="flex items-center">
                    <div className="flex flex-col items-end mr-2">
                      <label htmlFor={`auto-delete-${index}`} className="text-sm text-blue-700 dark:text-blue-300">
                        Auto-delete
                      </label>
                      {item.autoDelete && (
                        <span className="text-xs text-orange-500 dark:text-orange-300 mt-0.5">
                          Deleting in {getRemainingTime(item)}s
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleAutoDelete(index)}
                      className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                        item.autoDelete 
                          ? 'bg-green-500 dark:bg-green-600' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                      aria-pressed={item.autoDelete}
                      aria-label={`Toggle auto-delete for text ${index + 1}`}
                    >
                      <span
                        className={`bg-white dark:bg-gray-200 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          item.autoDelete ? 'translate-x-5' : 'translate-x-0'
                        }`}
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