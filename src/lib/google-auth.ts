import { GoogleAuth } from '@southdevs/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

export interface GoogleUser {
  email: string;
  familyName: string;
  givenName: string;
  id: string;
  imageUrl: string;
  name: string;
  authentication: {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
  };
}

/**
 * Initialize Google Auth - must be called before any sign-in attempts
 * Call this in your app initialization (e.g., main.tsx or App.tsx)
 */
export const initGoogleAuth = async (): Promise<void> => {
  const platform = Capacitor.getPlatform();
  console.log('[GoogleAuth] Initializing on platform:', platform);
  
  try {
    // Initialize the plugin with your client ID
    // For Android, this uses the Web Client ID from Google Cloud Console
    await GoogleAuth.initialize({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log('[GoogleAuth] ✓ Initialized successfully');
  } catch (error) {
    console.error('[GoogleAuth] ✗ Failed to initialize:', error);
    throw error;
  }
};

/**
 * Sign in with Google - shows native account picker
 * If user has only one Google account, it may auto-select
 */
export const signInWithGoogle = async (): Promise<GoogleUser> => {
  const platform = Capacitor.getPlatform();
  console.log('[GoogleAuth] Starting sign-in on platform:', platform);
  
  try {
    const result = await GoogleAuth.signIn({
      scopes: ['profile', 'email'],
      grantOfflineAccess: true,
    });
    console.log('[GoogleAuth] ✓ Sign-in successful:', result.email);
    
    return {
      email: result.email || '',
      familyName: result.familyName || '',
      givenName: result.givenName || '',
      id: result.id || '',
      imageUrl: result.imageUrl || '',
      name: result.name || '',
      authentication: {
        accessToken: result.authentication?.accessToken || '',
        idToken: result.authentication?.idToken || '',
        refreshToken: result.authentication?.refreshToken,
      },
    };
  } catch (error: unknown) {
    console.error('[GoogleAuth] ✗ Sign-in failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle specific error cases
    if (errorMessage.includes('canceled') || errorMessage.includes('cancelled')) {
      throw new Error('Sign-in was cancelled');
    }
    if (errorMessage.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    if (errorMessage.includes('DEVELOPER_ERROR')) {
      throw new Error('Configuration error. Please contact support.');
    }
    
    throw new Error(errorMessage || 'Failed to sign in with Google');
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async (): Promise<void> => {
  console.log('[GoogleAuth] Signing out...');
  
  try {
    await GoogleAuth.signOut();
    console.log('[GoogleAuth] ✓ Signed out successfully');
  } catch (error) {
    console.error('[GoogleAuth] ✗ Sign-out failed:', error);
    // Don't throw - sign out should be graceful
  }
};

/**
 * Refresh the access token
 */
export const refreshGoogleToken = async (): Promise<{ accessToken: string; idToken: string }> => {
  console.log('[GoogleAuth] Refreshing token...');
  
  try {
    const result = await GoogleAuth.refresh();
    console.log('[GoogleAuth] ✓ Token refreshed');
    
    return {
      accessToken: result.accessToken || '',
      idToken: result.idToken || '',
    };
  } catch (error) {
    console.error('[GoogleAuth] ✗ Token refresh failed:', error);
    throw error;
  }
};

/**
 * Check if user is currently signed in
 */
export const isGoogleSignedIn = async (): Promise<boolean> => {
  try {
    // Try to refresh - if it works, user is signed in
    await GoogleAuth.refresh();
    return true;
  } catch {
    return false;
  }
};
