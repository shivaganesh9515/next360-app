'use client';

import { useState, useCallback } from 'react';

const MAX_RECENT = 5;

export function useRecentSearches(key: string) {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(`recent_search_${key}`) || '[]');
    } catch {
      return [];
    }
  });

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const next = [query, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(`recent_search_${key}`, JSON.stringify(next));
      return next;
    });
  }, [key]);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(`recent_search_${key}`);
  }, [key]);

  return { recentSearches, addSearch, clearSearches };
}
