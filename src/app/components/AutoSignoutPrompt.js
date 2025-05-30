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
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        {/* Dialog */}
        <div className="bg-slate-50/95 dark:bg-blue-950/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-lg w-full border border-slate-300 dark:border-blue-800">
          {/* Header */}
          <div className="p-6 border-b border-slate-300 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-blue-100">
                  Auto Signout Protection
                </h3>
                <p className="text-sm text-slate-600 dark:text-blue-300">
                  Keeping your notes and documents secure
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-slate-700 dark:text-blue-200 mb-4">
                Welcome to AeroNotes! For your security, we&apos;ve enabled automatic signout when you&apos;re inactive.
              </p>
              
              <div className="bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 rounded-xl p-4 mb-4 shadow-sm">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• You&apos;ll be signed out after <strong>{isMobile ? '10 minutes' : '20 minutes'}</strong> of inactivity</li>
                  <li>• Typing, clicking, or scrolling resets the timer</li>
                  <li>• You&apos;ll get a 2-minute warning before signout</li>
                  <li>• Auto-signout pauses while you&apos;re actively editing</li>
                  <li>• {isMobile ? 'Shorter timeout on mobile' : 'Longer timeout on desktop'} for your convenience</li>
                </ul>
              </div>

              {/* Custom timeout options */}
              {showCustomOptions && (
                <div className="mb-4 p-4 bg-white/80 dark:bg-blue-900/40 rounded-xl border border-slate-300 dark:border-blue-700 shadow-sm">
                  <h4 className="font-semibold text-slate-800 dark:text-blue-100 mb-3">
                    Choose your timeout ({isMobile ? 'mobile' : 'desktop'}):
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeoutOptions.map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => setCustomTimeout(minutes)}
                        className={`p-2 text-sm rounded-lg border transition-all duration-150 font-medium shadow-sm hover:shadow-md ${
                          customTimeout === minutes
                            ? 'bg-blue-200 dark:bg-[#1a2655] border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200 shadow-md'
                            : 'bg-white dark:bg-blue-900/40 border-slate-300 dark:border-blue-700 text-slate-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-[#152047] hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                      >
                        {minutes} min
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-500 dark:text-blue-400">
                You can change these settings anytime in your account preferences.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={showCustomOptions ? () => handleCustomize() : onAccept}
                className="w-full bg-blue-100 dark:bg-[#152047] border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-[#1a2655] hover:border-blue-400 dark:hover:border-blue-600 font-semibold py-3 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                {showCustomOptions ? `Enable with ${customTimeout} minute timeout` : 'Keep Auto Signout Enabled'}
              </button>
              
              {!showCustomOptions && (
                <button
                  onClick={handleCustomize}
                  className="w-full bg-white dark:bg-blue-900/40 border border-slate-300 dark:border-blue-700 text-slate-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-[#152047] hover:border-blue-300 dark:hover:border-blue-600 font-semibold py-3 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Customize Timeout
                </button>
              )}
              
              <button
                onClick={onDisable}
                className="w-full bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 hover:border-red-400 dark:hover:border-red-600 font-medium py-2 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md text-sm"
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