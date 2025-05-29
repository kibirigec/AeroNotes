/**
 * Auto Signout Timer
 * Shows a visible countdown timer for auto signout
 */

import React, { useState, useEffect, useCallback } from 'react';

const AutoSignoutTimer = ({ 
  enabled = false,
  timeoutMinutes = 20,
  isActivelyTyping = false,
  lastActivity = Date.now(),
  isMobile = false,
  onActivity = null
}) => {
  const [timeLeft, setTimeLeft] = useState(timeoutMinutes * 60 * 1000);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate time left based on last activity
  const updateTimeLeft = useCallback(() => {
    if (!enabled) {
      setTimeLeft(0);
      return;
    }

    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    const totalTimeout = timeoutMinutes * 60 * 1000;
    const remaining = Math.max(0, totalTimeout - timeSinceActivity);
    
    setTimeLeft(remaining);
  }, [enabled, timeoutMinutes, lastActivity]);

  // Update timer every second
  useEffect(() => {
    if (!enabled) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, updateTimeLeft]);

  // Update when lastActivity changes
  useEffect(() => {
    updateTimeLeft();
  }, [updateTimeLeft]);

  // Handle pause state for typing
  useEffect(() => {
    setIsPaused(isActivelyTyping);
  }, [isActivelyTyping]);

  // Reset timer state when enabled changes
  useEffect(() => {
    if (enabled) {
      setTimeLeft(timeoutMinutes * 60 * 1000);
      updateTimeLeft();
    } else {
      setTimeLeft(0);
      setIsPaused(false);
    }
  }, [enabled, timeoutMinutes, updateTimeLeft]);

  // Early return if disabled - this ensures immediate hiding
  if (!enabled) return null;

  // Format time display
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get color based on time remaining
  const getTimerColor = () => {
    const minutes = Math.floor(timeLeft / 60000);
    
    if (isPaused) {
      return 'text-amber-600 dark:text-amber-400'; // Yellow when paused
    } else if (minutes <= 2) {
      return 'text-red-600 dark:text-red-400'; // Red when critical
    } else if (minutes <= 5) {
      return 'text-orange-600 dark:text-orange-400'; // Orange when warning
    } else {
      return 'text-gray-600 dark:text-gray-400'; // Gray when safe
    }
  };

  // Get icon based on state
  const getTimerIcon = () => {
    if (isPaused) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const minutes = Math.floor(timeLeft / 60000);

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`flex items-center space-x-1 ${getTimerColor()}`}>
        {getTimerIcon()}
        <span className={`font-mono ${isPaused ? 'opacity-60' : ''}`}>
          {formatTime(timeLeft)}
        </span>
        {isPaused && (
          <span className="text-xs">(paused)</span>
        )}
      </div>
      
      {/* Device indicator */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {isMobile ? '📱' : '💻'}
      </div>
      
      {/* Tooltip on hover */}
      <div className="relative group">
        <button 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          onClick={onActivity}
          title="Reset timer"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Hover tooltip */}
        <div className="absolute left-0 top-6 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 z-50 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Auto Signout Timer</div>
          <div className="space-y-1 text-gray-700 dark:text-gray-300">
            <div>Time until signout: <span className="font-mono">{formatTime(timeLeft)}</span></div>
            <div>Device: {isMobile ? 'Mobile' : 'Desktop'} ({timeoutMinutes}m timeout)</div>
            {isPaused && <div className="text-amber-600 dark:text-amber-400">⏸️ Paused while typing</div>}
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
              Any activity will reset the timer. Click to reset manually.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSignoutTimer; 