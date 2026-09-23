import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreType, CartItem, Product } from '../types';
import { customerApi } from './api';

const STORE_KEY = 'selected_store_type';

interface StoreContextType {
  storeType: StoreType;
  setStoreType: (type: StoreType) => Promise<void>;

  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  lastAddedProductId: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  // Keyed by productId, not the CartItem row's own id — matches the real
  // PATCH/DELETE /cart/items/:productId routes (see api.ts).
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeCartItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  incrementCart: (product: Product) => void;

  wishlistCount: number;
  fetchWishlistCount: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// CartService.findAll() (apps/api/src/cart/cart.service.ts) returns
// `{ items, total }`, not a bare array or `{ data: [...] }` — the previous
// `res?.data ?? []` fallback never matched that shape, so every successful
// fetchCart() silently wiped the cart back to empty right after the optimistic
// placeholder was added, leaving that placeholder's blank "Product"/₹0 row as
// the only thing ever shown. The demo-cart fallback (api.ts) returns a bare
// array, which Array.isArray already covers.
function unwrap<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [storeType, setStoreTypeState] = useState<StoreType>(StoreType.ORGANIC);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => { loadStoreType(); fetchCart(); fetchWishlistCount(); }, []);

  async function loadStoreType() {
    try {
      const saved = await AsyncStorage.getItem(STORE_KEY);
      if (saved && Object.values(StoreType).includes(saved as StoreType)) {
        setStoreTypeState(saved as StoreType);
      }
    } catch {
      // ignore
    }
  }

  const setStoreType = async (type: StoreType) => {
    setStoreTypeState(type);
    await AsyncStorage.setItem(STORE_KEY, type);
  };

  const fetchCart = useCallback(async () => {
    try {
      const res = await customerApi.getCart();
      setCartItems(unwrap<CartItem>(res));
    } catch {
      setCartItems([]);
    }
  }, []);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    setLastAddedProductId(productId);
    await customerApi.addToCart(productId, quantity);
    await fetchCart();
  }, [fetchCart]);

  const updateCartItem = useCallback(async (productId: string, quantity: number) => {
    await customerApi.updateCartItem(productId, quantity);
    await fetchCart();
  }, [fetchCart]);

  const removeCartItem = useCallback(async (productId: string) => {
    await customerApi.removeCartItem(productId);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await customerApi.clearCart();
    setCartItems([]);
  }, []);

  // Optimistic bump for the inline "+" quick-add on product cards — a real fetchCart
  // follow-up (via addToCart) reconciles the true state shortly after. Carries the
  // real product so the cart sheet never shows a blank "Product"/₹0 row during that
  // brief window; bumps quantity on the existing row if it's already in the cart
  // instead of adding a second one.
  const incrementCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) => (
          item.productId === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        ));
      }
      return [...prev, {
        id: `optimistic-${Date.now()}`,
        productId: product.id,
        product,
        quantity: 1,
        createdAt: new Date().toISOString(),
      }];
    });
  }, []);

  const fetchWishlistCount = useCallback(async () => {
    try {
      const res = await customerApi.getWishlist() as any;
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setWishlistCount(list.length);
    } catch {
      setWishlistCount(0);
    }
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.product?.price || 0) * (item.quantity || 1), 0),
    [cartItems],
  );

  return (
    <StoreContext.Provider value={{
      storeType, setStoreType,
      cartItems, cartCount, subtotal, lastAddedProductId,
      fetchCart, addToCart, updateCartItem, removeCartItem, clearCart, incrementCart,
      wishlistCount, fetchWishlistCount,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
