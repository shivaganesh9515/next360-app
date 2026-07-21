import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useDeliveryStore } from '../../store/deliveryStore';
import { formatDeliveryFee } from '../../lib/pricing';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useStaggeredEntrance } from '../../hooks/useDeliveryAnimation';
import EmptyState from '../../components/EmptyState';

export default function NewOrdersScreen() {
  const { newOrders, fetchNewOrders, isLoading } = useDeliveryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new'>('all');

  useFocusEffect(
    useCallback(() => { fetchNewOrders(); }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNewOrders();
    setRefreshing(false);
  };

  const renderOrder = ({ item, index }: { item: any; index: number }) => (
    <OrderCard order={item} index={index} />
  );

  if (isLoading && newOrders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Bar */}
      {newOrders.length > 0 && (
        <View style={styles.summaryBar}>
          <Ionicons name="notifications" size={18} color={Colors.warning} />
          <Text style={styles.summaryText}>
            <Text style={styles.summaryCount}>{newOrders.length}</Text> delivery request{newOrders.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      )}

      <FlatList
        data={newOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            iconColor={Colors.textTertiary}
            title="No pending orders"
            subtitle="When customers place orders, you'll see delivery requests here"
            actionLabel="Refresh"
            actionIcon="refresh"
            onAction={fetchNewOrders}
          />
        }
      />
    </View>
  );
}

function OrderCard({ order, index = 0 }: { order: any; index?: number }) {
  const { acceptOrder, rejectOrder } = useDeliveryStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const cardAnim = useStaggeredEntrance(index);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptOrder(order.id);
      router.push(`/delivery/${order.id}`);
    } catch {
      Alert.alert('Error', 'Failed to accept order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    Alert.alert('Decline Order', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try { await rejectOrder(order.id); } catch { Alert.alert('Error', 'Failed to decline'); }
          finally { setIsProcessing(false); }
        },
      },
    ]);
  };

  const timeAgo = (date: string) => {
    const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  return (
    <Animated.View
      style={[styles.card, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        </View>
        <Text style={styles.timeAgo}>{timeAgo(order.createdAt)}</Text>
      </View>

      {/* Location chain */}
      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.primary }]} />
          <View style={styles.locInfo}>
            <Text style={styles.locLabel}>PICKUP</Text>
            <Text style={styles.locText} numberOfLines={1}>{order.vendorGroups?.[0]?.vendor?.name || 'Vendor location'}</Text>
          </View>
        </View>
        <View style={styles.locLine} />
        <View style={styles.locationRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.danger }]} />
          <View style={styles.locInfo}>
            <Text style={styles.locLabel}>DROP</Text>
            <Text style={styles.locText} numberOfLines={1}>{order.address?.street || 'Customer location'}</Text>
          </View>
        </View>
      </View>

      {/* Items preview */}
      {order.items && order.items.length > 0 && (
        <View style={styles.itemsPreview}>
          <Ionicons name="cube-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.itemsText}>{order.items.length} item{order.items.length > 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.earningBox}>
          <Text style={styles.earningLabel}>Your earning</Text>
          <Text style={styles.earningAmount}>{formatDeliveryFee(order.deliveryFee)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={isProcessing} activeOpacity={0.7}>
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={isProcessing} activeOpacity={0.85}>
            {isProcessing ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.acceptText}>Accept</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.md, fontSize: 15, color: Colors.textSecondary },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  // Summary bar
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md, paddingVertical: 10, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md, gap: 8,
  },
  summaryText: { fontSize: 14, color: Colors.textSecondary },
  summaryCount: { fontWeight: '700', color: Colors.warning },
  // Card
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNumber: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  badge: { backgroundColor: Colors.warningLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.warning, letterSpacing: 0.5 },
  timeAgo: { fontSize: 13, color: Colors.textTertiary },
  // Location
  locationSection: { marginBottom: Spacing.md },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  locLine: { width: 2, height: 20, backgroundColor: Colors.border, marginLeft: 4, marginVertical: 4 },
  locInfo: { flex: 1 },
  locLabel: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8 },
  locText: { fontSize: 14, color: Colors.textPrimary, marginTop: 2 },
  // Items
  itemsPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  itemsText: { fontSize: 13, color: Colors.textTertiary },
  // Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  earningBox: {},
  earningLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  earningAmount: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  rejectBtn: { backgroundColor: Colors.dangerLight, paddingHorizontal: 20, paddingVertical: 11, borderRadius: BorderRadius.md },
  rejectText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  acceptBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 11, borderRadius: BorderRadius.md, minWidth: 85, alignItems: 'center' },
  acceptText: { fontSize: 14, fontWeight: '600', color: Colors.white },
});
