import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useDeliveryStore } from '../../store/deliveryStore';
import { formatDeliveryFee } from '../../lib/pricing';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../../constants/theme';
import { useStaggeredEntrance, useSpringEntrance, usePulse } from '../../hooks/useDeliveryAnimation';
import EmptyState from '../../components/EmptyState';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const {
    isAvailable, setAvailability,
    newOrders, activeDeliveries,
    fetchNewOrders, fetchActiveDeliveries, isLoading,
  } = useDeliveryStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  const headerAnim = useSpringEntrance(0);
  const availAnim = useSpringEntrance(100);
  const statsAnim = useSpringEntrance(200);
  const pulseAnim = usePulse(isAvailable);

  useEffect(() => {
    fetchNewOrders();
    fetchActiveDeliveries();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNewOrders(), fetchActiveDeliveries()]);
    setRefreshing(false);
  };

  const toggleAvailability = async () => {
    try {
      await setAvailability(!isAvailable);
    } catch {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.lg }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — animated entrance */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Partner'}</Text>
              <Text style={styles.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Availability Toggle */}
        <Animated.View style={{ opacity: availAnim, transform: [{ translateY: availAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <TouchableOpacity
            style={[styles.availCard, isAvailable ? styles.availOnline : styles.availOffline]}
            onPress={toggleAvailability}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="switch"
            accessibilityState={{ checked: isAvailable, disabled: isLoading }}
            accessibilityLabel="Availability for delivery orders"
            accessibilityHint={isAvailable ? 'Activates to go offline' : 'Activates to go online and receive orders'}
          >
            <View style={styles.availRow}>
              <View style={styles.availDotWrap}>
                <Animated.View style={[styles.availDot, isAvailable ? styles.onlineDot : styles.offlineDot, { opacity: pulseAnim }]} />
                <View style={[styles.availDotStatic, isAvailable ? styles.onlineDot : styles.offlineDot]} />
              </View>
              <View style={styles.availTextWrap}>
                <Text style={[styles.availTitle, isAvailable ? styles.availTitleOnline : styles.availTitleOffline]}>
                  {isAvailable ? 'You are Online' : 'You are Offline'}
                </Text>
                <Text style={styles.availHint}>
                  {isAvailable ? 'Tap to go offline' : 'Tap to receive orders'}
                </Text>
              </View>
              <View style={[styles.availToggle, isAvailable ? styles.toggleOnline : styles.toggleOffline]}>
                <Ionicons
                  name={isAvailable ? 'power' : 'power-outline'}
                  size={18}
                  color={isAvailable ? Colors.white : Colors.textSecondary}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View style={{ opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statNumber}>{newOrders.length}</Text>
              <Text style={styles.statLabel}>New Orders</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.warningLight }]}>
                <Ionicons name="bicycle-outline" size={20} color={Colors.warning} />
              </View>
              <Text style={styles.statNumber}>{activeDeliveries.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statNumber}>{user?.completedDeliveries || 0}</Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
          </View>
        </Animated.View>

        {/* New Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Requests</Text>
          {newOrders.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/new-orders')}>
              <Text style={styles.seeAll}>See All ({newOrders.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {newOrders.length === 0 ? (
          <EmptyState
            icon="time-outline"
            iconColor={Colors.textTertiary}
            title="No new orders"
            subtitle="Stay online to receive delivery requests"
          />
        ) : (
          newOrders.slice(0, 3).map((order, i) => (
            <OrderCard key={order.id} order={order} type="new" index={i} />
          ))
        )}

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg, marginBottom: Spacing.md }]}>
              Active Deliveries
            </Text>
            {activeDeliveries.map((order, i) => (
              <OrderCard key={order.id} order={order} type="active" index={i} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, type, index = 0 }: { order: any; type: 'new' | 'active'; index?: number }) {
  const { acceptOrder, rejectOrder } = useDeliveryStore();
  const [isProcessing, setIsProcessing] = React.useState(false);
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
    Alert.alert('Reject Order', 'Are you sure you want to reject this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try { await rejectOrder(order.id); } catch { Alert.alert('Error', 'Failed to reject order'); }
          finally { setIsProcessing(false); }
        },
      },
    ]);
  };

  return (
    <Animated.View
      style={[styles.orderCard, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={styles.orderBadge}>
            <Text style={styles.orderBadgeText}>{type === 'new' ? 'NEW' : 'ACTIVE'}</Text>
          </View>
        </View>
        <Text style={styles.orderTime}>
          {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.locationChain}>
        <View style={styles.locationRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {order.vendorGroups?.[0]?.vendor?.name || 'Pickup location'}
          </Text>
        </View>
        <View style={styles.locLine} />
        <View style={styles.locationRow}>
          <View style={[styles.locDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {order.address?.street || 'Delivery location'}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Earning</Text>
          <Text style={styles.amountValue}>{formatDeliveryFee(order.deliveryFee)}</Text>
        </View>
        {type === 'new' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} disabled={isProcessing} activeOpacity={0.7}>
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} disabled={isProcessing} activeOpacity={0.85}>
              {isProcessing ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={styles.acceptText}>Accept</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/delivery/${order.id}`)} activeOpacity={0.7}>
            <Text style={styles.viewText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // paddingTop is overridden inline with useSafeAreaInsets() — see render() — to clear
  // the status bar/notch since this tab renders with headerShown: false.
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xxl },
  headerLeft: {},
  greeting: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  date: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.md },
  avatarText: { fontSize: 20, fontWeight: '600', color: Colors.white },
  // Availability
  availCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
  availOnline: { backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primary },
  availOffline: { backgroundColor: Colors.dangerLight, borderWidth: 1.5, borderColor: Colors.danger },
  availRow: { flexDirection: 'row', alignItems: 'center' },
  availDotWrap: { width: 16, height: 16, marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  availDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  availDotStatic: { width: 12, height: 12, borderRadius: 6 },
  onlineDot: { backgroundColor: Colors.primary },
  offlineDot: { backgroundColor: Colors.danger },
  availTextWrap: { flex: 1 },
  availTitle: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  availTitleOnline: { color: Colors.primaryDark },
  availTitleOffline: { color: Colors.danger },
  availHint: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  availToggle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  toggleOnline: { backgroundColor: Colors.primary },
  toggleOffline: { backgroundColor: Colors.borderLight },
  // Stats
  statsRow: { flexDirection: 'row', marginBottom: Spacing.xxl, gap: 10 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', ...Shadow.sm },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  // Order Card
  orderCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  orderBadge: { backgroundColor: Colors.warningLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  orderBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.warning, letterSpacing: 0.5 },
  orderTime: { fontSize: 13, color: Colors.textTertiary },
  // Location chain
  locationChain: { marginBottom: Spacing.md, paddingLeft: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  locLine: { width: 2, height: 18, backgroundColor: Colors.border, marginLeft: 4, marginVertical: 4 },
  locationText: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  // Footer
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  amountBox: {},
  amountLabel: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  amountValue: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  rejectBtn: { backgroundColor: Colors.dangerLight, paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.md },
  rejectText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
  acceptBtn: { backgroundColor: Colors.primary, paddingHorizontal: 22, paddingVertical: 10, borderRadius: BorderRadius.md, minWidth: 80, alignItems: 'center' },
  acceptText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
});
