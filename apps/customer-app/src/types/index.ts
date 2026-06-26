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

export enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  storeType: StoreType;
  image?: string;
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
  vendor?: { id: string; storeName: string };
  rating?: number;
  reviewCount?: number;
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
  fullName: string;
  phone: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: AddressType;
  isDefault: boolean;
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
  createdAt: string;
  updatedAt: string;
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
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
