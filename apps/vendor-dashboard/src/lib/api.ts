const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

  const token = localStorage.getItem('vendor_token');
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

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = localStorage.getItem('vendor_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

// Vendor-specific API methods
export const vendorApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
  signup: (data: any) => api.post<any>('/auth/register', data),
  verifyOtp: (email: string, otp: string) =>
    api.post<any>('/auth/verify-otp', { email, otp }),
  getProfile: () => api.get<any>('/users/me'),

  // Dashboard
  getDashboard: (vendorId: string) =>
    api.get<any>(`/vendors/${vendorId}/stats`),

  // Products
  getProducts: (params?: any) =>
    api.get<any>('/products', params),
  getProduct: (id: string) => api.get<any>(`/products/${id}`),
  createProduct: (data: any) => api.post<any>('/products', data),
  updateProduct: (id: string, data: any) => api.patch<any>(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete<any>(`/products/${id}`),

  // Orders
  getOrders: (params?: any) => api.get<any>('/orders/vendor', params),
  getOrder: (id: string) => api.get<any>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    api.patch<any>(`/orders/${id}/status`, { status }),

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
  getSalesAnalytics: (period?: string) =>
    api.get<any>('/vendors/me/analytics/sales', { period }),
  getRevenueAnalytics: (period?: string) =>
    api.get<any>('/vendors/me/analytics/revenue', { period }),

  // Earnings
  getEarnings: () => api.get<any>('/vendors/me/earnings'),
  getPayouts: () => api.get<any[]>('/vendors/me/payouts'),
  getTransactions: (params?: any) =>
    api.get<any[]>('/vendors/me/transactions', params),

  // Store
  getStore: (vendorId: string) => api.get<any>(`/vendors/${vendorId}`),
  updateStore: (vendorId: string, data: any) =>
    api.patch<any>(`/vendors/${vendorId}`, data),

  // Notifications
  getNotifications: () => api.get<any[]>('/notifications'),
  markNotificationRead: (id: string) =>
    api.patch<any>(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
    api.post<any>('/notifications/read-all'),

  // Returns
  getReturns: () => api.get<any[]>('/returns/vendor'),
  updateReturnStatus: (id: string, status: string, reason?: string) =>
    api.patch<any>(`/returns/${id}`, { status, reason }),
};
