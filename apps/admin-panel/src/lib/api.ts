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

  try {
    const response = await fetch(url, { ...fetchOptions, headers });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
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
    // apps/api wraps every response in { success, data, meta } (ResponseInterceptor)
    // — unwrap it here so callers get the payload directly instead of the envelope.
    return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
  } catch (e) {
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check your connection.');
    }
    throw e;
  }
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
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || error.error || `HTTP ${response.status}`);
    }
    const text = await response.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error('Upload returned invalid response');
    }
    return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
  },
};

// Admin-specific API methods
export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { email, password }),
  getProfile: () => api.get<any>('/users/me'),

  // Dashboard — aggregate endpoint now exists via AdminController.
  // Returns today's pulse, pending actions, order pipeline, weekly revenue
  // chart, recent orders, and aggregate counts across all entities.
  getDashboard: () => api.get<any>('/admin/dashboard'),

  // Users
  getUsers: (params?: any) => api.get<any>('/users', params),
  // Neither of these exist on the backend — UsersController only has GET
  // (list), GET me, PATCH me, and PATCH :id/role. No single-user GET, no
  // status field/endpoint. Real gaps.
  getUser: (id: string) => api.get<any>(`/users/${id}`),
  updateUserStatus: (id: string, status: string) =>
    api.patch<any>(`/users/${id}/status`, { status }),

  // Vendors
  getVendors: (params?: any) => api.get<any>('/vendors', params),
  getVendor: (id: string) => api.get<any>(`/vendors/${id}`),
  getVendorDetail: (id: string) => api.get<any>(`/vendors/${id}/detail`),
  // PATCH /vendors/:id/status now exists via VendorsController for admin
  // status changes (activate, suspend). Approve is POST /vendors/:id/approve.
  // Reject reasons can be passed in the request body.
  updateVendorStatus: (id: string, status: string) =>
    api.patch<any>(`/vendors/${id}/status`, { status }),
  // Was /vendors/:id/commission (doesn't exist) — actual route is
  // /commission/rate/:vendorId.
  updateVendorCommission: (vendorId: string, commissionPct: number) =>
    api.patch<any>(`/commission/rate/${vendorId}`, { commissionPct }),

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
  // PATCH /products/:id/approve exists via ProductsController for admin
  // product approval. isApproved is handled server-side by the approve
  // method — no direct field patch is needed.
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

  // Disputes — dedicated disputes endpoints
  getDisputes: () => api.get<any>('/disputes'),
  resolveDispute: (id: string, payload: { status: string; resolution?: string }) =>
    api.patch<any>(`/disputes/${id}/resolve`, payload),

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
  // No bare GET /payments list route exists (only /payments/:orderId and the
  // razorpay/refund action routes) — real gap.
  getPayments: (params?: any) => api.get<any>('/payments', params),
  getCommissionSummary: (params?: any) => api.get<any>('/commission/summary', params),
  // Real route needs the Commission record's own id (PATCH /commission/:id/pay),
  // not a vendorId — there's no "mark all of this vendor's commission paid"
  // endpoint. Unused today; leaving path as-is rather than guessing a lookup.
  markCommissionPaid: (vendorId: string) =>
    api.patch<any>(`/commission/pay`, { vendorId }),
  // Was /commission/rate (no vendorId in path) — actual route is
  // /commission/rate/:vendorId. See updateVendorCommission above, which is
  // the one actually wired to a page; this one is currently unused.
  updateCommissionRate: (vendorId: string, rate: number) =>
    api.patch<any>(`/commission/rate/${vendorId}`, { commissionPct: rate }),

  // Payouts — no /payouts/* routes exist on the backend at all yet. Only
  // GET /vendors/me/payouts exists, and that's a vendor's own payouts, not
  // an admin cross-vendor oversight view. Real gap.
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

  // AI Logs — real routes are nested under /ai/admin/*, not bare /ai/*.
  getAILogs: (params?: any) => api.get<any>('/ai/admin/logs', params),
  getAIRecommendations: (params?: any) => api.get<any>('/ai/recommendations', params),
  getAIAnalytics: (params?: any) => api.get<any>('/ai/admin/analytics', params),

  // Reports — no /reports/* routes exist on the backend at all. Real gap.
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
  // No POST /notifications route — NotificationsController only has GET,
  // read-all, register/unregister (device tokens). No "admin sends a
  // notification" endpoint. Real gap.
  sendNotification: (data: any) => api.post<any>('/notifications', data),

  // Roles & Permissions
  getRoles: (params?: any) => api.get<any>('/roles', params),
  createRole: (data: any) => api.post<any>('/roles', data),
  updateRole: (id: string, data: any) => api.patch<any>(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete<any>(`/roles/${id}`),
  // Was /roles/permissions — actual route is the bare /permissions (a
  // sibling resource on the same controller, not nested under roles).
  getPermissions: (params?: any) => api.get<any>('/permissions', params),
  createPermission: (data: any) => api.post<any>('/permissions', data),
  deletePermission: (id: string) => api.delete<any>(`/permissions/${id}`),
  // Permissions live on the Role record (CreateRoleDto.permissions: string[]),
  // updated through the same PATCH /roles/:id updateRole already uses.
  updatePermissions: (roleId: string, permissions: string[]) =>
    api.patch<any>(`/roles/${roleId}`, { permissions }),

  // Zones
  getZones: (params?: any) => api.get<any>('/zones', params),
  createZone: (data: any) => api.post<any>('/zones', data),
  updateZone: (id: string, data: any) => api.patch<any>(`/zones/${id}`, data),
  deleteZone: (id: string) => api.delete<any>(`/zones/${id}`),

  // Audit Logs
  getAuditLogs: (params?: any) => api.get<any>('/audit-logs', params),
  getAuditLogsSummary: (params?: any) => api.get<any>('/audit-logs/summary', params),

  // Loyalty
  getUserLoyalty: (userId: string) => api.get<any>(`/loyalty/user/${userId}`),
  recalculateUserTier: (userId: string) => api.post<any>(`/loyalty/tier/recalculate`, { userId }),

  // Analytics — no /admin/analytics route exists. The closest real endpoint
  // is /ai/admin/analytics (AI-usage analytics specifically, not general
  // sales/GMV analytics) — not a true substitute, so left pointing at the
  // nonexistent route rather than silently serving the wrong data.
  getAnalytics: (params?: any) => api.get<any>('/admin/analytics', params),

  // Commissions — no bare GET /commission list route exists. Closest real
  // endpoint is /commission/summary (see getCommissionSummary above): when
  // called by an ADMIN it returns commission data across all vendors,
  // including a recentCommissions list — not truly paginated the way this
  // page's page/limit params imply, but the only backend data that exists.
  getCommissions: (params?: any) => api.get<any>('/commission/summary', params),

  // Payouts (generic) — same gap as getVendorPayouts/getDeliveryPayouts above.
  getPayouts: (params?: any) => api.get<any>('/payouts', params),

  // Reports (generic) — same gap as getSalesReport/getRevenueReport above.
  getReports: (params?: any) => api.get<any>('/reports', params),

  // CMS (alias)
  getCMS: (params?: any) => api.get<any>('/cms/pages', params),

  // Deprecated path — the correct endpoint for approving products is
  // PATCH /products/:id/approve via approveProduct(). This method uses
  // /products/:id/approval which doesn't exist on the backend; kept for
  // reference but callers should use approveProduct() instead.
  updateProductApproval: (id: string, isApproved: boolean) =>
    api.patch<any>(`/products/${id}/approval`, { isApproved }),

  // Returns status update — was /returns/:id/status (doesn't exist); actual
  // route is the bare /returns/:id, same one processReturn above already
  // uses correctly. Kept as a separate method since call sites differ.
  updateReturnStatus: (id: string, status: string) =>
    api.patch<any>(`/returns/${id}`, { status }),

  // Refunds
  getRefunds: (params?: any) => api.get<any>('/returns/refunds', params),

  // Ratings — no /reviews/ratings aggregate route exists (ReviewsController
  // only has POST, my/product listings, and delete). Real gap.
  getRatings: (params?: any) => api.get<any>('/reviews/ratings', params),

  // Settings — endpoints now exist via AdminModule
  getSettings: () => api.get<any>('/admin/settings'),
  updateSettings: (settings: any) => api.patch<any>('/admin/settings', settings),
};
