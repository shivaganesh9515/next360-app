export enum StoreType {
  ORGANIC = 'ORGANIC',
  NATURAL = 'NATURAL',
  ECO_FRIENDLY = 'ECO_FRIENDLY',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}


export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  storeType: StoreType;
  // Matches the backend's real field name (prisma Category.imageUrl) — was
  // previously named `image` here, which never matched the API response and
  // meant every category silently fell back to the same generic icon.
  imageUrl?: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  unit: string;
  stock: number;
  status: ProductStatus;
  storeType: StoreType;
  categoryId: string;
  category?: Category;
  vendorId: string;
  vendor?: {
    id: string;
    storeName: string;
    deliveryTimeMin?: number;
    deliveryTimeMax?: number;
    deliveryLabel?: string;
    // True only when the vendor has an admin-approved NPOP_CERTIFICATE on file
    // (see products.service.ts withNpopVerified) — drives the "NPOP Verified"
    // badge. Absent/false must never be presented as certified.
    isNpopVerified?: boolean;
  };
  rating?: number;
  reviewCount?: number;
  certification?: string; // e.g. 'USDA Organic', 'India Organic', 'Non-GMO'
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  createdAt: string;
}

export interface Address {
  id: string;
  label?: string;
  fullAddress: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

// One order splits into one independently-tracked group per vendor (the
// Swiggy/Zomato cart-split model per CLAUDE.md) — each group has its own
// fulfilment status distinct from the top-level Order.status.
export interface OrderVendorGroup {
  id: string;
  vendorId: string;
  vendor?: { storeName: string };
  status: string;
  items: OrderItem[];
}

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  addressId: string;
  address?: Address;
  items: OrderItem[];
  vendorGroups?: OrderVendorGroup[];
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryAt?: string;
  deliveryAssignment?: DeliveryAssignment;
}

// Per CLAUDE.md: delivery partner pushes lat/lng periodically → Supabase
// Realtime relays it to the customer app (no polling). currentLat/currentLng
// arrive live via a `postgres_changes` subscription on this row, not fetched
// once and left static.
export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  currentLat?: number;
  currentLng?: number;
  vehicleType?: string;
  rating?: number;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  deliveryPartnerId: string;
  deliveryPartner?: DeliveryPartner;
  otp: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  pickedUpAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  vendorId: string;
  vendorName: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  bannerImage?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  storeType: StoreType;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderItemId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  /**
   * Optional payload for navigation on tap — e.g. { screen: 'OrderDetail', orderId: '...' }
   * Set by the backend NotificationsService when creating the notification.
   */
  data?: {
    screen?: string;
    orderId?: string;
    tab?: string;
  };
}

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  offerLabel?: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  storeType: StoreType;
  position: number;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
