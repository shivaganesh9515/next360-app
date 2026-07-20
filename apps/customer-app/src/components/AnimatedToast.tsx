import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated, Text, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, SPRING_CONFIG } from '../constants/theme';

export interface ToastConfig {
  message: string;
  type?: 'success' | 'error' | 'info';
  /**
   * Auto-dismiss in ms. 0 = no dismiss. Default 3000.
   */
  duration?: number;
}

interface Props {
  toast: ToastConfig | null;
  onDismiss: () => void;
}

// A slide-down toast bar that springs in from the top edge of the screen and
// auto-dismisses. Designed as a replacement for Alert.alert() in places where
// an inline confirmation is better UX than a modal dialog — "Copied!",
// "Added to cart", "Something went wrong", etc.
// Attach it once in a top-level layout file or screen wrapper.
export default function AnimatedToast({ toast, onDismiss }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.spring(anim, { toValue: 0, ...SPRING_CONFIG, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  }, [anim, onDismiss]);

  useEffect(() => {
    if (!toast) return;
    Animated.spring(anim, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }).start();

    const dur = toast.duration ?? 3000;
    if (dur > 0) {
      timerRef.current = setTimeout(dismiss, dur);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';
  const bgColor = isError ? Colors.error : isSuccess ? Colors.success : Colors.organic;
  const iconName = isError ? 'alert-circle' : isSuccess ? 'checkmark-circle' : 'information-circle';

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] });

  return (
    <Animated.View
      style={[s.wrapper, { transform: [{ translateY }], pointerEvents: 'box-none' }]}
    >
      <View style={[s.bar, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={18} color="#FFF" />
        <Text style={s.message} numberOfLines={2}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 60,  // ~status bar + safe area padding
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 9999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    ...Typography.bodySmall,
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
});
