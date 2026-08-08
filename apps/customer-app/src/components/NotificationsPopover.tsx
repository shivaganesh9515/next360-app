import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Platform, StatusBar, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, interpolateColor, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../lib/api';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import PopoverBackdrop from './PopoverBackdrop';
import { Notification } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import {
  usePanelAnimation,
  useContentFadeIn, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

const DOCK_SIZE = 36;
const DEFAULT_Y = 60;

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

const ICON_MAP: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  ORDER_PLACED:            { name: 'checkmark-circle', color: '#10B981' },
  ORDER_CONFIRMED:         { name: 'checkmark-circle', color: '#10B981' },
  ORDER_PACKED:            { name: 'cube',             color: '#F59E0B' },
  ORDER_READY:             { name: 'bag-check',        color: '#10B981' },
  ORDER_ASSIGNED:          { name: 'bicycle',          color: '#3B82F6' },
  ORDER_PICKED_UP:         { name: 'bicycle',          color: '#3B82F6' },
  ORDER_OUT_FOR_DELIVERY:  { name: 'bicycle',          color: '#3B82F6' },
  ORDER_DELIVERED:         { name: 'bag-check',        color: '#10B981' },
  ORDER_CANCELLED:         { name: 'close-circle',     color: '#EF4444' },
  ORDER_REFUNDED:          { name: 'cash',             color: '#8B5CF6' },
  PAYMENT_SUCCESS:         { name: 'card',             color: '#10B981' },
  PAYMENT_FAILED:          { name: 'alert-circle',     color: '#EF4444' },
  WELCOME:                 { name: 'happy',            color: '#10B981' },
  OFFER:                   { name: 'megaphone',        color: '#F59E0B' },
  LOW_STOCK:               { name: 'alert-circle',     color: '#F59E0B' },
  DELIVERY_COMPLETE:       { name: 'checkmark-circle', color: '#10B981' },
  SYSTEM:                  { name: 'notifications',    color: Colors.textSecondary },
};

function getIcon(notification: Notification) {
  return ICON_MAP[notification.type] || ICON_MAP.SYSTEM;
}

interface Props {
  iconColor?: string;
}

