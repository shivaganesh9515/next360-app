const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler;
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

  const token = localStorage.getItem('vendor_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, { ...fetchOptions, headers });
  } catch (err: any) {
    throw new Error('Unable to connect to server. Please try again later.');
  }

  // Handle 401 Unauthorized — session expired or invalid token
  if (response.status === 401) {
    // Dev-skip: when vendor_dev_skip is in localStorage, return undefined
    // instead of throwing so the dashboard can render without auth.
    if (typeof window !== 'undefined' && localStorage.getItem('vendor_dev_skip')) {
      return undefined as T;
    }
    localStorage.removeItem('vendor_token');
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error('API returned invalid response. Is the server running?');
  }
  return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
}

// Like request() but preserves pagination meta from the response envelope.
// Returns { data, meta } for paginated endpoints, or just the data for non-paginated.
async function requestWithMeta<T>(path: string, options: ApiOptions = {}): Promise<{ data: T; meta?: any }> {
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

  const token = localStorage.getItem('vendor_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(url, { ...fetchOptions, headers });
  } catch (err: any) {
    throw new Error('Unable to connect to server. Please try again later.');
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined' && localStorage.getItem('vendor_dev_skip')) {
      return { data: undefined as T };
    }
    localStorage.removeItem('vendor_token');
    if (onUnauthorized) onUnauthorized();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return { data: undefined as T };

  const text = await response.text();
  let body: any;
  try { body = JSON.parse(text); } catch {
    throw new Error('API returned invalid response. Is the server running?');
  }

  // Unwrap the { success, data, meta } envelope, preserving meta
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return { data: body.data, meta: body.meta };
  }
  return { data: body };
}

export const api = {
  get: <T>(path: string, params?: Record<string, any>) =>
    request<T>(path, { method: 'GET', params }),

  getWithMeta: <T>(path: string, params?: Record<string, any>) =>
    requestWithMeta<T>(path, { method: 'GET', params }),

  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = localStorage.getItem('vendor_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    const body = await response.json();
    return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
  },
};

export const vendorApi = {
  // Generic methods (delegated to base api)
  post: <T>(path: string, body?: any): Promise<T> => api.post<T>(path, body),
  get: <T>(path: string, params?: any): Promise<T> => api.get<T>(path, params),

  // Multipart file upload (product images etc.) — see api.upload for envelope handling
  upload: <T>(path: string, formData: FormData): Promise<T> => api.upload<T>(path, formData),

  // Auth
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
  signup: (data: any) => api.post<any>('/auth/signup', { ...data, role: 'VENDOR' }),
  verifyOtp: (email: string, otp: string) =>
    api.post<any>('/auth/verify-otp', { email, otp }),
  forgotPassword: (email: string) =>
    api.post<any>('/auth/forgot-password', { email }),
  getProfile: () => api.get<any>('/auth/me'),

  // Vendor profile
  getMyProfile: () => api.get<any>('/vendors/my-profile'),
  updateMyProfile: (data: any) => api.patch<any>('/vendors/my-profile', data),

  // Dashboard
  getDashboard: (vendorId: string) =>
    api.get<any>(`/vendors/${vendorId}/stats`),

  // Products
  getProducts: (params?: any) =>
    api.get<any>('/products', params),
  getVendorProducts: (vendorId: string, params?: any) =>
    api.get<any>(`/vendors/${vendorId}/products`, params),
  getProduct: (id: string) => api.get<any>(`/products/${id}`),
  createProduct: (data: any) => api.post<any>('/products', data),
  updateProduct: (id: string, data: any) => api.patch<any>(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete<any>(`/products/${id}`),

  // Orders
  getOrders: (params?: any) => api.get<any>('/orders/vendor', params),
  getOrdersWithMeta: (params?: any) => api.getWithMeta<any[]>('/orders/vendor', params),
  getOrder: (id: string) => api.get<any>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string, reason?: string) =>
    api.patch<any>(`/orders/${id}/status`, reason ? { status, cancellationReason: reason } : { status }),
  updateVendorGroupStatus: (id: string, groupId: string, status: string) =>
    api.patch<any>(`/orders/${id}/groups/${groupId}/status`, { status }),

  // Categories
  getCategories: (params?: any) => api.get<any>('/categories', params),

  // Coupons
  getCoupons: () => api.get<any[]>('/coupons'),
  createCoupon: (data: any) => api.post<any>('/coupons', data),
  updateCoupon: (id: string, data: any) => api.patch<any>(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete<any>(`/coupons/${id}`),

  // Offers
  getOffers: () => api.get<any[]>('/offers'),
  createOffer: (data: any) => api.post<any>('/offers', data),
  updateOffer: (id: string, data: any) => api.patch<any>(`/offers/${id}`, data),
  deleteOffer: (id: string) => api.delete<any>(`/offers/${id}`),

  // Customers
  getCustomers: () => api.get<any[]>('/vendors/me/customers'),

  // Analytics
  getAnalytics: (period?: string) =>
    api.get<any>('/vendors/me/analytics', { period }),
  // Earnings
  getEarnings: () => api.get<any>('/vendors/me/earnings'),
  getPayouts: (params?: any) => api.get<any[]>('/vendors/me/payouts', params),
  getTransactions: (params?: any) =>
    api.get<any[]>('/vendors/me/transactions', params),
  getTransactionsWithMeta: (params?: any) =>
    api.getWithMeta<any[]>('/vendors/me/transactions', params),

  // Store
  getStore: (vendorId: string) => api.get<any>(`/vendors/${vendorId}`),
  updateStore: (vendorId: string, data: any) =>
    api.patch<any>(`/vendors/${vendorId}`, data),

  // Notifications
  getNotifications: () => api.get<any[]>('/notifications'),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    api.patch<any>(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    api.post<any>('/notifications/read-all'),

  // Returns
  getReturns: () => api.get<any[]>('/returns/vendor'),
  updateReturnStatus: (id: string, status: string, reason?: string) =>
    api.patch<any>(`/returns/${id}`, { status, reason }),

  // Cancel a vendor group within an order
  cancelVendorGroup: (orderId: string, groupId: string, reason?: string) =>
    api.post<any>(`/orders/${orderId}/groups/${groupId}/cancel`, { reason }),

  // Cancel the entire order (admin only, or customer self-service)
  cancelOrder: (orderId: string, reason?: string) =>
    api.post<any>(`/orders/${orderId}/cancel`, { reason }),
};
