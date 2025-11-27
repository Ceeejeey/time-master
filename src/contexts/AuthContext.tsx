import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUser } from '@/lib/storage';
import { db } from '@/database';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsOnboarding: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const loadUser = async () => {
    try {
      console.log('[AuthContext] Initializing database...');
      await db.initialize();
      console.log('[AuthContext] Loading user...');
      const localUser = await getUser();
      
      console.log('[AuthContext] User loaded:', localUser ? 'Found' : 'Not found');
      if (!localUser) {
        setNeedsOnboarding(true);
        setUser(null);
      } else {
        setUser(localUser);
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user:', error);
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const refreshUser = async () => {
    setLoading(true);
    await loadUser();
  };

  const logout = async () => {
    // For local-only app, just clear user data
    setUser(null);
    setNeedsOnboarding(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsOnboarding,
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
