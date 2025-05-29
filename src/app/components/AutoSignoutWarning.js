/**
 * Auto Signout Warning Dialog
 * Shows before automatic signout with countdown and options
 */

import React from 'react';

const AutoSignoutWarning = ({ 
  isVisible, 
  timeLeft, 
  formatTimeLeft, 
  onExtendSession, 
  onSignOutNow,
  hasUnsavedChanges = false 
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Dialog */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-600">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Session Timeout Warning
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You will be signed out soon due to inactivity
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Countdown */}
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {formatTimeLeft}
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {hasUnsavedChanges 
                  ? "You have unsaved changes. Please save your work or extend your session."
                  : "You'll be automatically signed out when the timer reaches zero."
                }
              </p>
            </div>

            {/* Unsaved changes warning */}
            {hasUnsavedChanges && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Unsaved Changes Detected
                  </span>
                </div>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Save your work before signing out to prevent data loss.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onExtendSession}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm"
              >
                Stay Signed In
              </button>
              
              {!hasUnsavedChanges && (
                <button
                  onClick={onSignOutNow}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                >
                  Sign Out Now
                </button>
              )}
            </div>

            {/* Additional info */}
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Any activity will automatically extend your session</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AutoSignoutWarning; 