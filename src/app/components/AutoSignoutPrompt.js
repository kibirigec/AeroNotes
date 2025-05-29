/**
 * Auto Signout First-Time Prompt
 * Shows on first login to explain auto signout feature and allow users to configure it
 */

import React, { useState } from 'react';

const AutoSignoutPrompt = ({ 
  isVisible, 
  onAccept, 
  onDisable, 
  onCustomize,
  isMobile = false,
  defaultTimeout = 20 
}) => {
  const [showCustomOptions, setShowCustomOptions] = useState(false);
  const [customTimeout, setCustomTimeout] = useState(defaultTimeout);

  if (!isVisible) return null;

  const handleCustomize = () => {
    if (showCustomOptions) {
      onCustomize(customTimeout);
    } else {
      setShowCustomOptions(true);
    }
  };

  const timeoutOptions = isMobile 
    ? [5, 10, 15, 30, 60] // Mobile options in minutes
    : [10, 15, 20, 30, 45, 60]; // Desktop options in minutes

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Dialog */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-600">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Auto Signout Protection
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keeping your notes and documents secure
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Welcome to AeroNotes! For your security, we've enabled automatic signout when you're inactive.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• You'll be signed out after <strong>{isMobile ? '10 minutes' : '20 minutes'}</strong> of inactivity</li>
                  <li>• Typing, clicking, or scrolling resets the timer</li>
                  <li>• You'll get a 2-minute warning before signout</li>
                  <li>• Auto-signout pauses while you're actively editing</li>
                  <li>• {isMobile ? 'Shorter timeout on mobile' : 'Longer timeout on desktop'} for your convenience</li>
                </ul>
              </div>

              {/* Custom timeout options */}
              {showCustomOptions && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Choose your timeout ({isMobile ? 'mobile' : 'desktop'}):
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeoutOptions.map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => setCustomTimeout(minutes)}
                        className={`p-2 text-sm rounded-lg border transition-all ${
                          customTimeout === minutes
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                You can change these settings anytime in your account preferences.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={showCustomOptions ? () => handleCustomize() : onAccept}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                {showCustomOptions ? `Enable with ${customTimeout} minute timeout` : 'Keep Auto Signout Enabled'}
              </button>
              
              {!showCustomOptions && (
                <button
                  onClick={handleCustomize}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                >
                  Customize Timeout
                </button>
              )}
              
              <button
                onClick={onDisable}
                className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Disable Auto Signout (Not Recommended)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AutoSignoutPrompt; 