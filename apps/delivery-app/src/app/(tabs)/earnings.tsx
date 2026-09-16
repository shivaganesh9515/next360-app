import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeliveryStore } from '../../store/deliveryStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useSpringEntrance } from '../../hooks/useDeliveryAnimation';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
] as const;

const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;

export default function EarningsScreen() {
  const { earnings, fetchEarnings, isLoading } = useDeliveryStore();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const summaryAnim = useSpringEntrance(0);

  useEffect(() => {
    fetchEarnings(period);
  }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarnings(period);
    setRefreshing(false);
  };

  // Hero reflects the selected tab — never a hardcoded period.
  const heroByPeriod = {
    today: { label: "Today's Earnings", value: earnings?.today ?? 0 },
    week: { label: "This Week's Earnings", value: earnings?.thisWeek ?? 0 },
    month: { label: "This Month's Earnings", value: earnings?.thisMonth ?? 0 },
    all: { label: 'Total Earnings', value: earnings?.allTime ?? 0 },
  } as const;
  const hero = heroByPeriod[period];

  const avgPerDelivery = earnings?.totalDeliveries
    ? Math.round((earnings?.allTime || 0) / earnings.totalDeliveries)
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Hero */}
      <Animated.View style={[styles.summaryCard, { opacity: summaryAnim, transform: [{ scale: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
        <View style={styles.summaryGlow} />
        <Text style={styles.summaryLabel}>{hero.label}</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(hero.value)}</Text>
        <Text style={styles.summarySubtext}>{earnings?.totalDeliveries || 0} deliveries completed</Text>
        <View style={styles.summaryTrend}>
          <Ionicons name="trending-up" size={16} color={Colors.white} />
          <Text style={styles.summaryTrendText}>
            Avg {formatCurrency(avgPerDelivery)} per delivery
          </Text>
        </View>
      </Animated.View>

      {/* Period Filter */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodTab, period === p.key && styles.periodTabActive]}
            onPress={() => setPeriod(p.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Earnings Breakdown</Text>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <View style={[styles.breakdownDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.breakdownLabel}>Today</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(earnings?.today || 0)}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <View style={[styles.breakdownDot, { backgroundColor: Colors.blue }]} />
            <Text style={styles.breakdownLabel}>This Week</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(earnings?.thisWeek || 0)}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownLeft}>
            <View style={[styles.breakdownDot, { backgroundColor: Colors.purple }]} />
            <Text style={styles.breakdownLabel}>This Month</Text>
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(earnings?.thisMonth || 0)}</Text>
        </View>

        <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
          <View style={styles.breakdownLeft}>
            <View style={[styles.breakdownDot, { backgroundColor: Colors.warning }]} />
            <Text style={[styles.breakdownLabel, styles.breakdownLabelBold]}>All Time</Text>
          </View>
          <Text style={[styles.breakdownValue, styles.breakdownValueBold]}>
            {formatCurrency(earnings?.allTime || 0)}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="bicycle-outline" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{earnings?.totalDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.blueLight }]}>
            <Ionicons name="trending-up-outline" size={24} color={Colors.blue} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(avgPerDelivery)}</Text>
          <Text style={styles.statLabel}>Avg / Delivery</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconWrap}>
          <Ionicons name="information-circle" size={20} color={Colors.textTertiary} />
        </View>
        <Text style={styles.infoText}>
          Earnings are calculated after each successful delivery.{'\n'}Payments are processed weekly.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  // Summary Hero
  summaryCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xxl,
    alignItems: 'center', marginBottom: Spacing.xl, overflow: 'hidden', ...Shadow.lg,
  },
  summaryGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' },
  summaryLabel: { fontSize: 14, color: Colors.white, opacity: 0.85 },
  summaryAmount: { fontSize: 42, fontWeight: '700', color: Colors.white, marginTop: Spacing.sm, letterSpacing: -1 },
  summarySubtext: { fontSize: 14, color: Colors.white, opacity: 0.7, marginTop: Spacing.xs },
  summaryTrend: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.pill, gap: 6 },
  summaryTrendText: { fontSize: 13, color: Colors.white, fontWeight: '500' },
  // Periods
  periodRow: { flexDirection: 'row', marginBottom: Spacing.xl, backgroundColor: Colors.white, borderRadius: BorderRadius.md, padding: 4, ...Shadow.sm },
  periodTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.sm },
  periodTabActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: Colors.white },
  // Breakdown
  breakdownCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.sm },
  breakdownTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  breakdownTotalRow: { borderBottomWidth: 0, paddingTop: Spacing.lg, marginTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 14, color: Colors.textSecondary },
  breakdownLabelBold: { fontWeight: '600', color: Colors.textPrimary },
  breakdownValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  breakdownValueBold: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  // Stats
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', ...Shadow.sm },
  statIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  // Info
  infoCard: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: 12, ...Shadow.sm },
  infoIconWrap: { marginTop: 2 },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
