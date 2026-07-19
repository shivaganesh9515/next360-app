'use client';

import { useEffect, useState } from 'react';

/**
 * Hook that returns true once an element enters the viewport.
 * Respects prefers-reduced-motion — if the user prefers reduced motion,
 * isVisible is set to true immediately without animation.
 */
export function useScrollReveal(
  ref: React.RefObject<HTMLElement | null>,
  options: { threshold?: number; rootMargin?: string } = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    /* If user prefers reduced motion, skip animation entirely */
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: options.threshold ?? 0.15,
        rootMargin: options.rootMargin ?? '0px 0px -50px 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, prefersReduced, options.threshold, options.rootMargin]);

  return isVisible;
}
