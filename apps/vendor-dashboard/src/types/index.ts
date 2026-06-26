export type StoreType = 'ORGANIC' | 'NATURAL' | 'ECO_FRIENDLY';
export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PACKED' | 'ASSIGNED_TO_DELIVERY' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatarUrl?: string;
}

export interface Vendor {
  id: string;
  storeName: string;
  storeSlug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  storeType: StoreType;
  status: VendorStatus;
  commissionRate: number;
  rating: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  unit: string;
  stock: number;
  images: string[];
  sku?: string;
  isActive: boolean;
  category?: { id: string; name: string };
  vendor?: { id: string; storeName: string };
  variants: ProductVariant[];
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  storeType: StoreType;
  productCount?: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customer: { name: string; email: string; phone?: string };
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topProduct?: { name: string; sales: number };
  revenueOverTime: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}

export interface EarningsSummary {
  totalEarnings: number;
  thisMonth: number;
  pending: number;
  paid: number;
  history: { period: string; amount: number; status: string }[];
}

export interface Payout {
  id: string;
  period: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  initiatedAt: string;
  paidAt?: string;
}

export interface Transaction {
  id: string;
  orderNo: string;
  customer: string;
  amount: number;
  type: 'SALE' | 'REFUND' | 'PAYOUT';
  status: string;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ReturnRequest {
  id: string;
  orderNo: string;
  customerName: string;
  itemName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
