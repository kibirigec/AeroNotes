'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import supabase from './supabase';
import { 
  getCurrentUser, 
  signIn, 
  signOut, 
  signUp, 
  confirmSignUpCode,
  resendConfirmationCode,
  syncUserWithSupabase,
  getUserProfile,
  initiateForgotPassword,
  confirmForgotPassword,
  changePassword
} from './cognitoAuthService';
import { Hub } from 'aws-amplify/utils';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already logged in with Cognito
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          // Sync with Supabase and get user profile
          await syncUserWithSupabase(currentUser);
          const profile = await getUserProfile(currentUser.userId);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Listen for auth events from Amplify
    const unsubscribe = Hub.listen('auth', async (data) => {
      const { payload } = data;
      
      switch (payload.event) {
        case 'signedIn':
          const user = payload.data;
          setUser(user);
          await syncUserWithSupabase(user);
          const profile = await getUserProfile(user.userId);
          setUserProfile(profile);
          setLoading(false);
          break;
        case 'signedOut':
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          break;
        case 'tokenRefresh':
          // Handle token refresh if needed
          break;
        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sign up a new user
  const handleSignUp = async (username, password, email, phoneNumber) => {
    try {
      setLoading(true);
      const result = await signUp(username, password, email, phoneNumber);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Confirm sign up with verification code
  const handleConfirmSignUp = async (username, confirmationCode) => {
    try {
      setLoading(true);
      await confirmSignUpCode(username, confirmationCode);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Resend confirmation code
  const handleResendCode = async (username) => {
    try {
      await resendConfirmationCode(username);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Sign in a user
  const handleSignIn = async (username, password) => {
    try {
      setLoading(true);
      const result = await signIn(username, password);
      if (result.success) {
        setUser(result.user);
        await syncUserWithSupabase(result.user);
        const profile = await getUserProfile(result.user.userId);
        setUserProfile(profile);
      }
      return result;
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password
  const handleForgotPassword = async (username) => {
    try {
      await initiateForgotPassword(username);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Confirm forgot password
  const handleConfirmForgotPassword = async (username, code, newPassword) => {
    try {
      await confirmForgotPassword(username, code, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  // Change password
  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
      await changePassword(oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    initialized,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    resendCode: handleResendCode,
    signIn: handleSignIn,
    signOut: handleSignOut,
    forgotPassword: handleForgotPassword,
    confirmForgotPassword: handleConfirmForgotPassword,
    changePassword: handleChangePassword,
    isAuthenticated: !!user,
    // Supabase client for database operations
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 