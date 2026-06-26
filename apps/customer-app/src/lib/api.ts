import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'auth_token';

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
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
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { ...fetchOptions, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    if (response.status === 401) {
      await removeToken();
    }
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
    const token = await getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
};

// Customer-specific API methods
export const customerApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
  signup: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post<{ access_token: string; user: any }>('/auth/register', { ...data, role: 'CUSTOMER' }),
  getProfile: () => api.get<any>('/users/me'),

  // Products
  getProducts: (params?: Record<string, any>) =>
    api.get<any>('/products', params),
  getProduct: (id: string) => api.get<any>(`/products/${id}`),

  // Categories
  getCategories: (params?: Record<string, any>) =>
    api.get<any>('/categories', params),

  // Cart
  getCart: () => api.get<any>('/cart'),
  addToCart: (productId: string, quantity: number) =>
    api.post<any>('/cart', { productId, quantity }),
  updateCartItem: (itemId: string, quantity: number) =>
    api.patch<any>(`/cart/${itemId}`, { quantity }),
  removeCartItem: (itemId: string) =>
    api.delete<any>(`/cart/${itemId}`),
  clearCart: () => api.delete<any>('/cart'),

  // Addresses
  getAddresses: () => api.get<any[]>('/addresses'),
  createAddress: (data: any) => api.post<any>('/addresses', data),
  updateAddress: (id: string, data: any) => api.patch<any>(`/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete<any>(`/addresses/${id}`),

  // Orders
  createOrder: (data: any) => api.post<any>('/orders', data),
  getOrders: (params?: Record<string, any>) =>
    api.get<any>('/orders', params),
  getOrder: (id: string) => api.get<any>(`/orders/${id}`),

  // Wishlist
  getWishlist: () => api.get<any[]>('/wishlist'),
  addToWishlist: (productId: string) =>
    api.post<any>('/wishlist', { productId }),
  removeFromWishlist: (productId: string) =>
    api.delete<any>(`/wishlist/${productId}`),
  checkWishlist: (productId: string) =>
    api.get<{ isInWishlist: boolean }>(`/wishlist/check/${productId}`),

  // Reviews
  getProductReviews: (productId: string, params?: Record<string, any>) =>
    api.get<any>(`/reviews/product/${productId}`, params),
  createReview: (data: any) => api.post<any>('/reviews', data),

  // Coupons
  validateCoupon: (code: string, orderAmount: number, vendorId?: string) =>
    api.post<any>('/coupons/validate', { code, orderAmount, vendorId }),

  // Offers
  getActiveOffers: (storeType?: string) =>
    api.get<any[]>('/offers/active', { storeType }),

  // Notifications
  getNotifications: () => api.get<any[]>('/notifications'),
  markNotificationRead: (id: string) =>
    api.patch<any>(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post<any>('/notifications/read-all'),
};
