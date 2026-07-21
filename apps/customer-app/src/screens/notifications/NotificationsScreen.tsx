import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Notification as NotificationType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import ErrorState from '../../components/ErrorState';

const PAGE_SIZE = 20;

// Notification type → icon + color mapping — uses Ionicons instead of emoji
// for a more polished look that matches the app's visual language.
const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  ORDER_PLACED:         { name: 'checkmark-circle',    color: '#10B981' },
  ORDER_CONFIRMED:      { name: 'checkmark-circle',    color: '#10B981' },
  ORDER_PACKED:         { name: 'cube',                color: '#F59E0B' },
  ORDER_READY:          { name: 'bag-check',           color: '#10B981' },
  ORDER_ASSIGNED:       { name: 'bicycle',             color: '#3B82F6' },
  ORDER_PICKED_UP:      { name: 'bicycle',             color: '#3B82F6' },
  ORDER_OUT_FOR_DELIVERY: { name: 'bicycle',           color: '#3B82F6' },
  ORDER_DELIVERED:      { name: 'bag-check',           color: '#10B981' },
  ORDER_CANCELLED:      { name: 'close-circle',        color: '#EF4444' },
  ORDER_REFUNDED:       { name: 'cash',                color: '#8B5CF6' },
  PAYMENT_SUCCESS:      { name: 'card',                color: '#10B981' },
  PAYMENT_FAILED:       { name: 'alert-circle',        color: '#EF4444' },
  REFUND_INITIATED:     { name: 'refresh',             color: '#F59E0B' },
  REFUND_COMPLETED:     { name: 'checkmark-circle',    color: '#10B981' },
  WELCOME:              { name: 'happy',               color: '#10B981' },
  COUPON:               { name: 'pricetag',            color: '#8B5CF6' },
  OFFER:                { name: 'megaphone',           color: '#F59E0B' },
  WISHLIST:             { name: 'heart',               color: '#EF4444' },
  NEW_ORDER:            { name: 'cart',                color: '#10B981' },
  LOW_STOCK:            { name: 'alert-circle',        color: '#F59E0B' },
  OUT_OF_STOCK:         { name: 'close-circle',        color: '#EF4444' },
  PAYOUT:               { name: 'wallet',              color: '#10B981' },
  NEW_REVIEW:           { name: 'star',                color: '#F59E0B' },
  VENDOR_APPROVED:      { name: 'checkmark-circle',    color: '#10B981' },
  VENDOR_SUSPENDED:     { name: 'shield',              color: '#EF4444' },
  DOCUMENT_EXPIRY:      { name: 'document-text',       color: '#F59E0B' },
  NEW_DELIVERY:         { name: 'bicycle',             color: '#3B82F6' },
  PICKUP_REMINDER:      { name: 'alarm',               color: '#F59E0B' },
  DELIVERY_ISSUE:       { name: 'warning',             color: '#EF4444' },
  DELIVERY_COMPLETE:    { name: 'checkmark-circle',    color: '#10B981' },
  DAILY_EARNINGS:       { name: 'cash',                color: '#10B981' },
  WEEKLY_INCENTIVE:     { name: 'gift',                color: '#8B5CF6' },
  KYC_PENDING:          { name: 'document-text',       color: '#F59E0B' },
  LARGE_REFUND:         { name: 'cash',                color: '#EF4444' },
  SYSTEM:               { name: 'notifications',       color: Colors.textSecondary },
};

