'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { vendorApi } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  skipAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_SKIP_KEY = 'vendor_dev_skip';

const DEV_VENDOR_USER: User = {
  id: 'dev-vendor-001',
  email: 'vendor@next360.dev',
  name: 'Dev Vendor',
  role: 'VENDOR',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Dev-only bypass: skip the real API/DB round trip entirely so the dashboard
    // is reachable while the backend/DB isn't provisioned yet.
    if (localStorage.getItem(DEV_SKIP_KEY) === 'true') {
      setUser(DEV_VENDOR_USER);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('vendor_token');
    if (token) {
      vendorApi.getProfile()
        .then((res) => setUser(res))
        .catch(() => localStorage.removeItem('vendor_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await vendorApi.login(email, password);
    localStorage.setItem('vendor_token', res.access_token);
    setUser(res.user);
  };

  const signup = async (data: any) => {
    const res = await vendorApi.signup(data);
    localStorage.setItem('vendor_token', res.access_token);
    setUser(res.user);
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await vendorApi.verifyOtp(email, otp);
    localStorage.setItem('vendor_token', res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem(DEV_SKIP_KEY);
    setUser(null);
    router.push('/login');
  };

  const skipAuth = () => {
    localStorage.setItem(DEV_SKIP_KEY, 'true');
    setUser(DEV_VENDOR_USER);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, logout, isAuthenticated: !!user, skipAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
