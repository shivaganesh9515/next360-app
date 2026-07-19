import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDeliveryStore } from '../store/deliveryStore';
import { formatDeliveryFee } from '../lib/pricing';

const COUNTDOWN_SECONDS = 30;

// Full-screen modal for a single incoming assignment, per the CLAUDE.md spec
// ("full-screen modal, 30-second countdown, Accept/Reject"). Only interrupts
// an online partner — an offline partner's newOrders queue (if any, e.g. in
// demo data) should never pop this. Auto-rejects on timeout so a courier who
// doesn't respond doesn't block the order indefinitely.
export function IncomingAssignmentModal() {
  const { newOrders, isAvailable, acceptOrder, rejectOrder } = useDeliveryStore();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isProcessing, setIsProcessing] = useState(false);
  const shownOrderId = useRef<string | null>(null);

  const currentOrder = isAvailable && newOrders.length > 0 ? newOrders[0] : null;
  const visible = !!currentOrder;

  useEffect(() => {
    if (!currentOrder) {
      shownOrderId.current = null;
      return;
    }
    // Reset the countdown whenever a *new* order becomes the current one.
    if (shownOrderId.current !== currentOrder.id) {
      shownOrderId.current = currentOrder.id;
      setSecondsLeft(COUNTDOWN_SECONDS);
    }
  }, [currentOrder?.id]);

  useEffect(() => {
    if (!visible || isProcessing) return;
    if (secondsLeft <= 0) {
      handleReject(true);
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [visible, secondsLeft, isProcessing]);

  const handleAccept = async () => {
    if (!currentOrder) return;
    setIsProcessing(true);
    try {
      await acceptOrder(currentOrder.id);
      router.push(`/delivery/${currentOrder.id}`);
    } catch {
      // acceptOrder already logs; leaving the modal up lets the courier retry
      // or let the countdown expire and auto-reject instead.
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (auto = false) => {
    if (!currentOrder) return;
    setIsProcessing(true);
    try {
      await rejectOrder(currentOrder.id);
    } catch {
      // swallow — order will be re-offered on next fetch/realtime push
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentOrder) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.countdownRing}>
          <Text style={styles.countdownNumber}>{secondsLeft}</Text>
          <Text style={styles.countdownLabel}>seconds</Text>
        </View>

        <Text style={styles.title}>New Delivery Request</Text>
        <Text style={styles.orderNumber}>#{currentOrder.orderNumber}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>PICKUP</Text>
              <Text style={styles.rowValue} numberOfLines={2}>
                {currentOrder.vendorGroups?.[0]?.vendor?.name || 'Vendor location'}
              </Text>
            </View>
          </View>
          <View style={styles.line} />
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>DROP</Text>
              <Text style={styles.rowValue} numberOfLines={2}>
                {currentOrder.address?.street || 'Customer location'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.earningRow}>
          <Ionicons name="cash-outline" size={20} color="#10B981" />
          <Text style={styles.earningText}>{formatDeliveryFee(currentOrder.deliveryFee)}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleReject(false)}
            disabled={isProcessing}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptText}>Accept</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 64,
    alignItems: 'center',
  },
  countdownRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  countdownLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderNumber: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 15,
    color: '#1F2937',
    marginTop: 2,
  },
  line: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 6,
  },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  earningText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    marginRight: 12,
  },
  rejectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
