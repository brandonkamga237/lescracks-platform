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
  upgradeToPremium: () => Promise<AuthResponse>;
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
      const token = authService.getToken();
      
      if (savedUser && token) {
        setUser(savedUser);
        // Verify token is still valid
        try {
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token invalid, clear auth
            authService.removeToken();
            authService.removeUser();
            setUser(null);
          }
        } catch {
          authService.removeToken();
          authService.removeUser();
          setUser(null);
        }
      }
      setIsLoading(false);
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
      const response = await authService.register(email, password, firstName);
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

  const upgradeToPremium = useCallback(async (): Promise<AuthResponse> => {
    const response = await authService.upgradeToPremium();
    if (response.success && response.user) {
      setUser(response.user);
    }
    return response;
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
    upgradeToPremium,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
