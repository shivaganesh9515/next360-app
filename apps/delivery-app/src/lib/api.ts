import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Backend-issued JWT — signed with the API's JWT_SECRET, sub = Prisma User.id.
// Supabase access tokens are rejected by the backend JwtStrategy (see audit:
// signature verified against JWT_SECRET, user looked up by payload.sub).
const BACKEND_TOKEN_KEY = 'next360.delivery.backend_jwt';
let backendTokenCache: string | null = null;

export async function getBackendToken(): Promise<string | null> {
  if (backendTokenCache) return backendTokenCache;
  backendTokenCache = await AsyncStorage.getItem(BACKEND_TOKEN_KEY);
  return backendTokenCache;
}

export async function setBackendToken(token: string | null): Promise<void> {
  backendTokenCache = token;
  if (token) {
    await AsyncStorage.setItem(BACKEND_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(BACKEND_TOKEN_KEY);
  }
}

// Centralized 401 handler — registered once by the auth store. Invoked
// whenever any protected request returns 401 so a single code path can
// invalidate the session. No navigation happens here; the auth state change
// is what triggers route protection.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

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

  const token = await getBackendToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    if (response.status === 401) unauthorizedHandler?.();
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
    const token = await getBackendToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers, body: formData,
    });
    if (!response.ok) {
      if (response.status === 401) unauthorizedHandler?.();
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

  // Notifications inbox — per-user, read-only views over the backend records
  getNotifications: (params?: any) =>
    api.get<any>('/notifications', params),

  getNotificationUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markNotificationRead: (id: string) =>
    api.patch<any>(`/notifications/${id}/read`),

  markAllNotificationsRead: () =>
    api.post<any>('/notifications/read-all'),
};

