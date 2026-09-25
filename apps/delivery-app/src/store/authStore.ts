import { create } from 'zustand';
import { deliveryApi, getAuthToken, setAuthToken } from '../lib/api';

// The screens pass the display form "+91XXXXXXXXXX"; the backend send-otp /
// verify-otp-login DTOs expect the plain 10-digit Indian number. Strip the
// leading +91 before calling the API.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
  completedDeliveries?: number;
  rating?: number;
  totalEarnings?: number;
}

interface AuthState {
  user: User | null;
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    try {
      // Local backend login (POST /auth/login) — persists the NestJS JWT.
      const data = await deliveryApi.login(email, password);

      // Validate role against the local User record (auth token just set).
      const profile = await deliveryApi.getProfile();
      if (profile.role !== 'DELIVERY_PARTNER') {
        await deliveryApi.signOut();
        throw new Error('This account is not registered as a delivery partner');
      }

      set({
        user: profile,
        session: null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendPhoneOtp: async (phone: string) => {
    // Local NestJS phone-OTP flow (POST /auth/send-otp). The 6-digit code is
    // delivered via SMS — never returned to the client.
    await deliveryApi.sendOtp(normalizePhone(phone));
  },

  verifyPhoneOtp: async (phone: string, otp: string) => {
    try {
      // POST /auth/verify-otp-login verifies the code and returns the NestJS
      // JWT — stored with the same session mechanism as email/password login.
      const data = await deliveryApi.verifyOtpLogin(normalizePhone(phone), otp);
      if (data?.access_token) await setAuthToken(data.access_token);

      // Role gate — identical to signIn(): only DELIVERY_PARTNER accounts
      // can operate this app.
      const profile = await deliveryApi.getProfile();
      if (profile.role !== 'DELIVERY_PARTNER') {
        await deliveryApi.signOut();
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        throw new Error('This account is not registered as a delivery partner');
      }

      set({ user: profile, session: null, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await deliveryApi.signOut();
      set({ user: null, session: null, isAuthenticated: false });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  loadSession: async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        set({ isAuthenticated: true });
        await get().loadProfile();
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  loadProfile: async () => {
    try {
      const profile = await deliveryApi.getProfile();
      if (profile.role !== 'DELIVERY_PARTNER') {
        await deliveryApi.signOut();
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ user: profile, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
