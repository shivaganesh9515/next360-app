import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { filterDemoProducts, getDemoCategories, findDemoProduct, getDemoDeliveryAssignment } from './demoData';
import { CartItem, Address, Order } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

// Validate API URL in production — prevent app from running with localhost
if (!__DEV__ && !process.env.EXPO_PUBLIC_API_URL) {
  console.error('[SECURITY] EXPO_PUBLIC_API_URL is not set. App will not function correctly.');
}

const TOKEN_KEY = 'auth_token';

// Every demo-data fallback below (products/categories/cart/addresses/orders/
// delivery tracking) exists so screens work with no backend during local dev.
// That's the right call in __DEV__. It is NOT the right call in a production
// build: a real user hitting a transient API failure must see an error state,
// not a fabricated order with a fake rider. EXPO_PUBLIC_ENABLE_DEMO_FALLBACK
// exists only to let a staging/preview build opt back in deliberately (e.g.
// for a demo to stakeholders) — it must never be set in a real prod build.
const DEMO_FALLBACK_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK === 'true';

// In-memory cart fallback — used only when the real /cart API is unreachable
// (no backend wired up yet), same rationale as filterDemoProducts. Without
// this, addToCart/updateCartItem/removeCartItem would silently throw and the
// mini-cart bar would never appear, since cartItems would never actually
// update. Resets on app reload — acceptable for demo/dev use.
let demoCartItems: CartItem[] = [];
let demoCartIdCounter = 0;

function demoAddToCart(productId: string, quantity: number): CartItem[] {
  const product = findDemoProduct(productId);
  if (!product) throw new Error('Product not found');
  const existing = demoCartItems.find((item) => item.productId === productId);
  if (existing) {
    demoCartItems = demoCartItems.map((item) => (
      item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
    ));
  } else {
    demoCartItems = [...demoCartItems, {
      id: `demo-cart-${(demoCartIdCounter += 1)}`,
      productId,
      product,
      quantity,
      createdAt: new Date().toISOString(),
    }];
  }
  return demoCartItems;
}

function demoUpdateCartItem(itemId: string, quantity: number): CartItem[] {
  demoCartItems = demoCartItems.map((item) => (item.id === itemId ? { ...item, quantity } : item));
  return demoCartItems;
}

function demoRemoveCartItem(itemId: string): CartItem[] {
  demoCartItems = demoCartItems.filter((item) => item.id !== itemId);
  return demoCartItems;
}

// In-memory address + order fallback — same rationale as the cart above.
// Without this, saved addresses (and therefore the real address on an order)
// never persist in demo mode, which is why Order Tracking's map was always
// falling back to a fixed placeholder location instead of the user's own
// address: there was no real address data anywhere in the demo pipeline.
let demoAddresses: Address[] = [];
let demoAddressIdCounter = 0;

function demoGetAddresses(): Address[] {
  return demoAddresses;
}

function demoCreateAddress(data: Partial<Address>): Address {
  const address: Address = {
    id: `demo-address-${(demoAddressIdCounter += 1)}`,
    label: data.label,
    fullAddress: data.fullAddress || '',
    city: data.city || '',
    state: data.state || '',
    pincode: data.pincode || '',
    lat: data.lat,
    lng: data.lng,
    isDefault: demoAddresses.length === 0,
  };
  demoAddresses = [...demoAddresses, address];
  return address;
}

function demoUpdateAddress(id: string, data: Partial<Address>): Address | undefined {
  demoAddresses = demoAddresses.map((a) => (a.id === id ? { ...a, ...data } : a));
  return demoAddresses.find((a) => a.id === id);
}

function demoDeleteAddress(id: string): void {
  demoAddresses = demoAddresses.filter((a) => a.id !== id);
}

