import { supabase } from './supabase';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Guard placeholder/localhost in production (same as customer-app)
if (!__DEV__) {
  const u = process.env.EXPO_PUBLIC_API_URL || '';
  if (u.includes('YOUR-') || u.includes('localhost')) {
    console.error(`[SECURITY] EXPO_PUBLIC_API_URL is placeholder/localhost (${u}) — Play review will fail.`);
  }
}

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
  const body = await response.json();
  return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
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

  // Upload files (proof of delivery photos, etc.)
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers, body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    const body = await response.json();
    return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
  },

  // Push token management
  registerPushToken: (expoPushToken: string) =>
    api.post<any>('/notifications/register', { expoPushToken }),

  unregisterPushToken: () =>
    api.delete<any>('/notifications/unregister'),
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

  // Account deletion (Google Play policy) — anonymizes the account server-side
  deleteAccount: () => api.delete<{ message: string }>('/users/me'),

  // New Orders
  getNewOrders: (params?: any) =>
    api.get<any>('/delivery/new-orders', params),

  // Accept/Reject — Accept claims the order from the delivery pool
  // (POST /orders/:id/accept). The id here is the vendor-group id shown in
  // the pool; the backend routes on it directly.
  acceptOrder: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/accept`),

  rejectOrder: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/reject`, {}),

  // Active Deliveries
  getActiveDeliveries: (params?: any) =>
    api.get<any>('/delivery/active', params),

  // PDF delivery lifecycle status advances (all keyed on the vendor-group id)
  startPickup: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/start-pickup`),

  arrivedAtPickup: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/arrived-pickup`),

  startTransit: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/start-transit`),

  arrivedAtCustomer: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/arrived-customer`),

  // Complete the delivery (verification/handover done) — backend accepts
  // OUT_FOR_DELIVERY or ARRIVED_AT_CUSTOMER -> DELIVERED
  completeDelivery: (orderId: string, data?: any) =>
    api.post<any>(`/orders/${orderId}/deliver`, data),

  // Verify Pickup OTP (6-digit code the vendor shares)
  verifyPickupOTP: (orderId: string, otp: string) =>
    api.post<any>(`/orders/${orderId}/verify-pickup`, { otp }),

  // Delivery History
  getDeliveryHistory: (params?: any) =>
    api.get<any>('/delivery/history', params),

  // Earnings
  getEarnings: (params?: any) =>
    api.get<any>('/delivery/earnings', params),

  // Dashboard glance stats (new orders, active, delivered counts)
  getDashboardStats: () =>
    api.get<any>('/delivery/dashboard'),

  // Availability
  setAvailability: (isAvailable: boolean) =>
    api.patch<any>('/delivery/availability', { isAvailable }),

  // Location
  updateLocation: (lat: number, lng: number) =>
    api.patch<any>('/delivery/location', { lat, lng }),

  // Vehicle/Zone setup (first-time, or edited later from Profile)
  setupProfile: (data: { vehicleType: string; zoneName: string }) =>
    api.post<any>('/delivery/setup', data),

  // File upload (proof of delivery photos, etc.)
  upload: async <T>(path: string, formData: FormData): Promise<T> =>
    api.upload<T>(path, formData),

  // KYC document submission — same situation as setupProfile above.
  submitKycDocuments: (data: { documentType: string; documentNumber?: string; documentUrl: string }[]) =>
    api.post<any>('/kyc/submit', { documents: data }),

  getKycStatus: () => api.get<any>('/kyc/status'),

  // Failed delivery — report a delivery that couldn't be completed
  reportDeliveryFailure: (data: { orderId: string; reason: string; details?: string }) =>
    api.post<any>('/delivery/failure', data),
};
