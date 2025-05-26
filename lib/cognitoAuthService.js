import { 
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  getCurrentUser as amplifyGetCurrentUser,
  confirmSignUp,
  resendSignUpCode,
  forgotPassword,
  confirmResetPassword,
  updatePassword,
  fetchAuthSession
} from 'aws-amplify/auth';
import supabase from './supabase';

// Sign up with email/phone and password
export const signUp = async (username, password, email, phoneNumber) => {
  try {
    const { userId } = await amplifySignUp({
      username,
      password,
      options: {
        userAttributes: {
          email: email,
          phone_number: phoneNumber, // E.164 format required: +1234567890
        },
      },
    });
    
    return { userId, success: true };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Confirm sign up with verification code
export const confirmSignUpCode = async (username, confirmationCode) => {
  try {
    await confirmSignUp({
      username,
      confirmationCode,
    });
    return { success: true };
  } catch (error) {
    console.error('Error confirming sign up:', error);
    throw error;
  }
};

// Resend confirmation code
export const resendConfirmationCode = async (username) => {
  try {
    await resendSignUpCode({
      username,
    });
    return { success: true };
  } catch (error) {
    console.error('Error resending confirmation code:', error);
    throw error;
  }
};

// Sign in with username and password
export const signIn = async (username, password) => {
  try {
    const { isSignedIn, nextStep } = await amplifySignIn({
      username,
      password,
    });
    
    if (isSignedIn) {
      const user = await getCurrentUser();
      return { user, success: true };
    } else {
      return { success: false, nextStep };
    }
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await amplifySignOut();
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const user = await amplifyGetCurrentUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get authentication session (for tokens)
export const getAuthSession = async () => {
  try {
    const session = await fetchAuthSession();
    return session;
  } catch (error) {
    console.error('Error getting auth session:', error);
    throw error;
  }
};

// Forgot password
export const initiateForgotPassword = async (username) => {
  try {
    await forgotPassword({ username });
    return { success: true };
  } catch (error) {
    console.error('Error initiating forgot password:', error);
    throw error;
  }
};

// Confirm forgot password with code
export const confirmForgotPassword = async (username, confirmationCode, newPassword) => {
  try {
    await confirmResetPassword({
      username,
      confirmationCode,
      newPassword,
    });
    return { success: true };
  } catch (error) {
    console.error('Error confirming forgot password:', error);
    throw error;
  }
};

// Update password (when user is signed in)
export const changePassword = async (oldPassword, newPassword) => {
  try {
    await updatePassword({
      oldPassword,
      newPassword,
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Supabase integration - create/update user profile in Supabase
export const syncUserWithSupabase = async (cognitoUser) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        cognito_user_id: cognitoUser.userId,
        email: cognitoUser.signInDetails?.loginId || cognitoUser.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'cognito_user_id'
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing user with Supabase:', error);
    // Don't throw error here as auth should still work without Supabase sync
    return null;
  }
};

// Get user profile from Supabase
export const getUserProfile = async (cognitoUserId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('cognito_user_id', cognitoUserId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}; 