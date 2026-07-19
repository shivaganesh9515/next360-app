import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useDeliveryStore } from '../../store/deliveryStore';
import { formatDeliveryFee } from '../../lib/pricing';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const {
    isAvailable,
    setAvailability,
    newOrders,
    activeDeliveries,
    fetchNewOrders,
    fetchActiveDeliveries,
    isLoading,
  } = useDeliveryStore();

  const [refreshing, setRefreshing] = useState(false);

  // Entrance animations for each section — springs in staggered sequence.
  const headerAnim = useRef(new Animated.Value(0)).current;
  const availAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.spring(availAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
      Animated.spring(statsAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  // Pulse animation for the availability dot (breathing effect)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isAvailable) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isAvailable]);

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
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
    >
      {/* Header — springs into view */}
      <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'Partner'}!</Text>
            <Text style={styles.subtitle}>Ready to deliver?</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Online/Offline Toggle — springs in */}
      <Animated.View style={{ opacity: availAnim, transform: [{ translateY: availAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <TouchableOpacity
          style={[styles.availabilityCard, isAvailable ? styles.online : styles.offline]}
          onPress={toggleAvailability}
          disabled={isLoading}
        >
          <View style={styles.availabilityContent}>
            <Animated.View style={[styles.statusDot, isAvailable ? styles.dotOnline : styles.dotOffline, { opacity: pulseAnim }]} />
            <Text style={styles.availabilityText}>
              {isAvailable ? 'You are ONLINE' : 'You are OFFLINE'}
            </Text>
          </View>
          <Text style={styles.availabilityHint}>
            {isAvailable ? 'Tap to go offline' : 'Tap to go online'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Stats — springs in */}
      <Animated.View style={{ opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="notifications-outline" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{newOrders.length}</Text>
            <Text style={styles.statLabel}>New Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="bicycle-outline" size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>{activeDeliveries.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{user?.completedDeliveries || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </Animated.View>

      {/* New Orders Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Delivery Requests</Text>
          {newOrders.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/new-orders')}>
              <Text style={styles.seeAll}>See All ({newOrders.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {newOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No new orders right now</Text>
            <Text style={styles.emptySubtext}>Stay online to receive delivery requests</Text>
          </View>
        ) : (
          newOrders.slice(0, 3).map((order, i) => (
            <OrderCard key={order.id} order={order} type="new" index={i} />
          ))
        )}
      </View>

      {/* Active Deliveries Section */}
      {activeDeliveries.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Deliveries</Text>
          </View>

          {activeDeliveries.map((order, i) => (
            <OrderCard key={order.id} order={order} type="active" index={i} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function OrderCard({ order, type, index = 0 }: { order: any; type: 'new' | 'active'; index?: number }) {
  const { acceptOrder, rejectOrder } = useDeliveryStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Staggered entrance — each card fades up with increasing delay
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1, duration: 400, delay: Math.min(index, 8) * 80, useNativeDriver: true,
    }).start();
  }, []);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await acceptOrder(order.id);
      router.push(`/delivery/${order.id}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    Alert.alert('Reject Order', 'Are you sure you want to reject this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await rejectOrder(order.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to reject order');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  return (
    <Animated.View style={[styles.orderCard, { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
        <Text style={styles.orderTime}>
          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1}>
            {order.address?.street || 'Pickup location'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="navigate-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1}>
            {order.address?.city || 'Delivery location'}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderAmount}>{formatDeliveryFee(order.deliveryFee)}</Text>

        {type === 'new' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.acceptText}>Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push(`/delivery/${order.id}`)}
          >
            <Text style={styles.viewText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#10B981" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  availabilityCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  online: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  offline: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#EF4444',
  },
  availabilityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  availabilityHint: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  orderTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    marginRight: 4,
  },
});
