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
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  totalDeliveries: number;
}

interface DeliveryState {
  newOrders: Order[];
  activeDeliveries: Order[];
  deliveryHistory: Order[];
  earnings: Earnings | null;
  isLoading: boolean;
  isAvailable: boolean;
  realtimeChannel: any;

  // Actions
  fetchNewOrders: () => Promise<void>;
  fetchActiveDeliveries: () => Promise<void>;
  fetchDeliveryHistory: (params?: any) => Promise<void>;
  fetchEarnings: (period?: string) => Promise<void>;
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string) => Promise<void>;
  updateDeliveryStatus: (orderId: string, status: string, data?: any) => Promise<void>;
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
  isLoading: false,
  isAvailable: true,
  realtimeChannel: null,

  fetchNewOrders: async () => {
    set({ isLoading: true });
    try {
      const res = await deliveryApi.getNewOrders();
      set({ newOrders: res?.data || [] });
    } catch (error) {
      console.error('Fetch new orders error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveDeliveries: async () => {
    set({ isLoading: true });
    try {
      const res = await deliveryApi.getActiveDeliveries();
      set({ activeDeliveries: res?.data || [] });
    } catch (error) {
      console.error('Fetch active deliveries error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDeliveryHistory: async (params?: any) => {
    set({ isLoading: true });
    try {
      const res = await deliveryApi.getDeliveryHistory(params);
      set({ deliveryHistory: res?.data || [] });
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
    const channel = supabase
      .channel('delivery-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: 'status=eq.READY_FOR_DELIVERY',
      }, (payload) => {
        // New order available
        const newOrder = payload.new as Order;
        set(state => ({
          newOrders: [newOrder, ...state.newOrders],
        }));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const updatedOrder = payload.new as Order;
        // Refresh lists on relevant changes
        get().fetchActiveDeliveries();
        get().fetchNewOrders();
      })
      .subscribe();

    set({ realtimeChannel: channel });
  },

  cleanupRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },
}));
