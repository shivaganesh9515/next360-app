import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDeliveryStore } from '../../store/deliveryStore';

export default function NewOrdersScreen() {
  const { newOrders, fetchNewOrders, isLoading } = useDeliveryStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNewOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNewOrders();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;

  const renderOrder = ({ item: order }: { item: any }) => (
    <OrderCard order={order} />
  );

  if (isLoading && newOrders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading new orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={newOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No New Orders</Text>
            <Text style={styles.emptySubtitle}>
              When customers place orders, you'll see delivery requests here
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchNewOrders}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

function OrderCard({ order }: { order: any }) {
  const { acceptOrder, rejectOrder } = useDeliveryStore();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;
  const timeAgo = (date: string) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderTime}>{timeAgo(order.createdAt)}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEW</Text>
        </View>
      </View>

      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {order.vendorGroups?.[0]?.vendor?.name || 'Vendor location'}
            </Text>
          </View>
        </View>
        <View style={styles.locationLine} />
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>DROP</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {order.address?.street || 'Customer location'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.earnings}>
          <Text style={styles.earningsLabel}>Your Earning</Text>
          <Text style={styles.earningsAmount}>{formatCurrency(order.deliveryFee || 15000)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={handleReject}
            disabled={isProcessing}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  refreshButton: {
    marginTop: 24,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  orderTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  locationSection: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 4,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  earnings: {},
  earningsLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
