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
    checkUser();
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
        // For mobile: Use deep link that will redirect back to app
        const successUrl = 'https://time-master-new.appwrite.network/auth/mobile-redirect?success=true';
        const failureUrl = 'https://time-master-new.appwrite.network/auth/mobile-redirect?success=false';
        
        await account.createOAuth2Session(
          'google',
          successUrl,
          failureUrl
        );
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
      throw error;
    }
  };

  const loginWithGithub = async () => {
    try {
      const isNative = Capacitor.isNativePlatform();
      
      console.log('Initiating GitHub OAuth, isNative:', isNative);
      
      if (isNative) {
        // For mobile: Use deep link that will redirect back to app
        const successUrl = 'https://time-master-new.appwrite.network/auth/mobile-redirect?success=true';
        const failureUrl = 'https://time-master-new.appwrite.network/auth/mobile-redirect?success=false';
        
        await account.createOAuth2Session(
          'github',
          successUrl,
          failureUrl
        );
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
