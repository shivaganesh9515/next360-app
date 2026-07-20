import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { useShimmer } from '../hooks/useDeliveryAnimation';

const SCREEN_WIDTH = Dimensions.get('window').width;

function ShimmerBlock({ width, height, borderRadius = BorderRadius.sm, style }: { width: number | string; height: number; borderRadius?: number; style?: any }) {
  const resolvedWidth = typeof width === 'number' ? width : SCREEN_WIDTH * 0.7;
  const { translateX } = useShimmer(resolvedWidth);

  return (
    <View style={[{ width: width as any, height, borderRadius, backgroundColor: Colors.border, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.section}>
        <ShimmerBlock width={120} height={14} />
        <ShimmerBlock width={160} height={10} style={{ marginTop: 6 }} />
      </View>
      {/* Availability */}
      <View style={[s.card, { height: 72 }]} />
      {/* Stats */}
      <View style={s.row}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[s.statBox, { height: 90 }]} />
        ))}
      </View>
      {/* Orders */}
      <View style={[s.card, { height: 24 }]} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.orderCard, { height: 120 }]} />
      ))}
    </View>
  );
}

export function EarningsSkeleton() {
  return (
    <View style={s.container}>
      <View style={[s.card, { height: 160, backgroundColor: Colors.primaryLight }]} />
      <View style={s.row}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 36 }} />
        ))}
      </View>
      <View style={[s.card, { height: 200 }]} />
    </View>
  );
}

export function HistorySkeleton() {
  return (
    <View style={s.container}>
      <View style={[s.card, { height: 80 }]} />
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[s.orderCard, { height: 110 }]} />
      ))}
    </View>
  );
}

export function NewOrdersSkeleton() {
  return (
    <View style={s.container}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.orderCard, { height: 140 }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: Spacing.lg, flex: 1 },
  section: { marginBottom: Spacing.xl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.lg },
  row: { flexDirection: 'row', gap: 10, marginBottom: Spacing.xl },
  statBox: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  orderCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
});
