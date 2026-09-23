'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Re-run the fetcher. Safe to pass straight to a Retry button. */
  retry: () => void;
}

/**
 * Data-fetch hook that distinguishes "no data" from "fetch failed".
 *
 * Replaces the previous `.catch(() => {})` pattern which rendered the empty
 * state for errors, making an outage look like an empty dataset (Bug 4 in the
 * partner audit: after an empty page, other pages showed no data too — they
 * were actually failing and silently rendering empty states).
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  // Keep the latest fetcher without making it a dependency of the effect.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);

  return { data, loading, error, retry };
}
