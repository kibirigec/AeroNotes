/**
 * User Preferences Service
 * Manages user preferences including auto signout settings
 */

const PREFERENCES_KEY = 'aeronotes_user_preferences';

// Default preferences
const defaultPreferences = {
  autoSignout: {
    enabled: true,
    desktopTimeoutMinutes: 20,
    mobileTimeoutMinutes: 10,
    hasSeenPrompt: false
  },
  theme: 'system', // light, dark, system
  notifications: {
    enabled: true,
    autoDelete: true
  }
};

/**
 * Get user preferences from localStorage with fallback to defaults
 */
export const getUserPreferences = () => {
  try {
    if (typeof window === 'undefined') {
      return defaultPreferences;
    }

    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (!stored) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(stored);
    
    // Merge with defaults to ensure all keys exist
    return {
      ...defaultPreferences,
      ...parsed,
      autoSignout: {
        ...defaultPreferences.autoSignout,
        ...parsed.autoSignout
      },
      notifications: {
        ...defaultPreferences.notifications,
        ...parsed.notifications
      }
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return defaultPreferences;
  }
};

/**
 * Save user preferences to localStorage
 */
export const saveUserPreferences = (preferences) => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    const merged = {
      ...getUserPreferences(),
      ...preferences
    };

    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged));
    console.log('✅ User preferences saved:', merged);
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

/**
 * Update auto signout preferences
 */
export const updateAutoSignoutPreferences = (autoSignoutPrefs) => {
  const currentPrefs = getUserPreferences();
  const result = saveUserPreferences({
    ...currentPrefs,
    autoSignout: {
      ...currentPrefs.autoSignout,
      ...autoSignoutPrefs
    }
  });

  // Dispatch custom event to notify about settings change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('autoSignoutSettingsChanged', {
      detail: { ...currentPrefs.autoSignout, ...autoSignoutPrefs }
    }));
  }

  return result;
};

/**
 * Mark that user has seen the auto signout prompt
 */
export const markAutoSignoutPromptSeen = () => {
  return updateAutoSignoutPreferences({ hasSeenPrompt: true });
};

/**
 * Enable/disable auto signout
 */
export const setAutoSignoutEnabled = (enabled) => {
  return updateAutoSignoutPreferences({ enabled });
};

/**
 * Set custom timeout values
 */
export const setAutoSignoutTimeouts = (desktopMinutes, mobileMinutes) => {
  return updateAutoSignoutPreferences({
    desktopTimeoutMinutes: desktopMinutes,
    mobileTimeoutMinutes: mobileMinutes || desktopMinutes
  });
};

/**
 * Reset preferences to defaults
 */
export const resetPreferences = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PREFERENCES_KEY);
    }
    return true;
  } catch (error) {
    console.error('Error resetting preferences:', error);
    return false;
  }
};

/**
 * Get auto signout settings for current device
 */
export const getAutoSignoutSettings = () => {
  const prefs = getUserPreferences();
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    enabled: prefs.autoSignout.enabled,
    desktopTimeout: prefs.autoSignout.desktopTimeoutMinutes,
    mobileTimeout: prefs.autoSignout.mobileTimeoutMinutes,
    timeoutMinutes: isMobile 
      ? prefs.autoSignout.mobileTimeoutMinutes 
      : prefs.autoSignout.desktopTimeoutMinutes,
    hasSeenPrompt: prefs.autoSignout.hasSeenPrompt,
    isMobile
  };
};

/**
 * Get user's theme preference
 */
export const getUserTheme = () => {
  const prefs = getUserPreferences();
  return prefs.theme;
};

/**
 * Set user's theme preference
 */
export const setUserTheme = (theme) => {
  const currentPrefs = getUserPreferences();
  return saveUserPreferences({
    ...currentPrefs,
    theme: theme
  });
}; 