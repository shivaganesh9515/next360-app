import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

const STAGGER_MS = 40;
// Caps how far the delay grows for later items — past this, a long list would
// otherwise take visibly longer to finish appearing than it's worth; items
// past the cap just fade in together at the capped delay.
const MAX_STAGGER_INDEX = 8;

interface Props {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Wraps a grid/list item so it fades up into place with a small per-index
// delay on first mount, instead of every item popping in at once — makes a
// freshly-loaded grid read as considered rather than instant.
export default function StaggerFadeIn({ index, children, style }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS;
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
