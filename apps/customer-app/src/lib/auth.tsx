import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerApi, setToken, removeToken } from './api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const profile = await customerApi.getProfile();
      setUser(profile);
    } catch {
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await customerApi.login(email, password);
    await setToken(res.access_token);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (data: { email: string; password: string; name: string; phone?: string }) => {
    const res = await customerApi.signup(data);
    await setToken(res.access_token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    await removeToken();
    setUser(null);
  }, []);

  /** Dev-only: skip auth and jump straight into the app */
  const skipAuth = useCallback(() => {
    setUser({
      id: 'dev-user-id',
      email: 'dev@skip.com',
      name: 'Dev User',
      role: 'CUSTOMER',
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, signIn, signUp, signOut, skipAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
