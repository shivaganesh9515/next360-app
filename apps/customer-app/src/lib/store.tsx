import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreType, CartItem } from '../types';
import { customerApi } from './api';

const STORE_KEY = 'selected_store_type';

interface StoreContextType {
  storeType: StoreType;
  setStoreType: (type: StoreType) => Promise<void>;

  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  // The product just added via addToCart — lets the mini-cart bar show
  // "X added" for the specific item that triggered it, not just a count.
  lastAddedProductId: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  incrementCart: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

function unwrap<T>(res: any): T[] {
  return Array.isArray(res) ? res : (res?.data ?? []);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [storeType, setStoreTypeState] = useState<StoreType>(StoreType.ORGANIC);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);

  useEffect(() => { loadStoreType(); fetchCart(); }, []);

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

  const updateCartItem = useCallback(async (itemId: string, quantity: number) => {
    await customerApi.updateCartItem(itemId, quantity);
    await fetchCart();
  }, [fetchCart]);

  const removeCartItem = useCallback(async (itemId: string) => {
    await customerApi.removeCartItem(itemId);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await customerApi.clearCart();
    setCartItems([]);
  }, []);

  // Optimistic bump for the inline "+" quick-add on product cards — a real fetchCart
  // follow-up (via addToCart) reconciles the true count shortly after.
  const incrementCart = useCallback(() => {
    setCartItems((prev) => [...prev, { id: `optimistic-${Date.now()}` } as CartItem]);
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
