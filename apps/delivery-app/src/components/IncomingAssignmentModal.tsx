import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDeliveryStore } from '../store/deliveryStore';
import { formatDeliveryFee } from '../lib/pricing';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';

const COUNTDOWN_SECONDS = 30;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export function IncomingAssignmentModal() {
  const { newOrders, isAvailable, acceptOrder, rejectOrder } = useDeliveryStore();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const shownOrderId = useRef<string | null>(null);
  // Guard against the auto-reject loop: when the countdown hits 0 for an order
  // but the reject call fails, we must NOT retry in a tight 0-second loop that
  // hammers the API. Only one auto-reject attempt per order; on failure we
  // surface the error and leave the modal open for a manual choice.
  const autoRejectAttempted = useRef<string | null>(null);
  const interactionLocked = useRef(false);

  // Spring scale for countdown ring urgency pulse
  const ringScale = useRef(new Animated.Value(1)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  const currentOrder = isAvailable && newOrders.length > 0 ? newOrders[0] : null;
  const visible = !!currentOrder;

  useEffect(() => {
    if (!currentOrder) { shownOrderId.current = null; return; }
    if (shownOrderId.current !== currentOrder.id) {
      shownOrderId.current = currentOrder.id;
      setSecondsLeft(COUNTDOWN_SECONDS);
      // Reset entrance animation for new order
      cardFade.setValue(0);
      Animated.spring(cardFade, { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }).start();
    }
  }, [currentOrder?.id]);

  // Countdown with urgency pulse
  useEffect(() => {
    if (!visible || isProcessing) return;
    if (secondsLeft <= 0) {
      if (autoRejectAttempted.current !== currentOrder.id) {
        autoRejectAttempted.current = currentOrder.id;
        handleReject(true);
      }
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    // Scale pulse at 10 seconds
    if (secondsLeft <= 10) {
      Animated.sequence([
        Animated.spring(ringScale, { toValue: 1.08, friction: 6, tension: 200, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }),
      ]).start();
    }
    return () => clearTimeout(timer);
  }, [visible, secondsLeft, isProcessing]);

  const handleAccept = async () => {
    if (!currentOrder) return;
    if (interactionLocked.current) return;
    interactionLocked.current = true;
    setIsProcessing(true);
    try {
      await acceptOrder(currentOrder.id);
      router.push(`/delivery/${currentOrder.id}`);
    } catch (err) {
      // leave modal open for retry
      Alert.alert('Could not accept', errorMessage(err));
      interactionLocked.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (auto = false) => {
    if (!currentOrder) return;
    if (interactionLocked.current) return;
    interactionLocked.current = true;
    setIsProcessing(true);
    try {
      await rejectOrder(currentOrder.id);
      interactionLocked.current = false;
    } catch (err) {
      // Swallow on the manual path (store already surfaced) — but for the
      // auto path, surface the failure so the partner knows the order was NOT
      // declined and no silent auto-retry will fire (guarded above).
      interactionLocked.current = false;
      if (auto) {
        Alert.alert('Decline failed', errorMessage(err));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentOrder) return null;

  const isUrgent = secondsLeft <= 10;
  const ringBorderColor = isUrgent ? Colors.danger : Colors.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <Animated.View style={{ opacity: cardFade, transform: [{ translateY: cardFade.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          {/* Countdown Ring */}
          <Animated.View style={[styles.countdownRing, { borderColor: ringBorderColor, transform: [{ scale: ringScale }] }]}>
            <Text style={[styles.countdownNumber, { color: ringBorderColor }]}>{secondsLeft}</Text>
            <Text style={styles.countdownLabel}>seconds</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.title}>New Delivery Request</Text>
          <Text style={styles.orderNumber}>#{currentOrder.orderNumber}</Text>

          {/* Location Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>PICKUP</Text>
                <Text style={styles.rowValue} numberOfLines={2}>
                  {currentOrder.vendorGroups?.[0]?.vendor?.name || 'Vendor location'}
                </Text>
              </View>
            </View>
            <View style={styles.line} />
            <View style={styles.locationRow}>
              <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>DROP</Text>
                <Text style={styles.rowValue} numberOfLines={2}>
                  {currentOrder.address?.street || 'Customer location'}
                </Text>
              </View>
            </View>
          </View>

          {/* Earnings */}
          <View style={styles.earningRow}>
            <View style={styles.earningIconWrap}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.earningText}>{formatDeliveryFee(currentOrder.deliveryFee)}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleReject(false)}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAccept}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.acceptText}>Accept</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xxl, justifyContent: 'center' },
  countdownRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 4, borderColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: Spacing.xxl,
  },
  countdownNumber: { fontSize: 34, fontWeight: '700', color: Colors.primary },
  countdownLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: -2 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  orderNumber: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', marginTop: 4, marginBottom: Spacing.xxl },
  locationCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xxl, marginBottom: Spacing.xl, ...Shadow.md,
  },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 14 },
  line: { width: 2, height: 24, backgroundColor: Colors.border, marginLeft: 5, marginVertical: 6 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8 },
  rowValue: { fontSize: 15, color: Colors.textPrimary, marginTop: 2 },
  earningRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xxxl, gap: 8,
  },
  earningIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  earningText: { fontSize: 26, fontWeight: '700', color: Colors.primary },
  actions: { flexDirection: 'row', gap: 12 },
  rejectBtn: {
    flex: 1, paddingVertical: 18, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dangerLight, alignItems: 'center',
  },
  rejectText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
  acceptBtn: {
    flex: 1, paddingVertical: 18, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  acceptText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