// Delivery-specific API methods
export const deliveryApi = {
  // Auth
  login: async (email: string, password: string) => {
    // Use the backend-issued JWT (signed with JWT_SECRET, sub = Prisma
    // User.id). Supabase access tokens do not verify against the backend's
    // JwtStrategy — see authentication audit.
    const data = await api.post<any>('/auth/login', { email, password });
    await setBackendToken(data.access_token);
    return data;
  },

  signOut: async () => {
    await setBackendToken(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return;
  },

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  // Phone OTP — bare 10-digit Indian number (no +91); backend DTO validates
  // /^[6-9]\d{9}$/. Successful verify-otp-login returns a backend-issued JWT
  // (same token family as /auth/login) which we persist via setBackendToken.
  sendOtp: (phone: string) =>
    api.post<{ message: string }>('/auth/send-otp', { phone }),

  verifyOtpLogin: async (phone: string, otp: string) => {
    const data = await api.post<{ user: any; access_token: string; isNewUser: boolean; session?: any }>(
      '/auth/verify-otp-login',
      { phone, otp, role: 'DELIVERY_PARTNER' },
    );
    await setBackendToken(data.access_token);
    return data;
  },

  // Profile
  getProfile: () => api.get<any>('/users/me'),
  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) =>
    api.patch<any>('/users/me', data),

  // Zones (public list — used to populate the Vehicle & Zone onboarding step)
  getZones: () => api.get<any>('/zones'),

  // Account deletion (Google Play policy) — anonymizes the account server-side
  deleteAccount: () => api.delete<{ message: string }>('/users/me'),

  // New Orders
  getNewOrders: (params?: any) =>
    api.get<any>('/delivery/new-orders', params),

  // Accept/Decline. Both act on the OrderVendorGroup: the list payload's
  // `id` IS the group id (the parent order id arrives as `orderId`). The old
  // /orders/:id/assign is ADMIN-only and would 403 a delivery partner.
  acceptOrder: (groupId: string) =>
    api.post<any>('/delivery/claim', { groupId }),

  // Declines are persisted server-side so the group is not offered again.
  rejectOrder: (groupId: string, reason?: string) =>
    api.post<any>('/delivery/reject', { groupId, reason }),

  // Active Deliveries
  getActiveDeliveries: (params?: any) =>
    api.get<any>('/delivery/active', params),

  // Status Updates — uses the DP-scoped deliver endpoint instead of the
  // admin-only PATCH /orders/:id/status, which would throw 403 for a
  // DELIVERY_PARTNER role. The backend's completeDelivery handles the
  // transition from PICKED_UP/IN_TRANSIT → DELIVERED.
  updateDeliveryStatus: (orderId: string, status: string, data?: any) =>
    api.post<any>(`/orders/${orderId}/deliver`, { status, ...data }),

  // Verify Pickup OTP. orderId here is the parent ORDER id — the backend's
  // verify-pickup/start-transit/deliver endpoints all resolve the assignment
  // through the order, so the mobile screen must pass order.orderId, not the
  // short group id used in list keys.
  verifyPickupOTP: (orderId: string, otp: string) =>
    api.post<any>(`/orders/${orderId}/verify-pickup`, { otp }),

  // Start transit — PICKED_UP -> OUT_FOR_DELIVERY. The state machine requires
  // this leg before deliver; the mobile screen calls it right after a
  // successful OTP verify.
  startTransit: (orderId: string) =>
    api.post<any>(`/orders/${orderId}/start-transit`, {}),

  // Delivery History
  getDeliveryHistory: (params?: any) =>
    api.get<any>('/delivery/history', params),

  // Earnings
  getEarnings: (params?: any) =>
    api.get<any>('/delivery/earnings', params),

  // Financial ledger: one transaction per completed delivery (rupees, from
  // the backend's persisted DeliveryAssignment records — never fabricated).
  getTransactions: (params?: any) =>
    api.get<any>('/delivery/transactions', params),

  getTransaction: (id: string) =>
    api.get<any>(`/delivery/transactions/${id}`),

  // Weekly payout history (read-only). Payouts are created by the backend's
  // weekly cron; the partner only ever sees their own records.
  getPayouts: (params?: any) =>
    api.get<any>('/delivery/payouts', params),

  getPayout: (id: string) =>
    api.get<any>(`/delivery/payouts/${id}`),

  // Availability
  setAvailability: (isAvailable: boolean) =>
    api.patch<any>('/delivery/availability', { isAvailable }),

  // Location
  updateLocation: (lat: number, lng: number) =>
    api.patch<any>('/delivery/location', { lat, lng }),

  // Vehicle/Zone setup (first-time, or edited later from Profile).
  setupProfile: (data: { vehicleType: string; zoneName: string }) =>
    api.post<any>('/delivery/setup', data),

  // File upload (proof of delivery photos, etc.)
  upload: async <T>(path: string, formData: FormData): Promise<T> =>
    api.upload<T>(path, formData),

  // KYC document submission — POST /kyc/submit takes a single SubmitKycDto
  // (the backend stores ONE document at a time per user), so the app uploads
  // the document photo first and submits the returned URL here.
  submitKycDocuments: (data: { documentType: string; documentNumber?: string; documentUrl?: string }) =>
    api.post<any>('/kyc/submit', data),

  getKycStatus: () => api.get<any>('/kyc/status'),

  // Failed delivery — report a delivery that couldn't be completed
  reportDeliveryFailure: (data: { orderId: string; reason: string; details?: string }) =>
    api.post<any>('/delivery/failure', data),
};

// Support tickets — create, list own, view thread, reply
export const supportApi = {
  createTicket: (data: { subject: string; message: string; category?: string; orderId?: string; priority?: string }) =>
    api.post<any>('/support/tickets', data),

  getMyTickets: (params?: any) =>
    api.get<any>('/support/tickets/mine', params),

  getTicket: (id: string) =>
    api.get<any>(`/support/tickets/${id}`),

  replyToTicket: (id: string, message: string) =>
    api.post<any>(`/support/tickets/${id}/reply`, { message }),
};
