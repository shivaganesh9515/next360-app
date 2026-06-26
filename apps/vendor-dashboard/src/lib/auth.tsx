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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
