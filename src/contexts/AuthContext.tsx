import React, { createContext, useContext, useState, useEffect } from 'react';
import { account } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    // For mobile: Check if OAuth is pending before doing normal check
    if (isNative) {
      const oauthPending = sessionStorage.getItem('oauth_success_pending');
      if (oauthPending === 'true') {
        console.log('⏳ OAuth pending, skipping initial checkUser - will wait for deep link');
        // Don't call checkUser yet - let the OAuth success handler do it
        return;
      }
    }
    
    // Normal startup: check if user is already logged in
    checkUser();
  }, []);

  // Check for OAuth success from deep link
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) return;

    const checkOAuthSuccess = async () => {
      const oauthPending = sessionStorage.getItem('oauth_success_pending');
      const timestamp = sessionStorage.getItem('oauth_success_timestamp');
      
      if (oauthPending === 'true' && timestamp) {
        console.log('🔄 OAuth success detected from deep link, refreshing user...');
        
        // Clear flags immediately
        sessionStorage.removeItem('oauth_success_pending');
        sessionStorage.removeItem('oauth_redirect_to');
        sessionStorage.removeItem('oauth_success_timestamp');
        
        // Keep loading state while we fetch user
        setLoading(true);
        
        // Wait a moment for session to be fully established on Appwrite backend
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to get user multiple times with retries
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to get user session...`);
          
          try {
            const currentUser = await account.get();
            console.log('✅ User session retrieved:', currentUser.email);
            setUser(currentUser);
            setLoading(false);
            console.log('🎉 OAuth complete! Login page will auto-redirect to home.');
            return;
          } catch (error) {
            console.log(`Attempt ${attempts} failed, retrying in 1s...`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        console.error('❌ Failed to get user session after all attempts');
        setLoading(false);
      }
    };

    checkOAuthSuccess();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      
      console.log('Initiating Google OAuth, isNative:', isNative);
      
      if (isNative) {
        // Set flag BEFORE opening browser so AuthContext knows to wait
        sessionStorage.setItem('oauth_success_pending', 'true');
        sessionStorage.setItem('oauth_success_timestamp', Date.now().toString());
        console.log('🔐 OAuth pending flag set, opening browser...');
        
        // For mobile: Use capacitor localhost URL for callback
        const successUrl = 'https://localhost/auth/callback';
        const failureUrl = 'https://localhost/login';
        
        // Get the OAuth URL from Appwrite
        const oauthUrl = `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/google?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`;
        
        console.log('Opening OAuth in in-app browser:', oauthUrl);
        
        // Open in in-app browser (stays within app context, preserves cookies)
        await Browser.open({ 
          url: oauthUrl,
          presentationStyle: 'popover',
        });
        
        // Listen for browser to close
        Browser.addListener('browserFinished', async () => {
          console.log('Browser closed, checking session...');
          
          // Wait a moment then check for session
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            const currentUser = await account.get();
            console.log('✅ User logged in:', currentUser.email);
            setUser(currentUser);
            setLoading(false);
            sessionStorage.removeItem('oauth_success_pending');
            sessionStorage.removeItem('oauth_success_timestamp');
          } catch (error) {
            console.error('No session found after OAuth');
            sessionStorage.removeItem('oauth_success_pending');
            sessionStorage.removeItem('oauth_success_timestamp');
            setLoading(false);
          }
        });
      } else {
        // For web: Regular callback
        const successUrl = `${window.location.origin}/auth/callback`;
        const failureUrl = `${window.location.origin}/login`;
        
        await account.createOAuth2Session(
          'google',
          successUrl,
          failureUrl
        );
      }
    } catch (error) {
      console.error('Google login error:', error);
      // Clear flag on error
      if (Capacitor.isNativePlatform()) {
        sessionStorage.removeItem('oauth_success_pending');
        sessionStorage.removeItem('oauth_success_timestamp');
      }
      throw error;
    }
  };

  const loginWithGithub = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      
      console.log('Initiating GitHub OAuth, isNative:', isNative);
      
      if (isNative) {
        // Set flag BEFORE opening browser so AuthContext knows to wait
        sessionStorage.setItem('oauth_success_pending', 'true');
        sessionStorage.setItem('oauth_success_timestamp', Date.now().toString());
        console.log('🔐 OAuth pending flag set, opening browser...');
        
        // For mobile: Use capacitor localhost URL for callback
        const successUrl = 'https://localhost/auth/callback';
        const failureUrl = 'https://localhost/login';
        
        // Get the OAuth URL from Appwrite
        const oauthUrl = `https://sgp.cloud.appwrite.io/v1/account/sessions/oauth2/github?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}&success=${encodeURIComponent(successUrl)}&failure=${encodeURIComponent(failureUrl)}`;
        
        console.log('Opening OAuth in in-app browser:', oauthUrl);
        
        // Open in in-app browser (stays within app context, preserves cookies)
        await Browser.open({ 
          url: oauthUrl,
          presentationStyle: 'popover',
        });
        
        // Listen for browser to close
        Browser.addListener('browserFinished', async () => {
          console.log('Browser closed, checking session...');
          
          // Wait a moment then check for session
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            const currentUser = await account.get();
            console.log('✅ User logged in:', currentUser.email);
            setUser(currentUser);
            setLoading(false);
            sessionStorage.removeItem('oauth_success_pending');
            sessionStorage.removeItem('oauth_success_timestamp');
          } catch (error) {
            console.error('No session found after OAuth');
            sessionStorage.removeItem('oauth_success_pending');
            sessionStorage.removeItem('oauth_success_timestamp');
            setLoading(false);
          }
        });
      } else {
        // For web: Regular callback
        const successUrl = `${window.location.origin}/auth/callback`;
        const failureUrl = `${window.location.origin}/login`;
        
        await account.createOAuth2Session(
          'github',
          successUrl,
          failureUrl
        );
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      // Clear flag on error
      if (Capacitor.isNativePlatform()) {
        sessionStorage.removeItem('oauth_success_pending');
        sessionStorage.removeItem('oauth_success_timestamp');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithGithub,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