// In-memory phone-OTP auth fallback — apps/api now has real send-otp/
// verify-otp-login endpoints, but this still fires whenever they're
// unreachable (no backend running locally, same as every other demo
// fallback in this file). Fixed OTP "123456" mirrors the fixed demo coupon
// codes below — a known code beats a random one nobody could ever guess in
// a demo build. Keyed by phone so the same number always resolves to the
// same account across a session (first verify = signup, every one after =
// login), matching the Zomato-style "one phone flow" the real endpoint
// implements too.
const DEMO_OTP = '123456';
let demoUsersByPhone: Record<string, { id: string; phone: string; name: string; role: string }> = {};
let demoUserIdCounter = 0;

function demoVerifyOtpLogin(phone: string, otp: string): { access_token: string; user: any; isNewUser: boolean } {
  if (otp !== DEMO_OTP) throw new Error(`Incorrect code. In demo mode, use ${DEMO_OTP}.`);
  const existing = demoUsersByPhone[phone];
  if (existing) {
    return { access_token: `demo-token-${existing.id}`, user: existing, isNewUser: false };
  }
  const user = { id: `demo-user-${(demoUserIdCounter += 1)}`, phone, name: '', role: 'CUSTOMER' };
  demoUsersByPhone[phone] = user;
  return { access_token: `demo-token-${user.id}`, user, isNewUser: true };
}

// Fixed demo coupon catalog — just enough to exercise the checkout "Apply
// Coupon" flow end-to-end with no live backend.
const DEMO_COUPONS: Record<string, { type: 'PERCENTAGE' | 'FIXED'; value: number; maxDiscount?: number; minOrderAmount?: number }> = {
  WELCOME10: { type: 'PERCENTAGE', value: 10, maxDiscount: 100, minOrderAmount: 0 },
  FLAT50: { type: 'FIXED', value: 50, minOrderAmount: 300 },
};

