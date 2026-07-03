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

  const token = localStorage.getItem('admin_token');
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
    const token = localStorage.getItem('admin_token');
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

// Admin-specific API methods
export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
  getProfile: () => api.get<any>('/users/me'),

  // Dashboard
  getDashboard: () => api.get<any>('/admin/dashboard'),

  // Users
  getUsers: (params?: any) => api.get<any>('/users', params),
  getUser: (id: string) => api.get<any>(`/users/${id}`),
  updateUserStatus: (id: string, status: string) =>
    api.patch<any>(`/users/${id}/status`, { status }),

  // Vendors
  getVendors: (params?: any) => api.get<any>('/vendors', params),
  getVendor: (id: string) => api.get<any>(`/vendors/${id}`),
  updateVendorStatus: (id: string, status: string) =>
    api.patch<any>(`/vendors/${id}/status`, { status }),
  updateVendorCommission: (id: string, commissionPct: number) =>
    api.patch<any>(`/vendors/${id}/commission`, { commissionPct }),

  // Delivery Partners
  getDeliveryPartners: (params?: any) => api.get<any>('/delivery-partners', params),
  getDeliveryPartner: (id: string) => api.get<any>(`/delivery-partners/${id}`),
  updateDeliveryPartnerStatus: (id: string, status: string) =>
    api.patch<any>(`/delivery-partners/${id}/status`, { status }),

  // Products
  getProducts: (params?: any) => api.get<any>('/products', params),
  getProduct: (id: string) => api.get<any>(`/products/${id}`),
  createProduct: (data: any) => api.post<any>('/products', data),
  updateProduct: (id: string, data: any) => api.patch<any>(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete<any>(`/products/${id}`),
  approveProduct: (id: string) => api.patch<any>(`/products/${id}/approve`, {}),

  // Categories
  getCategories: (params?: any) => api.get<any>('/categories', params),
  createCategory: (data: any) => api.post<any>('/categories', data),
  updateCategory: (id: string, data: any) => api.patch<any>(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<any>(`/categories/${id}`),

  // Sub-Categories
  getSubCategories: (params?: any) => api.get<any>('/sub-categories', params),
  createSubCategory: (data: any) => api.post<any>('/sub-categories', data),
  updateSubCategory: (id: string, data: any) => api.patch<any>(`/sub-categories/${id}`, data),
  deleteSubCategory: (id: string) => api.delete<any>(`/sub-categories/${id}`),

  // Brands
  getBrands: (params?: any) => api.get<any>('/brands', params),
  createBrand: (data: any) => api.post<any>('/brands', data),
  updateBrand: (id: string, data: any) => api.patch<any>(`/brands/${id}`, data),
  deleteBrand: (id: string) => api.delete<any>(`/brands/${id}`),

  // Orders
  getOrders: (params?: any) => api.get<any>('/orders', params),
  getOrder: (id: string) => api.get<any>(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    api.patch<any>(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string, reason: string) =>
    api.post<any>(`/orders/${id}/cancel`, { reason }),

  // Returns
  getReturns: (params?: any) => api.get<any>('/returns', params),
  processReturn: (id: string, status: string, reason?: string) =>
    api.patch<any>(`/returns/${id}`, { status, reason }),

  // Coupons
  getCoupons: (params?: any) => api.get<any>('/coupons', params),
  createCoupon: (data: any) => api.post<any>('/coupons', data),
  updateCoupon: (id: string, data: any) => api.patch<any>(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete<any>(`/coupons/${id}`),

  // Offers
  getOffers: (params?: any) => api.get<any>('/offers', params),
  createOffer: (data: any) => api.post<any>('/offers', data),
  updateOffer: (id: string, data: any) => api.patch<any>(`/offers/${id}`, data),
  deleteOffer: (id: string) => api.delete<any>(`/offers/${id}`),

  // Payments & Commission
  getPayments: (params?: any) => api.get<any>('/payments', params),
  getCommissionSummary: (params?: any) => api.get<any>('/commission/summary', params),
  markCommissionPaid: (vendorId: string) =>
    api.patch<any>(`/commission/pay`, { vendorId }),
  updateCommissionRate: (vendorId: string, rate: number) =>
    api.patch<any>(`/commission/rate`, { vendorId, rate }),

  // Payouts
  getVendorPayouts: (params?: any) => api.get<any>('/payouts/vendors', params),
  getDeliveryPayouts: (params?: any) => api.get<any>('/payouts/delivery', params),

  // Inventory
  getInventory: (params?: any) => api.get<any>('/inventory', params),
  updateStock: (productId: string, quantity: number) =>
    api.patch<any>(`/inventory/${productId}`, { quantity }),
  getLowStock: (params?: any) => api.get<any>('/inventory/low-stock', params),

  // Reviews
  getReviews: (params?: any) => api.get<any>('/reviews', params),
  deleteReview: (id: string) => api.delete<any>(`/reviews/${id}`),

  // AI Logs
  getAILogs: (params?: any) => api.get<any>('/ai/logs', params),
  getAIRecommendations: (params?: any) => api.get<any>('/ai/recommendations', params),
  getAIAnalytics: (params?: any) => api.get<any>('/ai/analytics', params),

  // Reports
  getSalesReport: (params?: any) => api.get<any>('/reports/sales', params),
  getRevenueReport: (params?: any) => api.get<any>('/reports/revenue', params),

  // CMS
  getCMSPages: (params?: any) => api.get<any>('/cms/pages', params),
  createCMSPage: (data: any) => api.post<any>('/cms/pages', data),
  updateCMSPage: (id: string, data: any) => api.patch<any>(`/cms/pages/${id}`, data),
  deleteCMSPage: (id: string) => api.delete<any>(`/cms/pages/${id}`),
  getBanners: (params?: any) => api.get<any>('/cms/banners', params),
  createBanner: (data: any) => api.post<any>('/cms/banners', data),
  updateBanner: (id: string, data: any) => api.patch<any>(`/cms/banners/${id}`, data),
  deleteBanner: (id: string) => api.delete<any>(`/cms/banners/${id}`),
  getNotifications: (params?: any) => api.get<any>('/notifications', params),
  sendNotification: (data: any) => api.post<any>('/notifications', data),

  // Roles & Permissions
  getRoles: (params?: any) => api.get<any>('/roles', params),
  createRole: (data: any) => api.post<any>('/roles', data),
  updateRole: (id: string, data: any) => api.patch<any>(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete<any>(`/roles/${id}`),
  getPermissions: (params?: any) => api.get<any>('/roles/permissions', params),
  updatePermissions: (roleId: string, permissions: string[]) =>
    api.patch<any>(`/roles/${roleId}/permissions`, { permissions }),

  // Zones
  getZones: (params?: any) => api.get<any>('/zones', params),
  createZone: (data: any) => api.post<any>('/zones', data),
  updateZone: (id: string, data: any) => api.patch<any>(`/zones/${id}`, data),
  deleteZone: (id: string) => api.delete<any>(`/zones/${id}`),

  // Analytics (alias for AI analytics)
  getAnalytics: (params?: any) => api.get<any>('/admin/analytics', params),

  // Commissions
  getCommissions: (params?: any) => api.get<any>('/commission', params),

  // Payouts (generic)
  getPayouts: (params?: any) => api.get<any>('/payouts', params),

  // Reports (generic)
  getReports: (params?: any) => api.get<any>('/reports', params),

  // CMS (alias)
  getCMS: (params?: any) => api.get<any>('/cms/pages', params),

  // Product approval
  updateProductApproval: (id: string, isApproved: boolean) =>
    api.patch<any>(`/products/${id}/approval`, { isApproved }),

  // Returns status update
  updateReturnStatus: (id: string, status: string) =>
    api.patch<any>(`/returns/${id}/status`, { status }),

  // Refunds
  getRefunds: (params?: any) => api.get<any>('/returns/refunds', params),

  // Ratings
  getRatings: (params?: any) => api.get<any>('/reviews/ratings', params),

  // Settings
  updateSettings: (settings: any) => api.patch<any>('/admin/settings', settings),
};
