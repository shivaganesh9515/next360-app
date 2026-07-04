import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { Offer } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, getStoreAccent, getStoreLabel } from '../../constants/theme';

export default function PromosScreen() {
  const { storeType } = useStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await customerApi.getActiveOffers(storeType);
      setOffers(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [storeType]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
        <Text style={s.headerTitle}>Offers & Coupons</Text>
        <Text style={s.headerSub}>Active in {getStoreLabel(storeType)}</Text>
      </View>

      {offers.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🏷️</Text>
          <Text style={s.emptyTitle}>No active offers right now</Text>
          <Text style={s.emptySubtitle}>Check back soon for deals in this store.</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const accent = getStoreAccent(item.storeType);
            return (
              <View style={[s.card, { borderColor: accent }]}>
                <View style={[s.discountPill, { backgroundColor: accent }]}>
                  <Text style={s.discountText}>
                    {item.discountType === 'PERCENTAGE' ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`}
                  </Text>
                </View>
                <Text style={s.cardTitle}>{item.title}</Text>
                {!!item.description && <Text style={s.cardDesc}>{item.description}</Text>}
                <Text style={s.cardExpiry}>
                  Valid till {new Date(item.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
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
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  headerSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.text },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  list: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderStyle: 'dashed',
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  discountPill: {
    alignSelf: 'flex-start', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.md, paddingVertical: 4, marginBottom: Spacing.sm,
  },
  discountText: { ...Typography.caption, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  cardDesc: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  cardExpiry: { ...Typography.caption, color: Colors.textSecondary },
});
