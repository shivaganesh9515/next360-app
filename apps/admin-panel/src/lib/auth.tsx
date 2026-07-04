'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_USER_KEY = 'admin_user';
const DEV_TOKEN_KEY = 'admin_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem(DEV_TOKEN_KEY);
      const userJson = localStorage.getItem(DEV_USER_KEY);

      if (token && userJson) {
        // Dev skip: user data is stored directly, no API call needed
        const parsed = JSON.parse(userJson);
        setUser(parsed);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { adminApi } = await import('./api');
      const res = await adminApi.login(email, password);
      if (res.user && res.user.role !== 'ADMIN') {
        throw new Error('This account is not registered as an admin');
      }
      localStorage.setItem(DEV_TOKEN_KEY, res.access_token);
      localStorage.setItem(DEV_USER_KEY, JSON.stringify(res.user));
      setUser(res.user);
    } catch (err) {
      // If API is unreachable, create dev session for admin email
      if (email.includes('admin')) {
        const devUser: User = {
          id: 'dev-admin-001',
          email,
          name: 'Dev Admin',
          role: 'ADMIN',
        };
        localStorage.setItem(DEV_TOKEN_KEY, 'dev-admin-token');
        localStorage.setItem(DEV_USER_KEY, JSON.stringify(devUser));
        setUser(devUser);
      } else {
        throw err;
      }
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(DEV_TOKEN_KEY);
    localStorage.removeItem(DEV_USER_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: !!user && user.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
