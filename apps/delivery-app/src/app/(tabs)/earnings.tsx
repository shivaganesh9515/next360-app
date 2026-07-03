import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryStore } from '../../store/deliveryStore';

export default function EarningsScreen() {
  const { earnings, fetchEarnings, isLoading } = useDeliveryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');

  useEffect(() => {
    fetchEarnings(period);
  }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings(period);
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
    >
      {/* Earnings Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>
          {formatCurrency(earnings?.allTime || 0)}
        </Text>
        <Text style={styles.summarySubtext}>
          {earnings?.totalDeliveries || 0} deliveries completed
        </Text>
      </View>

      {/* Period Filter */}
      <View style={styles.periodContainer}>
        {([
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'all', label: 'All Time' },
        ] as const).map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodTab, period === p.key && styles.periodTabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Earnings Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.breakdownLabel}>Today</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(earnings?.today || 0)}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.breakdownLabel}>This Week</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(earnings?.thisWeek || 0)}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.breakdownLabel}>This Month</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(earnings?.thisMonth || 0)}</Text>
        </View>

        <View style={[styles.breakdownRow, styles.breakdownRowTotal]}>
          <View style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.breakdownLabel, styles.breakdownLabelTotal]}>All Time</Text>
          </View>
          <Text style={[styles.breakdownValue, styles.breakdownValueTotal]}>
            {formatCurrency(earnings?.allTime || 0)}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="bicycle-outline" size={32} color="#10B981" />
          <Text style={styles.statValue}>{earnings?.totalDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Total Deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={32} color="#3B82F6" />
          <Text style={styles.statValue}>
            {earnings?.totalDeliveries
              ? formatCurrency(Math.round((earnings?.allTime || 0) / earnings.totalDeliveries))
              : '₹0'}
          </Text>
          <Text style={styles.statLabel}>Avg per Delivery</Text>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        <Text style={styles.infoText}>
          Earnings are calculated after each successful delivery. Payments are processed weekly to your registered bank account.
        </Text>
      </View>
    </ScrollView>
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
  summaryCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  periodContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: '#10B981',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  breakdownRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  breakdownLabelTotal: {
    fontWeight: '600',
    color: '#1F2937',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  breakdownValueTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    lineHeight: 18,
  },
});
