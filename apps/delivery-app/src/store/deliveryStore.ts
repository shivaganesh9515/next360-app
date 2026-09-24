import { create } from 'zustand';
import { deliveryApi } from '../lib/api';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  deliveryFee?: number;
  createdAt: string;
  user?: {
    name: string;
    phone: string;
  };
  address?: {
    fullAddress?: string;
    street?: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
  };
  vendor?: {
    id: string;
    storeName: string;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  vendorGroups?: any[];
  items?: any[];
}

interface Earnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  totalDeliveries: number;
}

interface DashboardStats {
  newOrders: number;
  active: number;
  deliveredToday: number;
  deliveredAll: number;
  isAvailable: boolean;
}

// Safety net: at most one background refetch per 20s. Realtime events only
// trigger a refetch of the affected list — they never merge raw table rows
// into the UI because the pool/active lists are enriched shapes, not rows.
const SAFETY_REFETCH_MS = 20000;
let lastSafetyRefetch = 0;
let safetyInterval: ReturnType<typeof setInterval> | null = null;

function runSafetyRefetch(get: () => DeliveryState) {
  const now = Date.now();
  if (now - lastSafetyRefetch < SAFETY_REFETCH_MS) return;
  lastSafetyRefetch = now;
  void get().fetchActiveDeliveries();
  void get().fetchNewOrders();
}

interface DeliveryState {
  newOrders: Order[];
  activeDeliveries: Order[];
  deliveryHistory: Order[];
  earnings: Earnings | null;
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  isAvailable: boolean;
  realtimeChannel: any;

  // Actions
  fetchNewOrders: () => Promise<void>;
  fetchActiveDeliveries: () => Promise<void>;
  fetchDeliveryHistory: (params?: any) => Promise<void>;
  fetchEarnings: (period?: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  verifyPickupOTP: (orderId: string, otp: string) => Promise<void>;
  setAvailability: (available: boolean) => Promise<void>;
  setupRealtime: () => void;
  cleanupRealtime: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  newOrders: [],
  activeDeliveries: [],
  deliveryHistory: [],
  earnings: null,
  dashboardStats: null,
  isLoading: false,
  isAvailable: true,
  realtimeChannel: null,

  fetchNewOrders: async () => {
    set({ isLoading: true });
    try {
      const res: any = await deliveryApi.getNewOrders();
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      set({ newOrders: list });
    } catch (error) {
      console.error('Fetch new orders error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveDeliveries: async () => {
    set({ isLoading: true });
    try {
      const res: any = await deliveryApi.getActiveDeliveries();
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      set({ activeDeliveries: list });
    } catch (error) {
      console.error('Fetch active deliveries error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDeliveryHistory: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res: any = await deliveryApi.getDeliveryHistory(params);
      const list = Array.isArray(res) ? res : (res?.items || res?.data || []);
      set({ deliveryHistory: list });
    } catch (error) {
      console.error('Fetch delivery history error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEarnings: async (period?: string) => {
    try {
      const res = await deliveryApi.getEarnings({ period: period || 'all' });
      set({ earnings: res });
    } catch (error) {
      console.error('Fetch earnings error:', error);
    }
  },

  acceptOrder: async (orderId: string) => {
    try {
      await deliveryApi.acceptOrder(orderId);
      // Remove from new orders, refresh active
      set(state => ({
        newOrders: state.newOrders.filter(o => o.id !== orderId),
      }));
      await get().fetchActiveDeliveries();
    } catch (error) {
      console.error('Accept order error:', error);
      throw error;
    }
  },

  rejectOrder: async (orderId: string) => {
    try {
      await deliveryApi.rejectOrder(orderId);
      set(state => ({
        newOrders: state.newOrders.filter(o => o.id !== orderId),
      }));
    } catch (error) {
      console.error('Reject order error:', error);
      throw error;
    }
  },

  fetchDashboardStats: async () => {
    try {
      const res: any = await deliveryApi.getDashboardStats();
      set({ dashboardStats: res });
    } catch (error) {
      console.error('Fetch dashboard stats error:', error);
    }
  },

  verifyPickupOTP: async (orderId: string, otp: string) => {
    try {
      await deliveryApi.verifyPickupOTP(orderId, otp);
      await get().fetchActiveDeliveries();
    } catch (error) {
      console.error('Verify pickup OTP error:', error);
      throw error;
    }
  },

  setAvailability: async (available: boolean) => {
    try {
      await deliveryApi.setAvailability(available);
      set({ isAvailable: available });
    } catch (error) {
      console.error('Set availability error:', error);
      throw error;
    }
  },

  setupRealtime: () => {
    // Pool & active list are both keyed on OrderVendorGroup (one record per
    // vendor-group order card). A vendor marking "Ready for Pickup" sets the
    // group's status to READY_FOR_PICKUP -> the INSERT/UPDATE fires here and
    // the order surfaces in the pool. Status advances (ACCEPTED → ... →
    // DELIVERED) update the same table, so a single UPDATE channel keeps the
    // active list fresh. Rows aren't merged directly - the lists are enriched
    // shapes, so we just refetch (throttled).
    const channel = supabase
      .channel('delivery-orders-v2')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'OrderVendorGroup',
        filter: 'status=eq.READY_FOR_PICKUP',
      }, () => {
        void get().fetchNewOrders();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'OrderVendorGroup',
        filter: 'status=eq.READY_FOR_PICKUP',
      }, () => {
        void get().fetchNewOrders();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'OrderVendorGroup',
      }, () => {
        runSafetyRefetch(get);
      })
      .subscribe();

    if (safetyInterval) clearInterval(safetyInterval);
    lastSafetyRefetch = Date.now();
    safetyInterval = setInterval(() => runSafetyRefetch(get), SAFETY_REFETCH_MS);

    set({ realtimeChannel: channel });
  },

  cleanupRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
    if (safetyInterval) {
      clearInterval(safetyInterval);
      safetyInterval = null;
    }
  },
}));
