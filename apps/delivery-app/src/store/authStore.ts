import { create } from 'zustand';
import { deliveryApi, getAuthToken } from '../lib/api';

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

  sendPhoneOtp: async () => {
    // Backend phone-OTP flow returns 410 Gone (disabled). No Supabase Auth here.
    throw new Error('Phone OTP login is not available with local authentication.');
  },

  verifyPhoneOtp: async () => {
    // Backend phone-OTP flow returns 410 Gone (disabled). No Supabase Auth here.
    throw new Error('Phone OTP login is not available with local authentication.');
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
