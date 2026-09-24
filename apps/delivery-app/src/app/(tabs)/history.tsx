import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useDeliveryStore } from '../../store/deliveryStore';
import { formatDeliveryFee, sumDeliveryFees } from '../../lib/pricing';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useSpringEntrance } from '../../hooks/useDeliveryAnimation';
import EmptyState from '../../components/EmptyState';

const FILTERS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
] as const;

export default function HistoryScreen() {
  const { deliveryHistory, fetchDeliveryHistory, isLoading } = useDeliveryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const statsAnim = useSpringEntrance(0);

  useEffect(() => {
    fetchDeliveryHistory({ period: filter });
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveryHistory({ period: filter });
    setRefreshing(false);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <HistoryCard order={item} index={index} />
  );

  const totalEarned = sumDeliveryFees(deliveryHistory.map((o) => o.deliveryFee));

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Summary */}
      <Animated.View style={[styles.statsCard, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          </Text>
          <Text style={styles.statNumber}>{deliveryHistory.length}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalEarned}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
      </Animated.View>

      <FlatList
        data={deliveryHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            iconColor={Colors.textTertiary}
            title="No history yet"
            subtitle="Your completed deliveries will appear here"
          />
        }
      />
    </View>
  );
}

function HistoryCard({ order, index = 0 }: { order: any; index?: number }) {
  const animValue = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animValue, { toValue: 1, duration: 350, delay: Math.min(index, 10) * 60, useNativeDriver: true }).start();
  }, [index]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Animated.View style={[styles.card, { opacity: animValue, transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
          <Text style={styles.statusText}>Delivered</Text>
        </View>
      </View>

      <View style={styles.locationChain}>
        <View style={styles.locRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.locText} numberOfLines={1}>{order.vendor?.storeName || order.vendorGroups?.[0]?.vendor?.name || 'Vendor'}</Text>
        </View>
        <View style={styles.locLine} />
        <View style={styles.locRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.locText} numberOfLines={1}>{order.address?.city || 'Customer'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.earningBox}>
          <Text style={styles.earningLabel}>Earned</Text>
          <Text style={styles.earningAmount}>{formatDeliveryFee(order.deliveryFee)}</Text>
        </View>
        <TouchableOpacity style={styles.detailBtn} onPress={() => router.push(`/delivery/${order.id}`)} activeOpacity={0.7}>
          <Text style={styles.detailText}>View</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Filters
  filterRow: { flexDirection: 'row', padding: Spacing.lg, paddingBottom: 0, gap: 8 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.white },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  // Stats
  statsCard: { flexDirection: 'row', backgroundColor: Colors.white, margin: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIcon: { marginBottom: 4 },
  statNumber: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.textTertiary },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  // List
  listContent: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 100 },
  // Card
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  orderNumber: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  orderDate: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '500', color: Colors.primaryDark },
  // Location
  locationChain: { marginBottom: Spacing.md, paddingLeft: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center' },
  locDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  locLine: { width: 2, height: 14, backgroundColor: Colors.border, marginLeft: 3, marginVertical: 4 },
  locText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  // Footer
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  earningBox: {},
  earningLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  earningAmount: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  detailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
