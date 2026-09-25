import { create } from 'zustand';
import { deliveryApi, getBackendToken, setUnauthorizedHandler } from '../lib/api';
import { useDeliveryStore } from './deliveryStore';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
  isActive?: boolean;
  deliveryPartner?: {
    id: string;
    vehicleType: string;
    zoneId: string;
    status: string;
  } | null;
  completedDeliveries?: number;
  rating?: number;
  totalEarnings?: number;
}

type AccountStatus = 'UNKNOWN' | 'ACTIVE' | 'INACTIVE' | 'SETUP';

function deriveAccountStatus(profile: User | null): AccountStatus {
  if (!profile) return 'UNKNOWN';
  if (profile.isActive === false) return 'INACTIVE';
  if (!profile.deliveryPartner) return 'SETUP';
  return 'ACTIVE';
}

interface AuthState {
  user: User | null;
  session: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  accountStatus: AccountStatus;
  getEntryRoute: () => string;
  signIn: (email: string, password: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  accountStatus: 'UNKNOWN',

  signIn: async (email: string, password: string) => {
    try {
      const data = await deliveryApi.login(email, password);

      // Validate role
      const profile = await deliveryApi.getProfile();
      if (profile.role !== 'DELIVERY_PARTNER') {
        await get().clearSession();
        throw new Error('This account is not registered as a delivery partner');
      }

      set({
        user: profile,
        session: data.session ?? { access_token: data.access_token },
        isAuthenticated: true,
        accountStatus: deriveAccountStatus(profile),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  sendPhoneOtp: async (phone: string) => {
    await deliveryApi.sendOtp(phone);
  },

  verifyPhoneOtp: async (phone: string, otp: string) => {
    try {
      // Backend OTP verification — issues the same backend JWT as email/password
      // login and persists it via setBackendToken inside deliveryApi.verifyOtpLogin.
      // Supabase OTP is deliberately NOT used for delivery-partner phone auth.
      const data = await deliveryApi.verifyOtpLogin(phone, otp);

      const profile = await deliveryApi.getProfile();
      if (profile.role !== 'DELIVERY_PARTNER') {
        await get().clearSession();
        throw new Error('This account is not registered as a delivery partner');
      }

      set({
        user: profile,
        session: data.session ?? { access_token: data.access_token },
        isAuthenticated: true,
        accountStatus: deriveAccountStatus(profile),
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  getEntryRoute: () => {
    const { user, isAuthenticated, accountStatus } = get();
    if (!isAuthenticated || !user) return '/(auth)/login';
    if (accountStatus === 'INACTIVE') return '/account-status';
    if (accountStatus === 'SETUP') return '/(onboarding)';
    return '/(tabs)';
  },

  signOut: async () => {
    try {
      await get().clearSession();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },

  // Central teardown used by both logout and 401-triggered session
  // invalidation: clears the backend JWT, resets auth state, and wipes all
  // delivery data from the delivery store so nothing leaks across sessions.
  clearSession: async () => {
    try {
      await deliveryApi.signOut();
    } catch (error) {
      console.error('Session clear error:', error);
    }
    useDeliveryStore.getState().reset();
    set({ user: null, session: null, isAuthenticated: false, accountStatus: 'UNKNOWN', isLoading: false });
  },

  loadSession: async () => {
    try {
      const token = await getBackendToken();
      if (token) {
        set({ session: { access_token: token }, isAuthenticated: true });
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
        await get().clearSession();
        return;
      }
      set({ user: profile, accountStatus: deriveAccountStatus(profile), isLoading: false });
    } catch (error) {
      console.error('Load profile error:', error);
      // A 401 is handled centrally (lib/api invokes clearSession); any other
      // failure just ends the loading state.
      set({ isLoading: false });
    }
  },
}));

// Centralized 401 handling — registered exactly once. Any protected API
// request that returns 401 (invalid/expired backend JWT — including one that
// expires mid-session) clears the session. No navigation happens here; the
// isAuthenticated state change is what the route guards react to.
setUnauthorizedHandler(() => {
  void useAuthStore.getState().clearSession();
});
