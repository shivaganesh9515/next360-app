import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerApi, setToken, removeToken } from './api';
import { registerForPushNotifications, unregisterPushToken } from './notifications';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtpAndAuth: (phone: string, otp: string) => Promise<{ isNewUser: boolean }>;
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

  const sendOtp = useCallback(async (phone: string) => {
    await customerApi.sendOtp(phone);
  }, []);

  // One call for both login and signup — the backend (or its demo fallback)
  // decides which based on whether the phone number already has an account.
  const verifyOtpAndAuth = useCallback(async (phone: string, otp: string) => {
    const res = await customerApi.verifyOtpLogin(phone, otp);
    await setToken(res.access_token);
    setUser(res.user);
    return { isNewUser: !!res.isNewUser };
  }, []);

  const signOut = useCallback(async () => {
    await unregisterPushToken().catch(() => {});
    await removeToken();
    setUser(null);
  }, []);

  const skipAuth = useCallback(() => {
    setUser({ id: 'dev-user-id', phone: '9999999999', name: 'Dev User', role: 'CUSTOMER' });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthenticated: !!user,
      sendOtp, verifyOtpAndAuth, signOut, skipAuth,
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