export default function NotificationsPopover({ iconColor = Colors.white }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const panelWidth = Math.min(500, screenWidth - Spacing.xl * 2);
  const panelHeight = Math.min(620, screenHeight * 0.85);

  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'web' ? 12 : (insets.top > 0 ? insets.top + 42 : 90);

  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const originX = useSharedValue(screenWidth - Spacing.xl - DOCK_SIZE);
  const originY = useSharedValue(DEFAULT_Y);

  const triggerScale = useSharedValue(1);

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
    opacity: interpolate(anim.value, [0, 0.05], [1, 0]),
  }));

  const contentFade = useContentFadeIn(anim);

  // ── Start spring immediately when Modal becomes visible ──
  const animationStarted = useRef(false);
  useEffect(() => {
    if (visible && !animationStarted.current) {
      animationStarted.current = true;
      requestAnimationFrame(() => {
        animOpen();
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      });
    }
    if (!visible) {
      animationStarted.current = false;
    }
  }, [visible, animOpen]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await customerApi.getNotifications();
      const list = Array.isArray(res) ? res : res?.notifications || res?.data || [];
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const open = useCallback(() => {
    triggerScale.value = withSpring(0.85, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y, width, height) => {
      originX.value = x;
      const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      originY.value = y + statusBarOffset;
      setVisible(true);
      setExpanded(true);
      load();
    });
  }, [load]);

  const finishClose = useCallback(() => {
    setExpanded(false);
    setVisible(false);
  }, []);

  const close = useCallback(() => {
    animClose(finishClose);
  }, [animClose]);

  const handlePress = useCallback(async (item: Notification) => {
    if (item.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    await customerApi.markNotificationRead(item.id).catch(() => {});
  }, []);

  const handleMarkAll = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await customerApi.markAllNotificationsRead().catch(() => {});
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) return;
    const channel = getSupabase()
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'Notification', filter: `userId=eq.${user.id}`,
      }, (payload) => {
        const row = payload.new as Notification;
        setItems((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
      })
      .subscribe();
    return () => { getSupabase().removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = items.filter((i) => !i.isRead).length;

  // ── Panel anchored at trigger position ──
  // originX / originY are SharedValues — always latest from UI thread.
  // RIGHT edge stays at originX.value + DOCK_SIZE throughout transition.
  const panelStyle = useAnimatedStyle(() => {
    const width = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelWidth, panelWidth]);
    const height = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelHeight * 0.4, panelHeight]);
    const desiredLeft = originX.value + DOCK_SIZE - panelWidth;
    const openX = Math.max(20, Math.min(screenWidth - panelWidth - 20, desiredLeft));
    const left = interpolate(anim.value, [0, 1], [originX.value, openX]);
    const top = interpolate(anim.value, [0, 1], [originY.value, safeTop]);
    return {
      left,
      top,
      width,
      height,
      borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
      backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
        ['rgba(255,255,255,0.12)', 'rgba(250,249,246,0.95)', '#FAF9F6'],
      ),
    };
  }, [safeTop, screenWidth, screenHeight, panelWidth, panelHeight]);

  return (
    <>
      <Reanimated.View ref={dockRef} style={[styles.reserve, triggerAnimStyle]} collapsable={false}>
        <TouchableOpacity style={styles.dock} activeOpacity={1} onPress={open}>
          <Ionicons name="notifications-outline" size={18} color={iconColor} />
          {unreadCount > 0 && <View style={styles.dockBadge} />}
        </TouchableOpacity>
      </Reanimated.View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop style={backdropStyle} onPress={close} />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          <Reanimated.View
            style={[styles.ghostWrap, triggerGhostStyle]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
          >
            <View style={styles.dock}>
              <Ionicons name="notifications-outline" size={18} color={Colors.white} />
            </View>
          </Reanimated.View>

          <Reanimated.View
            style={[StyleSheet.absoluteFill, contentFade]}
            pointerEvents={Platform.OS === 'web' ? undefined : (expanded ? 'auto' : 'none')}
          >
            <View style={Platform.OS === 'web' ? { flex: 1, pointerEvents: expanded ? 'auto' : 'none' as any } : { flex: 1 }}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={styles.headerActions}>
                  {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
                      <Text style={styles.markAll}>Mark all read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={8}>
                    <Ionicons name="close" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={Colors.organic} />
                </View>
              ) : items.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="notifications-off-outline" size={36} color={Colors.border} />
                  <Text style={styles.emptyTitle}>You're all caught up</Text>
                  <Text style={styles.emptySubtitle}>Order updates and offers will show up here.</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={items.slice(0, 5)}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                      const ic = getIcon(item);
                      return (
                        <TouchableOpacity
                          style={[styles.card, !item.isRead && styles.cardUnread]}
                          onPress={() => handlePress(item)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.iconWrap, { backgroundColor: !item.isRead ? ic.color + '18' : 'transparent' }]}>
                            <Ionicons name={ic.name} size={18} color={!item.isRead ? ic.color : Colors.textSecondary} />
                          </View>
                          <View style={styles.cardBody}>
                            <View style={styles.cardHeader}>
                              <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={2}>
                                {item.title}
                              </Text>
                              <Text style={styles.cardSubtitle}>{timeAgo(item.createdAt)}</Text>
                            </View>
                            <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
                          </View>
                          {!item.isRead && <View style={styles.dot} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                  <TouchableOpacity
                    style={styles.viewAllRow}
                    onPress={() => { close(); navigation.navigate('Notifications' as any); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllText}>View All Notifications</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.organic} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Reanimated.View>
        </Reanimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reserve: { width: DOCK_SIZE, height: DOCK_SIZE },
  dock: {
    width: DOCK_SIZE, height: DOCK_SIZE, borderRadius: DOCK_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dockBadge: {
    position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.error, borderWidth: 1.5, borderColor: Colors.text,
  },
  ghostWrap: {
    position: 'absolute', top: 0, right: 0, width: DOCK_SIZE, height: DOCK_SIZE,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { pointerEvents: 'none' as any } }),
  },
  panel: { position: 'absolute', overflow: 'hidden' },
  panelShadow: Platform.select({
    web: { boxShadow: '0px 24px 48px rgba(10, 10, 8, 0.28), 0px 4px 12px rgba(10, 10, 8, 0.08)' },
    default: {
      shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.28, shadowRadius: 32, elevation: 20,
    },
  }) as any,
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  markAll: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptySubtitle: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardUnread: { borderColor: Colors.organic, backgroundColor: Colors.organicLight },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, minWidth: 0 },
  cardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm,
  },
  cardTitle: { ...Typography.bodySmall, color: Colors.text, flexShrink: 1, fontFamily: 'Inter_500Medium' },
  cardTitleUnread: { color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  cardSubtitle: { ...Typography.caption, color: Colors.textSecondary, flexShrink: 0, marginTop: 1 },
  cardMessage: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.organic, marginTop: 8 },
  viewAllRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  viewAllText: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
});
