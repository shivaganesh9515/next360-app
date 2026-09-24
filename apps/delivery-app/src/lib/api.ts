import AsyncStorage from '@react-native-async-storage/async-storage';

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

const AUTH_TOKEN_KEY = 'next360.dp.auth.token';

let authToken: string | null = null;
let authTokenLoaded = false;

// NestJS access_token (from POST /auth/login) — stored locally, never in
// Supabase. Loaded once, then cached in memory.
export async function getAuthToken(): Promise<string | null> {
  if (!authTokenLoaded) {
    authToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    authTokenLoaded = true;
  }
  return authToken;
}

export async function setAuthToken(token: string | null): Promise<void> {
  authToken = token;
  authTokenLoaded = true;
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
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

  const token = await getAuthToken();

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
    const token = await getAuthToken();
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
  // Auth — local backend login (NestJS POST /auth/login). Returns the NestJS
  // access_token which is persisted locally and attached to every request.
  login: async (email: string, password: string) => {
    const data = await api.post<any>('/auth/login', { email, password });
    if (data?.access_token) {
      await setAuthToken(data.access_token);
    }
    return data;
  },

  signOut: async () => {
    await setAuthToken(null);
  },

  forgotPassword: (email: string) =>
    api.post<any>('/auth/forgot-password', { email }),

  // Profile
  getProfile: () => api.get<any>('/users/me'),

  // Update own profile (name / phone / avatar) — PATCH /users/me
  updateProfile: (data: { name?: string; phone?: string; avatarUrl?: string }) =>
    api.patch<any>('/users/me', data),

  // Account deletion (Google Play policy) — anonymizes the account server-side
  deleteAccount: () => api.delete<{ message: string }>('/users/me'),

  // New Orders
  getNewOrders: (params?: any) =>
    api.get<any>('/delivery/new-orders', params),

  // Accept a delivery request. The backend claim endpoint targets the
  // OrderVendorGroup (group.id in the list payload), NOT the parent order —
  // the old /orders/:id/assign is ADMIN-only and would 403 a partner.
  acceptOrder: (groupId: string) =>
    api.post<any>('/delivery/claim', { groupId }),

  // Decline a delivery request. groupId is the OrderVendorGroup id, and the
  // backend persists the decline so the group is not offered again.
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

  // Verify Pickup OTP (6-digit). orderId here is the parent ORDER id — the
  // backend's verify-pickup/start-transit/deliver endpoints all resolve the
  // assignment through the order, so the mobile screen must pass order.orderId,
  // not the short group id used in list keys.
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

  // Vehicle/Zone setup (first-time, or edited later from Profile). POST
  // /delivery/setup takes { vehicleType, zoneName } and resolves the zone
  // lookup server-side (the /delivery-partners/setup variant wants a zoneId
  // UUID, which the app does not have).
  setupProfile: (data: { vehicleType: string; zoneName: string }) =>
    api.post<any>('/delivery/setup', data),

  // File upload (proof of delivery photos, etc.)
  upload: async <T>(path: string, formData: FormData): Promise<T> =>
    api.upload<T>(path, formData),

  // KYC document submission — flat SubmitKycDto shape (the backend stores ONE
  // document at a time per user; the old array payload got rejected by the
  // whitelist validator). Upload the document photo first, then submit the
  // returned URL here.
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
