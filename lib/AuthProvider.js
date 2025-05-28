"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import supabase from './supabase'; // Your regular Supabase client

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 