function getIcon(notification: NotificationType) {
  const mapped = ICON_MAP[notification.type] || ICON_MAP.SYSTEM;
  return mapped;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Navigate to the screen indicated by a notification's data payload.
 * Falls back to OrderDetail when an orderId is present but no explicit screen.
 */
function navigateToNotification(
  navigation: any,
  notification: NotificationType,
) {
  const { data } = notification;
  if (data?.screen && data?.orderId) {
    navigation.navigate(data.screen as any, { orderId: data.orderId });
  } else if (data?.orderId) {
    navigation.navigate('OrderDetail' as any, { orderId: data.orderId });
  } else if (data?.screen) {
    navigation.navigate(data.screen as any);
  }
  // No known target — no-op, the read-mark is still handled
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const [items, setItems] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      const res: any = await customerApi.getNotifications({ page: pageNum, limit: PAGE_SIZE });
      const list: NotificationType[] = Array.isArray(res) ? res : res?.notifications || res?.data || [];
      const total: number = res?.total ?? list.length;

      if (isRefresh || pageNum === 1) {
        setItems(list);
      } else {
        setItems((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = list.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newItems];
        });
      }

      setUnreadCount(list.filter((n) => !n.isRead).length);
      setHasMore(pageNum * PAGE_SIZE < total);
      setError(false);
    } catch {
      if (pageNum === 1) {
        setItems([]);
        setError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1); }, [load]));

  // Real-time subscription: listen for INSERT on the Notification table so new
  // notifications appear live — same pattern as the NotificationsPopover.
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) return;
    const channel = getSupabase()
      .channel(`notifications-screen-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'Notification', filter: `userId=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new as NotificationType;
        setItems((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
        if (!row.isRead) setUnreadCount((c) => c + 1);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'Notification', filter: `userId=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new as NotificationType;
        setItems((prev) => prev.map((n) => (n.id === row.id ? row : n)));
        setUnreadCount((prev) => Math.max(0, row.isRead ? prev - 1 : prev + 1));
      })
      .subscribe();

    return () => { getSupabase().removeChannel(channel); };
  }, [user?.id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    load(1, true);
  }, [load]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await load(nextPage);
  }, [loadingMore, hasMore, page, load]);

  const handlePress = useCallback(async (item: NotificationType) => {
    if (item.isRead) {
      // Even if already read, try to navigate
      navigateToNotification(navigation, item);
      return;
    }
    // Optimistic mark as read + navigate
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await customerApi.markNotificationRead(item.id).catch(() => {});
    navigateToNotification(navigation, item);
  }, [navigation]);

  const handleMarkAll = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await customerApi.markAllNotificationsRead().catch(() => {});
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.organic} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
            </TouchableOpacity>
          )}
          <Text style={s.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
            <Text style={s.markAll}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <ErrorState message={t('notifications.error.load')} onRetry={() => { setLoading(true); load(1); }} />
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="notifications-off-outline" size={56} color={Colors.border} />
          <Text style={s.emptyTitle}>{t('notifications.empty.title')}</Text>
          <Text style={s.emptySubtitle}>{t('notifications.empty.subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.organic} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? (
            <View style={s.footerLoader}><ActivityIndicator size="small" color={Colors.organic} /></View>
          ) : null}
          renderItem={({ item }) => {
            const icon = getIcon(item);
            return (
              <TouchableOpacity
                style={[s.card, !item.isRead && s.cardUnread]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={[s.iconWrap, { backgroundColor: !item.isRead ? icon.color + '18' : 'transparent' }]}>
                  <Ionicons name={icon.name} size={20} color={!item.isRead ? icon.color : Colors.textSecondary} />
                </View>
                <View style={s.cardBody}>
                  <View style={s.cardHeader}>
                    <Text style={[s.cardTitle, !item.isRead && s.cardTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={s.cardTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={[s.cardMessage, !item.isRead && s.cardMessageUnread]} numberOfLines={2}>
                    {item.message}
                  </Text>
                </View>
                {!item.isRead && <View style={s.dot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: Colors.organic, alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: Colors.white },
  markAll: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.md },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 40 },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardUnread: {
    borderColor: Colors.organic + '40',
    backgroundColor: Colors.organicLight,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitle: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  cardTitleUnread: { color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  cardTime: { ...Typography.caption, color: Colors.textSecondary },
  cardMessage: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  cardMessageUnread: { color: Colors.text },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.organic, marginTop: 8,
    flexShrink: 0,
  },
});
