import { create } from 'zustand';
import { api, deliveryApi } from '../lib/api';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

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
    street: string;
    city: string;
    state: string;
    pincode: string;
    lat?: number;
    lng?: number;
  };
  vendorGroups?: any[];
}

interface Earnings {
  period?: 'today' | 'week' | 'month' | 'all';
  totalEarnings?: number;
  deliveryCount?: number;
  averagePerDelivery?: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  totalDeliveries: number;
}

interface DeliveryTransaction {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  itemsTotal: number;
  deliveryFee: number;
  amount: number;
  itemCount: number;
  deliveredAt: string | null;
  status: string;
}

interface DeliveryPayout {
  id: string;
  amount: number;
  status: string;
  periodStart: string | null;
  periodEnd: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data: { screen?: string; orderId?: string; orderVendorGroupId?: string } | null;
  isRead: boolean;
  createdAt: string;
}

// Safety net: at most one background refetch per 60s, plus a 60s
// interval while the channel is alive. Realtime events otherwise only
// trigger that throttled refetch — never a full refetch per event.
const SAFETY_REFETCH_MS = 60000;
let lastSafetyRefetch = 0;
let safetyInterval: ReturnType<typeof setInterval> | null = null;

function runSafetyRefetch(get: () => DeliveryState) {
  if (!useAuthStore.getState().isAuthenticated) return;
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
  transactions: DeliveryTransaction[];
  payouts: DeliveryPayout[];
  notifications: Notification[];
  unreadCount: number;
  financialError: string | null;
  isLoading: boolean;
  isAvailable: boolean;
  realtimeChannel: any;

  // Notifications
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Actions
  fetchNewOrders: () => Promise<void>;
  fetchActiveDeliveries: () => Promise<void>;
  fetchDeliveryHistory: (params?: any) => Promise<void>;
  fetchEarnings: (period?: string) => Promise<void>;
  fetchTransactions: (params?: any) => Promise<void>;
  fetchPayouts: (params?: any) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason?: string) => Promise<void>;
  updateDeliveryStatus: (orderId: string, status: string, data?: any) => Promise<void>;
  verifyPickupOTP: (orderId: string, otp: string) => Promise<void>;
  startTransit: (orderId: string) => Promise<void>;
  setAvailability: (available: boolean) => Promise<void>;
  setupRealtime: () => void;
  cleanupRealtime: () => void;
  reset: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set, get) => ({
  newOrders: [],
  activeDeliveries: [],
  deliveryHistory: [],
  earnings: null,
  transactions: [],
  payouts: [],
  notifications: [],
  unreadCount: 0,
  financialError: null,
  isLoading: false,
  isAvailable: true,
  realtimeChannel: null,

  fetchNotifications: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res: any = await api.getNotifications();
      const list = Array.isArray(res) ? res : (res?.notifications || res?.items || res?.data || []);
      set({ notifications: list });
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  },

  fetchUnreadCount: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res: any = await api.getNotificationUnreadCount();
      set({ unreadCount: res?.count ?? 0 });
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      await api.markNotificationRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Mark notification read error:', error);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      await api.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Mark all notifications read error:', error);
    }
  },

  fetchNewOrders: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
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
    if (!useAuthStore.getState().isAuthenticated) return;
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
    if (!useAuthStore.getState().isAuthenticated) return;
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
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res = await deliveryApi.getEarnings({ period: period || 'all' });
      set({ earnings: res, financialError: null });
    } catch (error) {
      console.error('Fetch earnings error:', error);
      set({ financialError: 'Unable to load earnings' });
    }
  },

  fetchTransactions: async (params?: any) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res: any = await deliveryApi.getTransactions(params);
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      set({ transactions: list, financialError: null });
    } catch (error) {
      console.error('Fetch transactions error:', error);
      set({ financialError: 'Unable to load transactions' });
    }
  },

  fetchPayouts: async (params?: any) => {
    if (!useAuthStore.getState().isAuthenticated) return;
    try {
      const res: any = await deliveryApi.getPayouts(params);
      const list = Array.isArray(res) ? res : (res?.data || res?.items || []);
      set({ payouts: list, financialError: null });
    } catch (error) {
      console.error('Fetch payouts error:', error);
      set({ financialError: 'Unable to load payouts' });
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

  rejectOrder: async (orderId: string, reason?: string) => {
    try {
      await deliveryApi.rejectOrder(orderId, reason);
      set(state => ({
        newOrders: state.newOrders.filter(o => o.id !== orderId),
      }));
    } catch (error) {
      console.error('Reject order error:', error);
      throw error;
    }
  },

  updateDeliveryStatus: async (orderId: string, status: string, data?: any) => {
    try {
      await deliveryApi.updateDeliveryStatus(orderId, status, data);
      // Refresh both lists
      await Promise.all([
        get().fetchActiveDeliveries(),
        get().fetchNewOrders(),
      ]);
    } catch (error) {
      console.error('Update delivery status error:', error);
      throw error;
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

  startTransit: async (orderId: string) => {
    try {
      await deliveryApi.startTransit(orderId);
      await get().fetchActiveDeliveries();
    } catch (error) {
      console.error('Start transit error:', error);
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
    if (!isSupabaseConfigured()) {
      // No Supabase env — realtime is simply unavailable; the 60s safety
      // refetch below keeps the lists fresh without a channel.
      set({ realtimeChannel: null });
    } else {
      // Listen for delivery-request rows (OrderVendorGroup) instead of the order
      // itself: READY_FOR_PICKUP lives on order_vendor_groups, and orders never
      // carry a READY_FOR_DELIVERY value. Payload rows are raw group records
      // (not the flattened API shape), so we never merge them directly — every
      // event just triggers the throttled safety refetch of both lists.
      const channel = supabase
        .channel('delivery-orders')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'order_vendor_groups',
          filter: 'status=eq.READY_FOR_PICKUP',
        }, () => {
          runSafetyRefetch(get);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'order_vendor_groups',
          filter: 'status=eq.READY_FOR_PICKUP',
        }, () => {
          runSafetyRefetch(get);
        })
        .subscribe();

      set({ realtimeChannel: channel });
    }

    if (safetyInterval) clearInterval(safetyInterval);
    lastSafetyRefetch = Date.now();
    safetyInterval = setInterval(() => runSafetyRefetch(get), SAFETY_REFETCH_MS);
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

  // Wipe all state (orders, earnings, notifications, availability, realtime
  // subscription). Called on logout and on any 401-triggered session clear so
  // a previous partner's data never leaks into the next session.
  reset: () => {
    get().cleanupRealtime();
    set({
      newOrders: [],
      activeDeliveries: [],
      deliveryHistory: [],
      earnings: null,
      transactions: [],
      payouts: [],
      notifications: [],
      unreadCount: 0,
      financialError: null,
      isLoading: false,
      isAvailable: true,
    });
  },
}));
