import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreType } from '../types';

const STORE_KEY = 'selected_store_type';

interface StoreContextType {
  storeType: StoreType;
  setStoreType: (type: StoreType) => Promise<void>;
  cartCount: number;
  setCartCount: (n: number) => void;
  incrementCart: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [storeType, setStoreTypeState] = useState<StoreType>(StoreType.ORGANIC);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => { loadStoreType(); }, []);

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

  const incrementCart = () => setCartCount(c => c + 1);

  return (
    <StoreContext.Provider value={{ storeType, setStoreType, cartCount, setCartCount, incrementCart }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
