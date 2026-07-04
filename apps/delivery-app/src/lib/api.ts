import { supabase } from './supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const { params, ...fetchOptions } = options;

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, any>) =>
    request<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  // Push token management
  registerPushToken: (token: string) =>
    api.post<any>('/notifications/push-token', { token }),

  unregisterPushToken: () =>
    api.delete<any>('/notifications/push-token'),
};

// Delivery-specific API methods
export const deliveryApi = {
  // Auth
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Profile
  getProfile: () => api.get<any>('/users/me'),

  // New Orders
  getNewOrders: (params?: any) =>
    api.get<any>('/orders', { ...params, status: 'READY_FOR_DELIVERY', assignedTo: null }),

  // Accept/Reject
  acceptOrder: (orderId: string) =>
    api.patch<any>(`/orders/${orderId}/assign`, {}),

  rejectOrder: (orderId: string) =>
    api.patch<any>(`/orders/${orderId}/decline`, {}),

  // Active Deliveries
  getActiveDeliveries: (params?: any) =>
    api.get<any>('/orders', { ...params, status: 'PICKED_UP,IN_TRANSIT' }),

  // Status Updates
  updateDeliveryStatus: (orderId: string, status: string, data?: any) =>
    api.patch<any>(`/orders/${orderId}/status`, { status, ...data }),

  // Verify Pickup OTP
  verifyPickupOTP: (orderId: string, otp: string) =>
    api.post<any>(`/orders/${orderId}/verify-pickup`, { otp }),

  // Delivery History
  getDeliveryHistory: (params?: any) =>
    api.get<any>('/orders', { ...params, status: 'DELIVERED' }),

  // Earnings
  getEarnings: (params?: any) =>
    api.get<any>('/delivery/earnings', params),

  // Availability
  setAvailability: (isAvailable: boolean) =>
    api.patch<any>('/delivery/availability', { isAvailable }),

  // Location
  updateLocation: (lat: number, lng: number) =>
    api.patch<any>('/delivery/location', { lat, lng }),
};
