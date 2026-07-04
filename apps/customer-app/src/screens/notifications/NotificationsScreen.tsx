import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { Notification } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

const ICONS: Record<string, string> = {
  ORDER: '📦',
  PROMOTION: '🏷️',
  SYSTEM: '🔔',
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await customerApi.getNotifications();
      setItems(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePress = async (item: Notification) => {
    if (item.isRead) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    await customerApi.markNotificationRead(item.id).catch(() => {});
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await customerApi.markAllNotificationsRead().catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.organic} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Notifications</Text>
        {items.some((i) => !i.isRead) && (
          <TouchableOpacity onPress={handleMarkAll} hitSlop={8}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🔔</Text>
          <Text style={s.emptyTitle}>You're all caught up</Text>
          <Text style={s.emptySubtitle}>Order updates and offers will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.card, !item.isRead && s.cardUnread]} onPress={() => handlePress(item)}>
              <Text style={s.icon}>{ICONS[item.type] || '🔔'}</Text>
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardMessage} numberOfLines={2}>{item.message}</Text>
              </View>
              {!item.isRead && <View style={s.dot} />}
            </TouchableOpacity>
          )}
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
  headerTitle: { ...Typography.h3, color: Colors.text },
  markAll: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.text },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  list: { padding: Spacing.lg },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  cardUnread: { borderColor: Colors.organic, backgroundColor: Colors.organicLight },
  icon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  cardMessage: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.organic, marginTop: 6 },
});
