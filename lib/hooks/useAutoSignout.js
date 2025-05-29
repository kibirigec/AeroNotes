/**
 * Auto Signout Hook
 * Manages automatic user signout based on inactivity with warnings and smart behaviors
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useActivityTracker } from './useActivityTracker';

export const useAutoSignout = ({
  enabled = true,
  desktopTimeoutMs = 20 * 60 * 1000, // 20 minutes default
  mobileTimeoutMs = 10 * 60 * 1000,   // 10 minutes default
  warningTimeMs = 2 * 60 * 1000,      // 2 minutes warning
  onSignout = null,
  onWarning = null,
  checkUnsavedChanges = null, // Function to check if there are unsaved changes
  userId = null
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const warningTimerRef = useRef(null);
  const signoutTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const lastResetTimeRef = useRef(Date.now());

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get appropriate timeout based on device
  const getTimeoutMs = useCallback(() => {
    return isMobile ? mobileTimeoutMs : desktopTimeoutMs;
  }, [isMobile, mobileTimeoutMs, desktopTimeoutMs]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (signoutTimerRef.current) {
      clearTimeout(signoutTimerRef.current);
      signoutTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Show warning dialog
  const showWarningDialog = useCallback(() => {
    setShowWarning(true);
    setTimeLeft(warningTimeMs);
    
    if (onWarning) {
      onWarning(warningTimeMs);
    }

    // Start countdown timer
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    // Set final signout timer
    signoutTimerRef.current = setTimeout(() => {
      handleAutoSignout();
    }, warningTimeMs);
  }, [warningTimeMs, onWarning]);

  // Handle auto signout
  const handleAutoSignout = useCallback(async () => {
    // Check for unsaved changes
    if (checkUnsavedChanges && checkUnsavedChanges()) {
      // Show warning instead of signing out
      if (!showWarning) {
        showWarningDialog();
      }
      return;
    }

    // Clear all timers
    clearAllTimers();
    setShowWarning(false);

    // Call signout callback
    if (onSignout) {
      await onSignout();
    }
  }, [checkUnsavedChanges, showWarning, showWarningDialog, clearAllTimers, onSignout]);

  // Reset timers after activity
  const resetTimers = useCallback(() => {
    const now = Date.now();
    lastResetTimeRef.current = now;
    
    // Clear existing timers
    clearAllTimers();
    setShowWarning(false);

    const timeoutMs = getTimeoutMs();
    const warningStartTime = timeoutMs - warningTimeMs;

    // Set warning timer
    if (warningStartTime <= 0 && timeoutMs > 0) {
      showWarningDialog();
    } else if (warningStartTime > 0) {
      warningTimerRef.current = setTimeout(() => {
        showWarningDialog();
      }, warningStartTime);
    }
  }, [clearAllTimers, getTimeoutMs, warningTimeMs, showWarningDialog, isMobile]);

  // Activity tracker
  const { isActivelyTyping, detectActivity } = useActivityTracker({
    enabled,
    onActivity: resetTimers,
    debounceMs: 2000 // Less sensitive to avoid too frequent resets
  });

  // Extend session function (for warning dialog)
  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Pause timers during active typing
  useEffect(() => {
    if (!enabled) return;

    if (isActivelyTyping) {
      clearAllTimers();
      setShowWarning(false);
    } else if (lastResetTimeRef.current) {
      // Resume timers when typing stops
      const timeSinceLastReset = Date.now() - lastResetTimeRef.current;
      const timeoutMs = getTimeoutMs();
      
      if (timeSinceLastReset < timeoutMs) {
        const remainingTime = timeoutMs - timeSinceLastReset;
        const warningStartTime = Math.max(0, remainingTime - warningTimeMs);
        
        if (warningStartTime > 0) {
          // Still time before warning
          warningTimerRef.current = setTimeout(() => {
            showWarningDialog();
          }, warningStartTime);
        } else {
          // Should already be showing warning
          showWarningDialog();
        }
      }
    }
  }, [isActivelyTyping, enabled, getTimeoutMs, warningTimeMs, showWarningDialog, clearAllTimers]);

  // Initialize timers when hook starts
  useEffect(() => {
    if (enabled && userId) {
      resetTimers();
    } else {
      clearAllTimers();
      setShowWarning(false);
    }

    return () => {
      clearAllTimers();
    };
  }, [enabled, userId, resetTimers, clearAllTimers]);

  // Reset timers when timeout values change
  useEffect(() => {
    if (enabled && userId) {
      resetTimers();
    }
  }, [desktopTimeoutMs, mobileTimeoutMs, enabled, userId, resetTimers]);

  // Format time for display
  const formatTimeLeft = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    showWarning,
    timeLeft,
    formatTimeLeft: formatTimeLeft(),
    extendSession,
    resetTimers,
    isActivelyTyping,
    isMobile,
    timeoutMinutes: Math.floor(getTimeoutMs() / 60000),
    lastActivity: lastResetTimeRef.current,
    detectActivity
  };
}; 