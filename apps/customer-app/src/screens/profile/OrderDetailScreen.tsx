import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STEP_LABELS: Record<string, string> = {
  PLACED: 'Order Placed',
  CONFIRMED: 'Confirmed by Vendor',
  PACKED: 'Packed',
  ASSIGNED_TO_DELIVERY: 'Assigned for Delivery',
  PICKED_UP: 'Picked Up',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

function VendorGroupTimeline({ group }: { group: any }) {
  const isTerminalBad = group.status === 'CANCELLED' || group.status === 'REFUNDED';
  const currentIndex = STEPS.indexOf(group.status);

  return (
    <View style={[s.groupCard, Shadows.card]}>
      <View style={s.vendorRow}>
        <View style={s.vendorIconWrap}>
          <Ionicons name="storefront" size={16} color={Colors.organic} />
        </View>
        <Text style={s.vendorName}>{group.vendor?.storeName || 'Vendor'}</Text>
      </View>

      {isTerminalBad ? (
        <View style={s.badBanner}>
          <Ionicons name="close-circle" size={16} color={Colors.error} />
          <Text style={s.badBannerText}>
            {group.status === 'CANCELLED' ? 'This part of your order was cancelled' : 'This part of your order was refunded'}
          </Text>
        </View>
      ) : (
        <View style={s.timeline}>
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <View key={step} style={s.stepRow}>
                <View style={s.stepMarkerCol}>
                  <View style={[s.stepIconWrap, done && s.stepIconWrapDone, isCurrent && Shadows.button(Colors.organic)]}>
                    <Ionicons
                      name={done ? 'checkmark' : 'ellipse'}
                      size={done ? 12 : 6}
                      color={done ? Colors.white : Colors.border}
                    />
                  </View>
                  {i < STEPS.length - 1 && <View style={[s.stepLine, done && s.stepLineDone]} />}
                </View>
                <Text style={[s.stepLabel, done && s.stepLabelDone]}>{STEP_LABELS[step]}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={s.itemsList}>
        {(group.items || []).map((item: any) => (
          <View key={item.id} style={s.itemRow}>
            <Image
              source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/48' }}
              style={s.itemImage}
            />
            <Text style={s.itemName} numberOfLines={1}>{item.product?.name} × {item.quantity}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function OrderDetailScreen({ navigation, route }: any) {
  const { orderId } = route.params || {};
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res: any = await customerApi.getOrder(orderId);
      setOrder(res?.data || res);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.organic} /></View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><Text style={s.emptyText}>Order not found.</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {order.address && (
          <View style={[s.addressCard, Shadows.card]}>
            <Text style={s.sectionTitle}>Delivering to</Text>
            <Text style={s.addressText}>{order.address.fullAddress}</Text>
            <Text style={s.addressText}>{order.address.city}, {order.address.state} - {order.address.pincode}</Text>
          </View>
        )}

        {(order.vendorGroups || []).map((group: any) => (
          <VendorGroupTimeline key={group.id} group={group} />
        ))}

        <View style={[s.summaryCard, Shadows.card]}>
          <Text style={s.sectionTitle}>Payment</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Method</Text>
            <Text style={s.summaryValue}>{order.paymentMethod}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Status</Text>
            <Text style={s.summaryValue}>{order.paymentStatus}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>₹{Number(order.totalAmount).toFixed(0)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  sectionTitle: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: Spacing.sm },
  addressCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  addressText: { ...Typography.bodySmall, color: Colors.textSecondary },

  groupCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  vendorIconWrap: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
  },
  vendorName: { ...Typography.h3, color: Colors.text },

  badBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  badBannerText: { ...Typography.bodySmall, color: Colors.error, flex: 1 },

  timeline: { marginBottom: Spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepMarkerCol: { width: 24, alignItems: 'center' },
  stepIconWrap: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepIconWrapDone: { backgroundColor: Colors.organic, borderColor: Colors.organic },
  stepLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border },
  stepLineDone: { backgroundColor: Colors.organic },
  stepLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginLeft: Spacing.sm, marginBottom: Spacing.lg },
  stepLabelDone: { color: Colors.text, fontFamily: 'Inter_600SemiBold' },

  itemsList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemImage: { width: 32, height: 32, borderRadius: BorderRadius.sm, backgroundColor: Colors.border },
  itemName: { ...Typography.bodySmall, color: Colors.text, flex: 1 },

  summaryCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  summaryValue: { ...Typography.bodySmall, color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: 4 },
  totalLabel: { ...Typography.h3, color: Colors.text },
  totalValue: { ...Typography.h3, color: Colors.brass },
});
