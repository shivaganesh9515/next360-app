import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerApi, setToken, removeToken } from './api';
import { registerForPushNotifications, unregisterPushToken } from './notifications';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  skipAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  // Registers the device for push once there's an authenticated user — covers
  // fresh sign-in/sign-up and a restored session on app relaunch alike. This
  // was previously built (src/lib/notifications.ts) but never called from
  // anywhere, so the app never actually requested permission or registered a
  // token — no push notification could ever reach a real device.
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications().catch(() => {});
  }, [user?.id]);

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

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    await customerApi.verifyOtp(email, otp);
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await customerApi.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await customerApi.resetPassword(token, newPassword);
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPushToken().catch(() => {});
    await removeToken();
    setUser(null);
  }, []);

  const skipAuth = useCallback(() => {
    setUser({ id: 'dev-user-id', email: 'dev@skip.com', name: 'Dev User', role: 'CUSTOMER' });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user,
      signIn, signUp, verifyOtp, forgotPassword, resetPassword, signOut, skipAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
