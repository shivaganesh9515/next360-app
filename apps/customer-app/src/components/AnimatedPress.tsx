import React, { useRef } from 'react';
import { Animated, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';

interface Props {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  disabled?: boolean;
  activeOpacity?: number;
  hitSlop?: number;
}

// Single spring-based scale that animates on pressIn/pressOut — wraps any
// touchable with a subtle, responsive scale-down that makes every tap feel
// physically connected. Standardizes the house spring feel across the app.
// Uses Animated instead of Reanimated so it works as a simple inline
// wrapper without forcing consumers to install gesture handler or use
// animated component children — keeps the API as a direct TouchableOpacity
// replacement.
const SPRING_IN = { friction: 8, tension: 300, useNativeDriver: true };
const SPRING_OUT = { friction: 6, tension: 200, useNativeDriver: true };

export default function AnimatedPress({
  onPress, onPressIn, onPressOut,
  children, style, scaleTo = 0.96, disabled, activeOpacity = 0.85, hitSlop,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: scaleTo, ...SPRING_IN }).start();
    onPressIn?.();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, ...SPRING_OUT }).start();
    onPressOut?.();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={activeOpacity}
      disabled={disabled}
      hitSlop={hitSlop}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
