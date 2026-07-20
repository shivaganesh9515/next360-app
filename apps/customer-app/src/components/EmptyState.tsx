import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  icon = 'leaf-outline',
  iconColor = Colors.textSecondary,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact,
}: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();

    // Subtle breathing pulse on the icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 0.85, duration: 1500, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Icon with pulse */}
      <Animated.View style={[styles.iconRing, { transform: [{ scale: iconPulse }] }]}>
        <View style={styles.iconBg}>
          <Ionicons name={icon} size={compact ? 28 : 40} color={iconColor} />
        </View>
      </Animated.View>

      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>

      {subtitle && (
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text>
      )}

      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, Shadows.button(Colors.organic)]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryAction}>
          <Text style={styles.secondaryText}>{secondaryActionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xxl,
  },
  containerCompact: {
    paddingVertical: Spacing.xxxl,
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.organicLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.organic,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  titleCompact: {
    ...Typography.h3,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  subtitleCompact: {
    ...Typography.bodySmall,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    backgroundColor: Colors.organic,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.pill,
  },
  actionText: {
    ...Typography.button,
    color: Colors.white,
  },
  secondaryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  secondaryText: {
    ...Typography.bodySmall,
    color: Colors.organic,
    fontFamily: 'Inter_600SemiBold',
  },
});
