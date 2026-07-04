import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ZONE_KEY = 'next360:selectedZone';

interface ZoneContextType {
  city: string | null;
  locality: string | null;
  setZone: (city: string, locality?: string) => Promise<void>;
}

const ZoneContext = createContext<ZoneContextType | undefined>(undefined);

export function ZoneProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState<string | null>(null);
  const [locality, setLocality] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ZONE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setCity(parsed.city || null);
        setLocality(parsed.locality || null);
      } catch {
        // ignore corrupt value
      }
    });
  }, []);

  const setZone = useCallback(async (newCity: string, newLocality?: string) => {
    setCity(newCity);
    setLocality(newLocality || null);
    await AsyncStorage.setItem(ZONE_KEY, JSON.stringify({ city: newCity, locality: newLocality || null }));
  }, []);

  return (
    <ZoneContext.Provider value={{ city, locality, setZone }}>
      {children}
    </ZoneContext.Provider>
  );
}

export function useZone() {
  const ctx = useContext(ZoneContext);
  if (!ctx) throw new Error('useZone must be used within ZoneProvider');
  return ctx;
}
