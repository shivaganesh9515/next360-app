import React, { createContext, useContext, useRef, useMemo, useCallback } from 'react';
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface ScrollNavContextType {
  // 0 = tab bar shown, 1 = hidden. Shared across every screen that opts in via
  // useScrollNav().handleScroll, so scrolling any tab's list hides/reveals the
  // same floating nav — same Zepto/Blinkit behaviour: scroll down hides the
  // pill nav and drops the mini cart bar into its place; scroll up (or landing
  // back near the top) brings it back.
  hideAnim: Animated.Value;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ScrollNavContext = createContext<ScrollNavContextType | undefined>(undefined);

// Ignores sub-8px jitter (momentum/bounce) so the bar doesn't flicker on tiny
// scroll adjustments; always shown within 24px of the top regardless of
// direction, so it never hides while the user is still basically at the top.
const HIDE_THRESHOLD = 8;
const TOP_SNAP_ZONE = 24;

export function ScrollNavProvider({ children }: { children: React.ReactNode }) {
  const hideAnim = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);
  const isHidden = useRef(false);

  const setHidden = useCallback((hidden: boolean) => {
    if (isHidden.current === hidden) return;
    isHidden.current = hidden;
    Animated.spring(hideAnim, {
      toValue: hidden ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 80,
    }).start();
  }, [hideAnim]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastOffset.current;

    if (y <= TOP_SNAP_ZONE) {
      setHidden(false);
    } else if (delta > HIDE_THRESHOLD) {
      setHidden(true);
    } else if (delta < -HIDE_THRESHOLD) {
      setHidden(false);
    }
    lastOffset.current = y;
  }, [setHidden]);

  const value = useMemo(() => ({ hideAnim, handleScroll }), [hideAnim, handleScroll]);

  return <ScrollNavContext.Provider value={value}>{children}</ScrollNavContext.Provider>;
}

export function useScrollNav() {
  const ctx = useContext(ScrollNavContext);
  if (!ctx) throw new Error('useScrollNav must be used within ScrollNavProvider');
  return ctx;
}
