'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { vendorApi, setOnUnauthorized } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
}

interface VendorProfile {
  id: string;
  storeName: string;
  storeSlug: string;
  description?: string;
  logoUrl?: string;
  storeType: string;
  status: string;
  rating: number;
}

interface AuthContextType {
  user: User | null;
  vendorProfile: VendorProfile | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (data: any) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  skipAuth: () => void;
  rememberedEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_SKIP_KEY = 'vendor_dev_skip';
const REMEMBER_EMAIL_KEY = 'vendor_remembered_email';

const DEV_VENDOR_USER: User = {
  id: 'dev-vendor-001',
  email: 'vendor@next360.dev',
  name: 'Dev Vendor',
  role: 'VENDOR',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');
  const router = useRouter();

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (saved) setRememberedEmail(saved);
  }, []);

  // Register 401 handler to logout when session expires
  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setVendorProfile(null);
      router.push('/login');
    });
  }, [router]);

  useEffect(() => {
    const initAuth = async () => {
      if (localStorage.getItem(DEV_SKIP_KEY) === 'true') {
        setUser(DEV_VENDOR_USER);
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('vendor_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if token is expired (JWT tokens have an `exp` claim in seconds)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          // Token expired — clear and redirect
          localStorage.removeItem('vendor_token');
          setLoading(false);
          return;
        }
      } catch {
        // Malformed token — clear it
        localStorage.removeItem('vendor_token');
        setLoading(false);
        return;
      }

      try {
        const userData = await vendorApi.getProfile();
        setUser(userData);
        // Load vendor profile if user is a vendor
        if (userData.role === 'VENDOR') {
          vendorApi.getMyProfile().then(setVendorProfile).catch(() => {
              // Non-critical: vendor profile is display-only; auth already succeeded
            });
        }
      } catch (err: any) {
        // Only clear token on auth errors (401/403), not network errors
        const msg = err?.message || '';
        const isNetworkError = msg.includes('Unable to connect') || msg.includes('invalid response');
        if (!isNetworkError) {
          localStorage.removeItem('vendor_token');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    const res = await vendorApi.login(email, password);
    localStorage.setItem('vendor_token', res.access_token);

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
      setRememberedEmail(email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      setRememberedEmail('');
    }

    setUser(res.user);
    // Load vendor profile
    if (res.user.role === 'VENDOR') {
      vendorApi.getMyProfile().then(setVendorProfile).catch(() => {
        // Non-critical: vendor profile is display-only; auth already succeeded
      });
    }
  };

  const signup = async (data: any) => {
    const res = await vendorApi.signup(data);
    localStorage.setItem('vendor_token', res.access_token);
    setUser(res.user);
    if (res.user.role === 'VENDOR') {
      vendorApi.getMyProfile().then(setVendorProfile).catch(() => {
        // Non-critical: vendor profile is display-only; auth already succeeded
      });
    }
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
    setVendorProfile(null);
    router.push('/login');
  };

  const forgotPassword = async (email: string) => {
    await vendorApi.forgotPassword?.(email);
  };

  const skipAuth = () => {
    localStorage.setItem(DEV_SKIP_KEY, 'true');
    setUser(DEV_VENDOR_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        vendorProfile,
        loading,
        login,
        signup,
        verifyOtp,
        logout,
        forgotPassword,
        isAuthenticated: !!user,
        skipAuth,
        rememberedEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
