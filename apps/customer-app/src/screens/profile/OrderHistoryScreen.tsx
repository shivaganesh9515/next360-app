import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Animated,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../lib/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import ErrorState from '../../components/ErrorState';

const STATUS_COLORS: Record<string, string> = {
  PLACED: '#6B7280',
  CONFIRMED: '#3B82F6',
  PACKED: '#F59E0B',
  ASSIGNED_TO_DELIVERY: '#8B5CF6',
  PICKED_UP: '#8B5CF6',
  OUT_FOR_DELIVERY: '#8B5CF6',
  DELIVERED: '#10B981',
  CANCELLED: '#EF4444',
};

// Extract card into its own component so hooks are at top level (not inside renderItem)
function OrderCard({ order, index, navigation, t, formatCurrency, formatDate }: {
  order: any;
  index: number;
  navigation: any;
  t: any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}) {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      tension: 80,
      delay: Math.min(index, 5) * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }}
    >
      <TouchableOpacity
        style={[styles.orderCard, Shadows.card]}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] || Colors.textSecondary }]}>
            <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderItems}>{t('orderHistory.items', { count: order.items?.length || 0 })}</Text>
          <Text style={styles.orderTotal}>{formatCurrency(order.totalAmount)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function OrderHistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await customerApi.getOrders();
      setOrders(res?.data || res || []);
      setError(false);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const formatCurrency = (amount: number) => `₹${Number(amount || 0).toFixed(0)}`;

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.organic} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
        <Text style={styles.headerTitle}>{t('orderHistory.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <ErrorState message={t('orderHistory.error.load')} onRetry={loadOrders} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>{t('orderHistory.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('orderHistory.empty.subtitle')}</Text>
          <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopButtonText}>{t('orderHistory.empty.startShopping')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item: order, index }) => (
            <OrderCard
              order={order}
              index={index}
              navigation={navigation}
              t={t}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.organic]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  shopButton: {
    backgroundColor: Colors.organic,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xl,
  },
  shopButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  listContent: {
    padding: Spacing.lg,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  orderDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  orderStatus: {
    marginBottom: Spacing.md,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    ...Typography.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  orderItems: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  orderTotal: {
    ...Typography.h3,
    color: Colors.organic,
  },
});
