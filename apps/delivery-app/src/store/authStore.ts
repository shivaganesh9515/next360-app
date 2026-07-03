import { create } from 'zustand';
import { deliveryApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
      const data = await deliveryApi.login(email, password);

      // Validate role
      const profile = await deliveryApi.getProfile();
      if (profile.role !== 'DELIVERY_PARTNER') {
        await supabase.auth.signOut();
        throw new Error('This account is not registered as a delivery partner');
      }

      set({
        user: profile,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        set({ session, isAuthenticated: true });
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
        await supabase.auth.signOut();
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        return;
      }
      set({ user: profile, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },
}));
