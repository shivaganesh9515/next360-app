import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useDeliveryStore } from '../store/deliveryStore';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../constants/theme';
import { useSpringEntrance } from '../hooks/useDeliveryAnimation';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  NEW_DELIVERY: 'bicycle',
  DELIVERY_COMPLETE: 'checkmark-circle',
  PICKUP_REMINDER: 'alarm',
  DELIVERY_ISSUE: 'alert-circle',
  DAILY_EARNINGS: 'cash',
  WEEKLY_INCENTIVE: 'gift',
  KYC_APPROVED: 'shield-checkmark',
  KYC_REJECTED: 'shield-half',
  'KYC_APPROVED_DELIVERY': 'shield-checkmark',
  'KYC_REJECTED_DELIVERY': 'shield-half',
  SYSTEM: 'notifications',
};

export default function NotificationsScreen() {
  const {
    notifications, unreadCount, isLoading,
    fetchNotifications, fetchUnreadCount, markNotificationRead, markAllNotificationsRead,
  } = useDeliveryStore();
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useSpringEntrance(0);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setRefreshing(false);
  };

  const handleMarkAll = () => {
    Alert.alert('Mark all as read', 'Dismiss every notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark all', style: 'destructive', onPress: markAllNotificationsRead },
    ]);
  };

  const handlePress = (item: any) => {
    if (!item.isRead) markNotificationRead(item.id);
    const data = item.data || {};
    switch (data.screen) {
      case 'NewOrders': router.push('/(tabs)/new-orders'); break;
      case 'ActiveDelivery':
        router.push(data.orderVendorGroupId ? `/delivery/${data.orderVendorGroupId}` : '/(tabs)');
        break;
      case 'History': router.push('/(tabs)/history'); break;
      case 'Earnings': router.push('/(tabs)/earnings'); break;
      case 'Support': router.push('/support' as any); break;
      default: router.push('/(tabs)');
    }
  };

  const timeAgo = (date: string) => {
    const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return new Date(date).toLocaleDateString('en-IN');
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: Colors.background, opacity: fadeAnim }}>
      {/* Summary bar */}
      {notifications.length > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryLeft}>
            <Ionicons name="mail-unread-outline" size={16} color={Colors.primary} />
            <Text style={styles.summaryText}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isLoading && notifications.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="notifications-off-outline" size={32} color={Colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                New order alerts, pickup reminders and delivery updates will appear here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.isRead && styles.itemUnread]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.isRead ? Colors.borderLight : Colors.primaryLight }]}>
              <Ionicons
                name={TYPE_ICONS[item.type] || 'notifications'}
                size={20}
                color={item.isRead ? Colors.textTertiary : Colors.primary}
              />
            </View>
            <View style={styles.itemBody}>
              <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={3}>{item.body}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryText: { ...Typography.caption, color: Colors.textSecondary },
  markAll: { ...Typography.caption, color: Colors.primary, fontWeight: '700' },
  listContent: { padding: Spacing.lg, paddingBottom: 48 },
  loadingWrap: { paddingVertical: Spacing.huge, alignItems: 'center' },
  item: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm,
  },
  itemUnread: { borderWidth: 1, borderColor: Colors.primary, borderStyle: 'solid' },
  iconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1 },
  title: { ...Typography.title, fontSize: 15, color: Colors.textPrimary },
  titleUnread: { fontWeight: '700' },
  body: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  time: { ...Typography.caption, color: Colors.textTertiary, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xxl },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, ...Shadow.sm },
  emptyTitle: { ...Typography.headline, fontSize: 18, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});