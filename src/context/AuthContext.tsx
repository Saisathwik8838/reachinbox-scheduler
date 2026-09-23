import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/api';
import { api, setUnauthorizedHandler } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await api.getMe();
      setUser(currentUser);
    } catch {
      // 401 or network failure implies no active session
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if network or server errors during logout, clear local session state
    } finally {
      setUser(null);
      try {
        window.location.href = '/login';
      } catch {
        // Safe fallback in test environments
      }
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Register 401 handler for proactive session eviction
    setUnauthorizedHandler(() => {
      setUser(null);
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        try {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        } catch {
          // Safe fallback in test environments
        }
      }
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
