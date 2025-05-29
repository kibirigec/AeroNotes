"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from './supabase'; // Your regular Supabase client
import { useAutoSignout } from './hooks/useAutoSignout';
import { 
  getAutoSignoutSettings, 
  markAutoSignoutPromptSeen, 
  setAutoSignoutEnabled,
  setAutoSignoutTimeouts 
} from './services/userPreferences';
import AutoSignoutWarning from '../src/app/components/AutoSignoutWarning';
import AutoSignoutPrompt from '../src/app/components/AutoSignoutPrompt';
import AutoSignoutTimer from '../src/app/components/AutoSignoutTimer';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFirstTimePrompt, setShowFirstTimePrompt] = useState(false);
  const [autoSignoutSettings, setAutoSignoutSettings] = useState(null);

  // Function to refresh auto signout settings
  const refreshAutoSignoutSettings = useCallback(() => {
    if (user) {
      const settings = getAutoSignoutSettings();
      console.log('🔄 Refreshing auto signout settings:', settings);
      setAutoSignoutSettings(settings);
      
      // Show first-time prompt if user hasn't seen it
      if (!settings.hasSeenPrompt) {
        setShowFirstTimePrompt(true);
      }
    } else {
      setAutoSignoutSettings(null);
      setShowFirstTimePrompt(false);
    }
  }, [user]);

  // Check for unsaved changes function (to be passed to auto signout)
  const checkUnsavedChanges = useCallback(() => {
    // This would check for unsaved changes in notes, documents, etc.
    // For now, we'll return false, but this can be expanded
    if (typeof window !== 'undefined') {
      // Check if there are any unsaved changes indicators
      const hasUnsavedText = document.querySelector('[data-unsaved="true"]');
      const hasUnsavedForm = document.querySelector('form[data-dirty="true"]');
      return !!(hasUnsavedText || hasUnsavedForm);
    }
    return false;
  }, []);

  // Auto signout callbacks
  const handleAutoSignout = useCallback(async () => {
    console.log('🚪 Auto signout triggered - signing out user');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during auto signout:', error);
      }
      setSession(null);
      setUser(null);
    } catch (err) {
      console.error('Unexpected error during auto signout:', err);
      setSession(null);
      setUser(null);
    }
  }, []);

  const handleAutoSignoutWarning = useCallback((timeLeft) => {
    console.log('⚠️ Auto signout warning - time left:', timeLeft);
  }, []);

  // Initialize auto signout settings
  useEffect(() => {
    refreshAutoSignoutSettings();
  }, [refreshAutoSignoutSettings]);

  // Listen for localStorage changes to update settings in real-time
  useEffect(() => {
    if (!user) return;

    const handleStorageChange = (e) => {
      // Check if the change is related to our preferences
      if (e.key === 'aeronotes_user_preferences' || e.key === null) {
        console.log('📡 Settings changed in localStorage, refreshing...');
        refreshAutoSignoutSettings();
      }
    };

    const handleCustomSettingsChange = (e) => {
      console.log('📡 Auto signout settings changed, refreshing...', e.detail);
      refreshAutoSignoutSettings();
    };

    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom settings change events (changes from same tab)
    window.addEventListener('autoSignoutSettingsChanged', handleCustomSettingsChange);

    // Also listen for focus events to catch any missed changes
    const handleFocus = () => {
      refreshAutoSignoutSettings();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('autoSignoutSettingsChanged', handleCustomSettingsChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, refreshAutoSignoutSettings]);

  // Auto signout hook
  const autoSignoutState = useAutoSignout({
    enabled: autoSignoutSettings?.enabled || false,
    desktopTimeoutMs: (autoSignoutSettings?.desktopTimeout || 20) * 60 * 1000,
    mobileTimeoutMs: (autoSignoutSettings?.mobileTimeout || 10) * 60 * 1000,
    warningTimeMs: 2 * 60 * 1000, // 2 minutes warning
    onSignout: handleAutoSignout,
    onWarning: handleAutoSignoutWarning,
    checkUnsavedChanges,
    userId: user?.id
  });

  // First-time prompt handlers
  const handleFirstTimeAccept = () => {
    markAutoSignoutPromptSeen();
    setShowFirstTimePrompt(false);
    setAutoSignoutSettings(prev => ({ ...prev, hasSeenPrompt: true }));
  };

  const handleFirstTimeDisable = () => {
    setAutoSignoutEnabled(false);
    markAutoSignoutPromptSeen();
    setShowFirstTimePrompt(false);
    setAutoSignoutSettings(prev => ({ 
      ...prev, 
      enabled: false, 
      hasSeenPrompt: true 
    }));
  };

  const handleFirstTimeCustomize = (timeoutMinutes) => {
    const isMobile = autoSignoutSettings?.isMobile;
    if (isMobile) {
      setAutoSignoutTimeouts(20, timeoutMinutes); // Keep desktop default, set mobile
    } else {
      setAutoSignoutTimeouts(timeoutMinutes, 10); // Set desktop, keep mobile default  
    }
    markAutoSignoutPromptSeen();
    setShowFirstTimePrompt(false);
    // The settings will be refreshed via the event listener, no need to manually update state
  };

  useEffect(() => {
    // Check for an existing session when the app loads
    const getInitialSession = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting initial session:", error);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth event:', event, newSession);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      // Cleanup listener on unmount
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const value = {
    user,
    session,
    isLoading: loading,
    autoSignout: {
      ...autoSignoutState,
      settings: autoSignoutSettings
    },
    signOut: async () => {
      try {
        // Always attempt to sign out from Supabase
        const { error } = await supabase.auth.signOut();
        
        // If there's an error, log it but don't prevent local cleanup
        if (error) {
          console.error('Error signing out from Supabase:', error);
          
          // If the error is about missing session, we still want to clear local state
          if (error.message?.includes('session') || error.message?.includes('not logged in')) {
            console.log('Session already invalid, clearing local state...');
          }
        }
        
        // Always clear local state regardless of Supabase errors
        // This ensures the user gets signed out even if the session was already invalid
        setSession(null);
        setUser(null);
        
        // Clear any cached data that might prevent fresh login
        if (typeof window !== 'undefined') {
          // Clear localStorage if we have any auth-related items stored
          localStorage.removeItem('supabase.auth.token');
          // You can add other cleanup here if needed
        }
        
        console.log('Sign out completed successfully');
        
      } catch (err) {
        console.error('Unexpected error during sign out:', err);
        
        // Even if there's an unexpected error, clear local state
        setSession(null);
        setUser(null);
        
        // Don't throw the error - just log it and proceed with local cleanup
      }
    },
    // You can add other auth-related functions here if needed, 
    // e.g., for updating user metadata, etc.
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Auto Signout Warning Dialog */}
      <AutoSignoutWarning
        isVisible={autoSignoutState.showWarning}
        timeLeft={autoSignoutState.timeLeft}
        formatTimeLeft={autoSignoutState.formatTimeLeft}
        onExtendSession={autoSignoutState.extendSession}
        onSignOutNow={handleAutoSignout}
        hasUnsavedChanges={checkUnsavedChanges()}
      />
      
      {/* First-Time Auto Signout Prompt */}
      <AutoSignoutPrompt
        isVisible={showFirstTimePrompt}
        onAccept={handleFirstTimeAccept}
        onDisable={handleFirstTimeDisable}
        onCustomize={handleFirstTimeCustomize}
        isMobile={autoSignoutSettings?.isMobile}
        defaultTimeout={autoSignoutSettings?.timeoutMinutes}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 