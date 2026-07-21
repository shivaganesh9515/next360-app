import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { SpringConfig } from '../constants/theme';

/**
 * Staggered entrance — each card fades and slides up with increasing delay.
 * Pass the index of the item in a list. Returns an Animated.Value (0→1).
 */
export function useStaggeredEntrance(index = 0, baseDelay = 80) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      delay: Math.min(index, 10) * baseDelay,
      useNativeDriver: true,
    }).start();
  }, [index]);
  return anim;
}

/**
 * Basic fade + translateY spring entrance.
 */
export function useSpringEntrance(delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      ...SpringConfig.gentle,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay]);
  return anim;
}

/**
 * Breathing pulse loop — bounces between 0.4 and 1 opacity.
 */
export function usePulse(active = true) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) { anim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active]);
  return anim;
}

/**
 * Scale pulse — springs to 1.2 then back to 1. Triggers on every dependency change.
 */
export function useScalePulse(deps: any[] = []) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.2, friction: 5, tension: 300, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }),
    ]).start();
  }, deps);
  return anim;
}

/**
 * Image shimmer effect — a moving gradient overlay.
 */
export function useShimmer(width: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return {
    anim,
    translateX: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    }),
  };
}

/**
 * Animated counter — ramps from 0 to target.
 * Calls onTick with the interpolated value each frame.
 */
export function useAnimatedCounter(
  target: number,
  duration = 1200,
): number {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start();
    const listener = anim.addListener(({ value }) => setDisplayed(Math.round(value)));
    return () => anim.removeListener(listener);
  }, [target]);

  return displayed;
}