function demoValidateCoupon(code: string, orderAmount: number) {
  const coupon = DEMO_COUPONS[code.trim().toUpperCase()];
  if (!coupon) throw new Error('Invalid or expired coupon code');
  if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order of ₹${coupon.minOrderAmount} required for this coupon`);
  }
  const discount = coupon.type === 'FIXED'
    ? coupon.value
    : Math.min(Math.round(orderAmount * (coupon.value / 100)), coupon.maxDiscount ?? Infinity);
  return { code: code.trim().toUpperCase(), type: coupon.type, value: coupon.value, discount };
}

// Groups a flat order-items list by vendor, matching CLAUDE.md's
// OrderVendorGroup pattern (one order splits into one independently-tracked
// group per vendor). Without this, demo orders had no vendorGroups at all,
// so OrderDetailScreen's entire per-vendor timeline silently rendered
// nothing whenever there was no live backend — multi-vendor splitting was
// only ever visible if a real API happened to return it.
function buildDemoVendorGroups(items: any[], status: string) {
  const byVendor = new Map<string, any[]>();
  for (const item of items) {
    const key = item.vendorId || item.vendorName || 'unknown-vendor';
    if (!byVendor.has(key)) byVendor.set(key, []);
    byVendor.get(key)!.push(item);
  }
  return Array.from(byVendor.entries()).map(([vendorId, groupItems]) => ({
    id: `demo-group-${vendorId}`,
    vendorId,
    vendor: { storeName: groupItems[0].vendorName || 'Vendor' },
    status,
    items: groupItems,
  }));
}

// Local-only set tracking which out-of-stock products the user has asked to
// be notified about — resets on app reload, same as the other demo state.
const demoRestockSubscriptions = new Set<string>();

// Orders placed while there's no real backend — keyed by demo order id so
// getOrder's fallback can look up the *actual* address/items the user checked
// out with, instead of reconstructing something generic.
const demoOrders = new Map<string, Order>();
let demoOrderIdCounter = 0;

// expo-secure-store has no web implementation (Android/iOS/tvOS only per Expo docs) —
// fall back to AsyncStorage's web-backed localStorage on that platform.
const isWeb = Platform.OS === 'web';

async function getToken(): Promise<string | null> {
  try {
    return isWeb ? await AsyncStorage.getItem(TOKEN_KEY) : await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  if (isWeb) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  if (isWeb) await AsyncStorage.removeItem(TOKEN_KEY);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
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
  const body = await response.json();
  // apps/api wraps every response in { success, data, meta } (ResponseInterceptor).
  // This was never unwrapped here — every caller got the raw envelope instead
  // of its payload, silently masked in dev because DEMO_FALLBACK_ENABLED meant
  // no code path ever actually hit a real backend. Individual callers below
  // that defensively check `res.data || res` keep working fine against the
  // now-unwrapped value too (it's just already the array/object they wanted).
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
    const body = await response.json();
    return (body && typeof body === 'object' && 'success' in body && 'data' in body) ? body.data : body;
  },
};

// Customer-specific API methods
export const customerApi = {
  // Auth — Zomato-style single phone-OTP flow: same call verifies and either
  // logs an existing account straight in or provisions a new one, no separate
  // signup/password screens. Falls back to an in-memory demo login/signup
  // whenever apps/api's real /auth/send-otp + /auth/verify-otp-login (see
  // AuthService.verifyOtpLogin) aren't reachable, e.g. no backend running
  // locally — same pattern as every other demo fallback in this file.
  sendOtp: async (phone: string): Promise<{ message: string }> => {
    try {
      return await api.post<{ message: string }>('/auth/send-otp', { phone });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return { message: `OTP sent (demo mode — use ${DEMO_OTP})` };
    }
  },
  verifyOtpLogin: async (phone: string, otp: string): Promise<{ access_token: string; user: any; isNewUser: boolean }> => {
    try {
      return await api.post('/auth/verify-otp-login', { phone, otp });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoVerifyOtpLogin(phone, otp);
    }
  },
  getProfile: () => api.get<any>('/users/me'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.patch<any>('/users/me', data),

  // Google Login — sends the verified Google profile to the backend,
  // which creates a new account or logs in an existing one by email.
  // Falls back to a demo Google sign-in when the real API is unreachable,
  // same pattern as the phone OTP demo fallback.
  googleAuth: async (data: { email: string; googleId: string; name?: string; avatarUrl?: string }) => {
    try {
      return await api.post<{ access_token: string; user: any; isNewUser: boolean }>('/auth/google', data);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return {
        access_token: `demo-google-token-${Date.now()}`,
        user: {
          id: `demo-google-user-${Date.now()}`,
          email: data.email,
          name: data.name || 'Google User',
          avatarUrl: data.avatarUrl || null,
          role: 'CUSTOMER',
        },
        isNewUser: true,
      };
    }
  },

  // Products — falls back to local demo data when the real API returns
  // nothing (no backend/DB wired up yet), so screens can be checked visually
  // without needing a live database.
  getProducts: async (params?: Record<string, any>) => {
    try {
      const res = await api.get<any>('/products', params);
      const list = Array.isArray(res) ? res : res?.data;
      if (list && list.length > 0) return res;
      if (!DEMO_FALLBACK_ENABLED) return res;
      return filterDemoProducts(params);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return filterDemoProducts(params);
    }
  },
  getProduct: async (id: string) => {
    try {
      return await api.get<any>(`/products/${id}`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      const demo = findDemoProduct(id);
      if (demo) return demo;
      throw new Error('Product not found');
    }
  },

  // Vendor Storefront — fetches a vendor's profile details. Falls back to
  // a synthesized result from demo data when the real API isn't reachable.
  getVendorStorefront: async (vendorId: string) => {
    try {
      return await api.get<any>(`/vendors/${vendorId}/storefront`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return { id: vendorId, storeName: 'Next360 Farms', storeType: 'ORGANIC', rating: 4.5, productCount: 10 };
    }
  },

  // Categories — same demo fallback as getProducts.
  getCategories: async (params?: Record<string, any>) => {
    try {
      const res = await api.get<any>('/categories', params);
      const list = Array.isArray(res) ? res : res?.data;
      if (list && list.length > 0) return res;
      if (!DEMO_FALLBACK_ENABLED) return res;
      return getDemoCategories(params?.storeType);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return getDemoCategories(params?.storeType);
    }
  },

  // Cart — falls back to an in-memory demo cart when the real API is
  // unreachable, same rationale as getProducts/getCategories. Without this,
  // add/update/remove would silently throw and cartItems would never update.
  getCart: async () => {
    try {
      return await api.get<any>('/cart');
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoCartItems;
    }
  },
  addToCart: async (productId: string, quantity: number) => {
    try {
      return await api.post<any>('/cart', { productId, quantity });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoAddToCart(productId, quantity);
    }
  },
  updateCartItem: async (itemId: string, quantity: number) => {
    try {
      return await api.patch<any>(`/cart/${itemId}`, { quantity });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoUpdateCartItem(itemId, quantity);
    }
  },
  removeCartItem: async (itemId: string) => {
    try {
      return await api.delete<any>(`/cart/${itemId}`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoRemoveCartItem(itemId);
    }
  },
  clearCart: async () => {
    try {
      return await api.delete<any>('/cart');
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      demoCartItems = [];
      return demoCartItems;
    }
  },

  // Addresses — fall back to an in-memory demo address book when the real
  // API is unreachable, same rationale as the cart above.
  getAddresses: async () => {
    try {
      return await api.get<any[]>('/addresses');
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoGetAddresses();
    }
  },
  createAddress: async (data: any) => {
    try {
      return await api.post<any>('/addresses', data);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoCreateAddress(data);
    }
  },
  updateAddress: async (id: string, data: any) => {
    try {
      return await api.patch<any>(`/addresses/${id}`, data);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoUpdateAddress(id, data);
    }
  },
  deleteAddress: async (id: string) => {
    try {
      return await api.delete<any>(`/addresses/${id}`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      demoDeleteAddress(id);
    }
  },

  // Orders
  // Falls back to synthesizing a demo order from whatever's actually in the
  // demo cart + the real address the user selected at checkout — stored so
  // getOrder can retrieve the *actual* address later (this is what Order
  // Tracking's map needs; without it there's no real address anywhere in the
  // demo pipeline and the map always fell back to a fixed placeholder).
  createOrder: async (data: any) => {
    try {
      return await api.post<any>('/orders', data);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      const address = demoGetAddresses().find((a) => a.id === data.addressId);
      const items = demoCartItems.map((cartItem) => ({
        id: `demo-order-item-${cartItem.id}`,
        productId: cartItem.productId,
        productName: cartItem.product?.name || 'Product',
        productImage: cartItem.product?.images?.[0] || '',
        quantity: cartItem.quantity,
        price: Number(cartItem.product?.price || 0),
        vendorId: cartItem.product?.vendorId || '',
        vendorName: cartItem.product?.vendor?.storeName || 'Vendor',
      }));
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdAt = new Date().toISOString();
      const id = `demo-order-${(demoOrderIdCounter += 1)}`;
      const order: Order = {
        id,
        orderNo: id.slice(-8).toUpperCase(),
        status: 'OUT_FOR_DELIVERY' as any,
        totalAmount,
        paymentMethod: data.paymentMethod || 'COD',
        paymentStatus: 'PENDING',
        addressId: data.addressId || '',
        address,
        items,
        vendorGroups: buildDemoVendorGroups(items, 'OUT_FOR_DELIVERY'),
        createdAt,
        updatedAt: createdAt,
        estimatedDeliveryAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      };
      demoOrders.set(id, order);
      return order;
    }
  },
  // Previously had no demo fallback at all — Order History would always be
  // empty in demo mode (throwing straight to an unhandled error), even right
  // after successfully placing a demo order via createOrder above.
  getOrders: async (params?: Record<string, any>) => {
    try {
      return await api.get<any>('/orders', params);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return Array.from(demoOrders.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },
  // Falls back to the demo order stored at createOrder-time (has the real
  // address/items), or — for a cold deep link with no matching demo order —
  // a minimal synthesized one reconstructed from the current demo cart.
  getOrder: async (id: string) => {
    try {
      return await api.get<any>(`/orders/${id}`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      const existing = demoOrders.get(id);
      if (existing) return existing;

      const items = demoCartItems.map((cartItem) => ({
        id: `demo-order-item-${cartItem.id}`,
        productId: cartItem.productId,
        productName: cartItem.product?.name || 'Product',
        productImage: cartItem.product?.images?.[0] || '',
        quantity: cartItem.quantity,
        price: Number(cartItem.product?.price || 0),
        vendorId: cartItem.product?.vendorId || '',
        vendorName: cartItem.product?.vendor?.storeName || 'Vendor',
      }));
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const createdAt = new Date().toISOString();
      return {
        id,
        orderNo: id.slice(0, 8).toUpperCase(),
        status: 'OUT_FOR_DELIVERY',
        totalAmount,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        addressId: '',
        address: demoGetAddresses()[0],
        items,
        vendorGroups: buildDemoVendorGroups(items, 'OUT_FOR_DELIVERY'),
        createdAt,
        updatedAt: createdAt,
        estimatedDeliveryAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      };
    }
  },
  getOrderTimeline: (id: string) => api.get<any>(`/orders/${id}/timeline`),
  // No documented endpoint for this yet — falls back to a simulated moving
  // rider (see getDemoDeliveryAssignment) whenever the real one isn't there.
  getDeliveryAssignment: async (orderId: string, orderCreatedAt: string) => {
    try {
      return await api.get<any>(`/orders/${orderId}/delivery-assignment`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return getDemoDeliveryAssignment(orderId, orderCreatedAt);
    }
  },
  // Previously there was no self-service way to cancel an order at all from
  // the customer app, despite CLAUDE.md listing `POST cancel` on the orders
  // module. Demo fallback mutates the same stored demo order getOrder reads
  // from, so the UI reflects CANCELLED immediately without a refetch.
  cancelOrder: async (orderId: string, reason?: string) => {
    try {
      return await api.post<any>(`/orders/${orderId}/cancel`, { reason });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      const existing = demoOrders.get(orderId);
      if (existing) {
        const updated = {
          ...existing,
          status: 'CANCELLED' as any,
          vendorGroups: (existing.vendorGroups || []).map((g) => ({ ...g, status: 'CANCELLED' })),
          updatedAt: new Date().toISOString(),
        };
        demoOrders.set(orderId, updated);
        return updated;
      }
      return { id: orderId, status: 'CANCELLED' };
    }
  },
  // Same gap as cancelOrder — the `returns/` module (POST request) exists on
  // the backend but nothing in this app ever called it.
  requestReturn: async (data: { orderId: string; orderItemId: string; reason: string }) => {
    try {
      return await api.post<any>('/returns/request', data);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return {
        id: `demo-return-${Date.now()}`,
        orderId: data.orderId,
        orderItemId: data.orderItemId,
        reason: data.reason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
    }
  },

  // Wishlist
  getWishlist: () => api.get<any[]>('/wishlist'),
  addToWishlist: (productId: string) =>
    api.post<any>('/wishlist', { productId }),
  removeFromWishlist: (productId: string) =>
    api.delete<any>(`/wishlist/${productId}`),
  checkWishlist: (productId: string) =>
    api.get<{ isInWishlist: boolean }>(`/wishlist/check/${productId}`),
  // Restock notifications — there's no documented backend endpoint for this
  // yet (not in CLAUDE.md's API module list), so this always falls back to a
  // local per-session subscription set once the real call 404s/fails. Wired
  // up now so the UI (out-of-stock "Notify Me" toggle) is fully functional
  // and ready to swap to a real endpoint later with no UI changes needed.
  subscribeRestock: async (productId: string) => {
    try {
      return await api.post<any>(`/products/${productId}/notify-restock`, {});
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      demoRestockSubscriptions.add(productId);
      return { productId, subscribed: true };
    }
  },
  unsubscribeRestock: async (productId: string) => {
    try {
      return await api.delete<any>(`/products/${productId}/notify-restock`);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      demoRestockSubscriptions.delete(productId);
      return { productId, subscribed: false };
    }
  },
  isSubscribedToRestock: (productId: string) => demoRestockSubscriptions.has(productId),

  // Reviews
  getProductReviews: (productId: string, params?: Record<string, any>) =>
    api.get<any>(`/reviews/product/${productId}`, params),
  createReview: async (data: any) => {
    try {
      return await api.post<any>('/reviews', data);
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return { id: `demo-review-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    }
  },

  // Coupons — falls back to a small fixed demo coupon set when the real API
  // is unreachable, same rationale as products/cart/addresses above. Without
  // this, "Apply Coupon" at checkout would always fail with a generic error
  // in demo mode, making the whole feature untestable end-to-end.
  validateCoupon: async (code: string, orderAmount: number, vendorId?: string) => {
    try {
      return await api.post<any>('/coupons/validate', { code, orderAmount, vendorId });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      return demoValidateCoupon(code, orderAmount);
    }
  },

  // Offers
  getActiveOffers: (storeType?: string) =>
    api.get<any[]>('/offers/active', { storeType }),

  // CMS Banners
  getBanners: (params?: Record<string, any>) =>
    api.get<any[]>('/cms/banners', params),

  // Delivery Slots — fetches available delivery time windows for a zone
  getDeliverySlots: async (zoneId?: string) => {
    try {
      return await api.get<any>(`/delivery-slots`, { zoneId });
    } catch (err) {
      if (!DEMO_FALLBACK_ENABLED) throw err;
      // Demo fallback: generate synthetic slots for today/tomorrow
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        today: { date: today, dayName: dayNames[now.getDay()], slots: [
          { id: 'demo-slot-1', startTime: '09:00', endTime: '12:00', maxOrders: 20, booked: 5, available: 15, isPast: false, date: today },
          { id: 'demo-slot-2', startTime: '14:00', endTime: '17:00', maxOrders: 20, booked: 10, available: 10, isPast: false, date: today },
        ]},
        tomorrow: { date: tomorrowStr, dayName: dayNames[tomorrow.getDay()], slots: [
          { id: 'demo-slot-3', startTime: '09:00', endTime: '12:00', maxOrders: 20, booked: 2, available: 18, isPast: false, date: tomorrowStr },
          { id: 'demo-slot-4', startTime: '14:00', endTime: '17:00', maxOrders: 20, booked: 8, available: 12, isPast: false, date: tomorrowStr },
          { id: 'demo-slot-5', startTime: '18:00', endTime: '21:00', maxOrders: 15, booked: 0, available: 15, isPast: false, date: tomorrowStr },
        ]},
      };
    }
  },

  // Payments — Razorpay
  createRazorpayOrder: (orderId: string) =>
    api.post<{ key: string; amount: number; currency: string; order_id: string; receipt: string }>('/payments/razorpay/order', { orderId }),
  verifyPayment: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post<{ success: boolean; message: string }>('/payments/razorpay/verify', data),

  // Notifications — accepts optional pagination params
  getNotifications: (params?: { page?: number; limit?: number }) =>
    api.get<any[]>('/notifications', params as Record<string, any>),
  markNotificationRead: (id: string) =>
    api.patch<any>(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post<any>('/notifications/read-all'),
  registerPushToken: (expoPushToken: string) =>
    api.post<any>('/notifications/register', { expoPushToken }),
  unregisterPushToken: () => api.delete<any>('/notifications/unregister'),

  // AI Features
  sendAiMessage: (message: string, context?: { productId?: string; orderId?: string }) =>
    api.post<any>('/ai/chat', { message, context }),
  scanProduct: async (imageUri: string): Promise<any> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'scan.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('file', { uri: imageUri, name: filename, type } as any);
    return api.upload<any>('/ai/scan', formData);
  },
  getAiRecommendations: (limit?: number) =>
    api.get<any>('/ai/recommendations', { limit: limit || 10 }),
  getHealthInsights: () => api.get<any>('/ai/health-insights'),
  getChatHistory: (page?: number, limit?: number) =>
    api.get<any>('/ai/chat-history', { page: page || 1, limit: limit || 20 }),
};
