import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator, Dimensions,
} from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolate, interpolateColor, runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../lib/api';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Notification } from '../types';
import { Colors, Typography, Spacing, BorderRadius, REANIMATED_SPRING_CONFIG } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DOCK_SIZE = 36;
const PANEL_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.5;

const ICONS: Record<string, string> = {
  ORDER: '📦',
  PROMOTION: '🏷️',
  SYSTEM: '🔔',
};

interface Props {
  iconColor?: string;
}

// Same expand-in-place animation language as ExpandingSearchDock (width/height/
// borderRadius spring from a small dock circle), but this one pops forward with
// real depth — a blurred + dimmed backdrop behind it — since it's a half-screen
// panel with its own scrollable content, not an inline search bar.
export default function NotificationsPopover({ iconColor = Colors.white }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState({ x: SCREEN_WIDTH - Spacing.xl - DOCK_SIZE, y: 100 });
  const anim = useSharedValue(0);

  const topTarget = insets.top + Spacing.md;
  const leftTarget = SCREEN_WIDTH - Spacing.xl - PANEL_WIDTH;

  const load = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getNotifications();
      setItems(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const open = () => {
    dockRef.current?.measureInWindow((x, y) => {
      setOrigin({ x, y });
      setVisible(true);
      setExpanded(true);
      load();
      requestAnimationFrame(() => {
        anim.value = withSpring(1, REANIMATED_SPRING_CONFIG);
      });
    });
  };

  const close = () => {
    const finishClose = () => {
      setExpanded(false);
      setVisible(false);
    };
    anim.value = withSpring(0, REANIMATED_SPRING_CONFIG, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const handlePress = async (item: Notification) => {
    if (item.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    await customerApi.markNotificationRead(item.id).catch(() => {});
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await customerApi.markAllNotificationsRead().catch(() => {});
  };

  // Previously notifications only ever loaded when the panel was opened, so
  // the unread dock badge was always wrong until the user opened it at least
  // once. Loading on mount means the badge is correct as soon as the dock
  // renders, and the subscription below keeps it correct as new ones arrive.
  useEffect(() => {
    load();
  }, []);

  // Previously notifications only ever loaded once when the panel was opened
  // — the unread dock badge could sit stale for an entire session even as new
  // order/promo notifications landed server-side. Subscribing here means a
  // new row shows up (and the badge lights up) live, whether or not the panel
  // is currently open.
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

  const backdropStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  const panelStyle = useAnimatedStyle(() => ({
    top: interpolate(anim.value, [0, 1], [origin.y, topTarget]),
    left: interpolate(anim.value, [0, 1], [origin.x, leftTarget]),
    width: interpolate(anim.value, [0, 1], [DOCK_SIZE, PANEL_WIDTH]),
    height: interpolate(anim.value, [0, 1], [DOCK_SIZE, PANEL_HEIGHT]),
    borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
    // Interpolated in lockstep with the size instead of a static white fill —
    // the static color made the collapsed/collapsing panel show a plain white
    // circle at small sizes instead of matching the translucent dock button.
    backgroundColor: interpolateColor(anim.value, [0, 1], ['rgba(255,255,255,0.12)', Colors.white]),
  }));
  const iconOnlyStyle = useAnimatedStyle(() => ({ opacity: interpolate(anim.value, [0, 0.35, 1], [1, 0, 0]) }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: interpolate(anim.value, [0, 0.6, 1], [0, 0, 1]) }));
  const unreadCount = items.filter((i) => !i.isRead).length;

  return (
    <>
      <View ref={dockRef} style={styles.reserve} collapsable={false}>
        <TouchableOpacity style={styles.dock} activeOpacity={0.7} onPress={open}>
          <Ionicons name="notifications-outline" size={18} color={iconColor} />
          {unreadCount > 0 && <View style={styles.dockBadge} />}
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <Reanimated.View style={[styles.backdrop, backdropStyle]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
        </Reanimated.View>

        <Reanimated.View
          // Deep-shadow card — deliberately heavier than the app's normal
          // Shadows.raised so it reads as popping forward off the blurred backdrop.
          style={[styles.panel, styles.panelShadow, panelStyle]}
        >
          <Reanimated.View style={[styles.iconOnly, iconOnlyStyle]} pointerEvents="none">
            <Ionicons name="notifications-outline" size={18} color={Colors.white} />
          </Reanimated.View>

          <Reanimated.View style={[styles.content, contentStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
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
                <Text style={styles.emptyEmoji}>🔔</Text>
                <Text style={styles.emptyTitle}>You're all caught up</Text>
                <Text style={styles.emptySubtitle}>Order updates and offers will show up here.</Text>
              </View>
            ) : (
              <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.card, !item.isRead && styles.cardUnread]}
                    onPress={() => handlePress(item)}
                  >
                    <Text style={styles.icon}>{ICONS[item.type] || '🔔'}</Text>
                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
                    </View>
                    {!item.isRead && <View style={styles.dot} />}
                  </TouchableOpacity>
                )}
              />
            )}
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
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,8,0.35)',
  },
  panel: { position: 'absolute', overflow: 'hidden' },
  panelShadow: {
    shadowColor: '#0A0A08',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 24,
  },
  iconOnly: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  markAll: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  emptySubtitle: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },

  list: { padding: Spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardUnread: { borderColor: Colors.organic, backgroundColor: Colors.organicLight },
  icon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  cardMessage: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.organic, marginTop: 6 },
});
