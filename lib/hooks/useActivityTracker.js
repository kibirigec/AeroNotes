/**
 * Activity Tracker Hook
 * Tracks user activity across mouse, keyboard, touch, and scroll events
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export const useActivityTracker = ({ 
  enabled = true,
  debounceMs = 1000, // Debounce activity detection
  onActivity = null // Callback when activity is detected
}) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isActivelyTyping, setIsActivelyTyping] = useState(false);
  const debounceTimerRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Activity detection function
  const detectActivity = useCallback(() => {
    if (!enabled) return;

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the activity update
    debounceTimerRef.current = setTimeout(() => {
      const now = Date.now();
      setLastActivity(now);
      
      if (onActivity) {
        onActivity(now);
      }
      
      console.log('🔔 User activity detected at:', new Date(now).toLocaleTimeString());
    }, debounceMs);
  }, [enabled, debounceMs, onActivity]);

  // Typing detection (for pause-during-editing feature)
  const detectTyping = useCallback(() => {
    if (!enabled) return;

    setIsActivelyTyping(true);
    
    // Clear existing typing timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    // Consider typing stopped after 3 seconds of no key activity
    typingTimerRef.current = setTimeout(() => {
      setIsActivelyTyping(false);
    }, 3000);

    // Also trigger general activity
    detectActivity();
  }, [enabled, detectActivity]);

  useEffect(() => {
    if (!enabled) return;

    // Activity event listeners
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'click',
      'scroll',
      'touchstart',
      'touchmove',
      'touchend',
      'wheel',
      'focus',
      'blur',
      'visibilitychange'
    ];

    // Typing-specific events
    const typingEvents = [
      'keydown',
      'keypress',
      'input',
      'paste'
    ];

    // File interaction events
    const fileEvents = [
      'drop',
      'dragover'
    ];

    // Add activity listeners
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, detectActivity, { passive: true });
    });

    // Add typing listeners
    typingEvents.forEach(eventType => {
      document.addEventListener(eventType, detectTyping, { passive: true });
    });

    // Add file interaction listeners
    fileEvents.forEach(eventType => {
      document.addEventListener(eventType, detectActivity, { passive: true });
    });

    // Cleanup function
    return () => {
      activityEvents.forEach(eventType => {
        document.removeEventListener(eventType, detectActivity);
      });
      
      typingEvents.forEach(eventType => {
        document.removeEventListener(eventType, detectTyping);
      });

      fileEvents.forEach(eventType => {
        document.removeEventListener(eventType, detectActivity);
      });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, [enabled, detectActivity, detectTyping]);

  // Get time since last activity
  const getTimeSinceLastActivity = useCallback(() => {
    return Date.now() - lastActivity;
  }, [lastActivity]);

  // Check if user has been inactive for specified duration
  const isInactiveFor = useCallback((milliseconds) => {
    return getTimeSinceLastActivity() >= milliseconds;
  }, [getTimeSinceLastActivity]);

  return {
    lastActivity,
    isActivelyTyping,
    getTimeSinceLastActivity,
    isInactiveFor,
    detectActivity // Manual activity trigger
  };
}; 