import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDeliveryFee } from '../../lib/pricing';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const AUTO_RETURN_MS = 3000;

export default function DeliveryCompleteScreen() {
  const { earning } = useLocalSearchParams<{ earning?: string }>();
  const parsed = earning ? Number(earning) : NaN;
  // Honest state: only show a fee when the backend actually returned one.
  // Never fall back to a hardcoded number — a missing fee renders as pending.
  const hasEarning = Number.isFinite(parsed);

  // Celebration spring sequence
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, AUTO_RETURN_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Success Icon — springs in with bounce */}
      <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="checkmark" size={48} color={Colors.white} />
      </Animated.View>

      <Text style={styles.title}>Delivery Complete!</Text>
      <Text style={styles.subtitle}>Great job getting this order there safely.</Text>

      {/* Earnings Card — fades in after icon. Shown only when the real
          fee is known; otherwise the stats row below shows the pending state. */}
      {hasEarning && (
        <Animated.View
          style={[styles.earningCard, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
        >
          <View style={styles.earningRing}>
            <Ionicons name="cash" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.earningLabel}>You earned</Text>
          <Text style={styles.earningValue}>{formatDeliveryFee(parsed)}</Text>
        </Animated.View>
      )}

      {/* Stats Row */}
      <Animated.View style={[styles.statsRow, { opacity: cardAnim }]}>
        <View style={styles.statBox}>
          <Ionicons name="time-outline" size={18} color={Colors.textTertiary} />
          <Text style={styles.statLabel}>Started</Text>
          <Text style={styles.statValue}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Ionicons name="trending-up-outline" size={18} color={Colors.primary} />
          <Text style={styles.statLabel}>Delivery Fee</Text>
          <Text style={styles.statValue}>{hasEarning ? formatDeliveryFee(parsed) : 'Pending'}</Text>
        </View>
      </Animated.View>

      {/* Button */}
      <Animated.View style={{ opacity: buttonAnim, transform: [{ translateY: buttonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={18} color={Colors.white} />
          <Text style={styles.doneText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Auto-return hint */}
      <Text style={styles.autoHint}>Returning to dashboard automatically...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xxl, ...Shadow.lg,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  earningCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.xxxl,
    alignItems: 'center', marginTop: Spacing.xxxl, ...Shadow.md,
    width: '100%', maxWidth: 240,
  },
  earningRing: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  earningLabel: { fontSize: 13, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  earningValue: { fontSize: 32, fontWeight: '700', color: Colors.primary, marginTop: Spacing.xs },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    marginTop: Spacing.lg, width: '100%', maxWidth: 280, ...Shadow.sm,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  statLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600' },
  statValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  doneButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, paddingVertical: 15, paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.lg, marginTop: Spacing.xxxl, gap: 8, ...Shadow.md,
  },
  doneText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  autoHint: { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.lg },
});
