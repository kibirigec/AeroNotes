"use client";

import { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  autoSignout: {
    enabled: true,
    desktopTimeout: 20,
    mobileTimeout: 10,
    hasSeenPrompt: false
  },
  theme: 'system',
  notifications: {
    enabled: true,
    autoDelete: true
  }
};

// Action types
const SETTINGS_ACTIONS = {
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  UPDATE_AUTO_SIGNOUT: 'UPDATE_AUTO_SIGNOUT',
  SET_AUTO_SIGNOUT_ENABLED: 'SET_AUTO_SIGNOUT_ENABLED',
  SET_AUTO_SIGNOUT_TIMEOUTS: 'SET_AUTO_SIGNOUT_TIMEOUTS',
  MARK_PROMPT_SEEN: 'MARK_PROMPT_SEEN',
  UPDATE_THEME: 'UPDATE_THEME',
  UPDATE_NOTIFICATIONS: 'UPDATE_NOTIFICATIONS',
  RESET_SETTINGS: 'RESET_SETTINGS'
};

// Reducer
const settingsReducer = (state, action) => {
  switch (action.type) {
    case SETTINGS_ACTIONS.LOAD_SETTINGS:
      return { ...state, ...action.payload };
      
    case SETTINGS_ACTIONS.UPDATE_AUTO_SIGNOUT:
      return {
        ...state,
        autoSignout: { ...state.autoSignout, ...action.payload }
      };
      
    case SETTINGS_ACTIONS.SET_AUTO_SIGNOUT_ENABLED:
      return {
        ...state,
        autoSignout: { ...state.autoSignout, enabled: action.payload }
      };
      
    case SETTINGS_ACTIONS.SET_AUTO_SIGNOUT_TIMEOUTS:
      return {
        ...state,
        autoSignout: {
          ...state.autoSignout,
          desktopTimeout: action.payload.desktop,
          mobileTimeout: action.payload.mobile
        }
      };
      
    case SETTINGS_ACTIONS.MARK_PROMPT_SEEN:
      return {
        ...state,
        autoSignout: { ...state.autoSignout, hasSeenPrompt: true }
      };
      
    case SETTINGS_ACTIONS.UPDATE_THEME:
      return { ...state, theme: action.payload };
      
    case SETTINGS_ACTIONS.UPDATE_NOTIFICATIONS:
      return {
        ...state,
        notifications: { ...state.notifications, ...action.payload }
      };
      
    case SETTINGS_ACTIONS.RESET_SETTINGS:
      return initialState;
      
    default:
      return state;
  }
};

// Context
const SettingsContext = createContext(null);

// Provider
export function SettingsProvider({ children }) {
  const [settings, dispatch] = useReducer(settingsReducer, initialState);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem('aeronotes_user_preferences');
        if (stored) {
          const parsed = JSON.parse(stored);
          dispatch({ type: SETTINGS_ACTIONS.LOAD_SETTINGS, payload: parsed });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem('aeronotes_user_preferences', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Helper functions
  const updateAutoSignout = (updates) => {
    dispatch({ type: SETTINGS_ACTIONS.UPDATE_AUTO_SIGNOUT, payload: updates });
  };

  const setAutoSignoutEnabled = (enabled) => {
    dispatch({ type: SETTINGS_ACTIONS.SET_AUTO_SIGNOUT_ENABLED, payload: enabled });
  };

  const setAutoSignoutTimeouts = (desktop, mobile) => {
    dispatch({ 
      type: SETTINGS_ACTIONS.SET_AUTO_SIGNOUT_TIMEOUTS, 
      payload: { desktop, mobile } 
    });
  };

  const markPromptSeen = () => {
    dispatch({ type: SETTINGS_ACTIONS.MARK_PROMPT_SEEN });
  };

  const updateTheme = (theme) => {
    dispatch({ type: SETTINGS_ACTIONS.UPDATE_THEME, payload: theme });
  };

  const updateNotifications = (updates) => {
    dispatch({ type: SETTINGS_ACTIONS.UPDATE_NOTIFICATIONS, payload: updates });
  };

  const resetSettings = () => {
    dispatch({ type: SETTINGS_ACTIONS.RESET_SETTINGS });
  };

  // Derived values
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const autoSignoutSettings = {
    ...settings.autoSignout,
    currentTimeout: isMobile ? settings.autoSignout.mobileTimeout : settings.autoSignout.desktopTimeout,
    isMobile
  };

  const value = {
    // State
    settings,
    autoSignoutSettings,
    
    // Actions
    updateAutoSignout,
    setAutoSignoutEnabled,
    setAutoSignoutTimeouts,
    markPromptSeen,
    updateTheme,
    updateNotifications,
    resetSettings,
    
    // Constants
    SETTINGS_ACTIONS
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 