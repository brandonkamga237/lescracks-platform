// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, User, AuthResponse } from '@/services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPremium: boolean;
  isLearner: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  loginWithGitHub: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = authService.getUser();

      // The auth cookie is HttpOnly, so JS cannot see whether a session exists. We use
      // the cached profile as the hint: no cached profile means anonymous, so render
      // immediately rather than paying a round trip on every visit.
      if (!savedUser) {
        setIsLoading(false);
        return;
      }

      // Paint from cache, then let the server confirm the session is still valid.
      // (The cached profile is untrusted — the server response overwrites it.)
      setUser(savedUser);
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          authService.removeUser();
          setUser(null);
        }
      } catch {
        authService.removeUser();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      // Combine first + last name into the display username so lastName isn't dropped.
      const username = [firstName, lastName]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(' ') || undefined;
      const response = await authService.register(email, password, username);
      if (response.success && response.user) {
        setUser(response.user);
      }
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const loginWithGoogle = useCallback(() => {
    authService.loginWithGoogle();
  }, []);

  const loginWithGitHub = useCallback(() => {
    authService.loginWithGitHub();
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isPremium: user?.role === 'PREMIUM' || user?.role === 'LEARNER' || user?.role === 'ADMIN',
    isLearner: user?.role === 'LEARNER',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    loginWithGoogle,
    loginWithGitHub,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
