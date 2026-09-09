import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { Offer } from '../../types';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';
import ErrorState from '../../components/ErrorState';

export default function PromosScreen() {
  const navigation = useNavigation<any>();
  const { storeType } = useStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await customerApi.getActiveOffers(storeType);
      setOffers(Array.isArray(res) ? res : (res as any)?.data || []);
      setError(false);
    } catch {
      setOffers([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [storeType]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCopyCode = async (code: string) => {
    try {
      if (Platform.OS === 'web' && (navigator as any)?.clipboard) {
        await (navigator as any).clipboard.writeText(code);
      } else {
        const expoClipboard = require('expo-clipboard');
        if (expoClipboard?.setStringAsync) await expoClipboard.setStringAsync(code);
      }
    } catch { /* Clipboard not available */ }
    setCopiedCode(code);
    Alert.alert('Coupon Copied!', `Use code "${code}" at checkout to claim your discount.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.organic} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Offers & Coupons</Text>
        <View style={{ width: 36 }} />
      </View>

      {error ? (
        <ErrorState message="Could not load active promo codes." onRetry={load} />
      ) : offers.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIconBox}>
            <Ionicons name="pricetag-outline" size={48} color="#0A0A0A" />
          </View>
          <Text style={s.emptyTitle}>No Active Coupons</Text>
          <Text style={s.emptySubtitle}>Check back soon for new organic farm discounts & cashback vouchers!</Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isPercent = item.discountType === 'PERCENTAGE';
            const valueText = isPercent ? `${item.discountValue}% OFF` : `₹${item.discountValue} OFF`;
            const code = item.title?.split(' ')?.[0]?.toUpperCase() || 'NEXT360';

            return (
              <View style={s.couponCard}>
                <View style={s.cardTopRow}>
                  <View style={s.discountBadge}>
                    <Text style={s.discountBadgeText}>{valueText}</Text>
                  </View>
                  <TouchableOpacity style={s.copyBtn} onPress={() => handleCopyCode(code)} activeOpacity={0.8}>
                    <Text style={s.copyBtnText}>{copiedCode === code ? 'COPIED' : 'COPY CODE'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.cardTitle}>{item.title}</Text>
                {!!item.description && <Text style={s.cardDesc}>{item.description}</Text>}

                <View style={s.cardFooterRow}>
                  <View style={s.codeTag}>
                    <Ionicons name="pricetag" size={13} color="#2E7D32" />
                    <Text style={s.codeTagText}>{code}</Text>
                  </View>
                  <Text style={s.cardExpiry}>
                    Valid till {new Date(item.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.text },

  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.organicLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#757575', textAlign: 'center', marginTop: 6 },

  list: { padding: Spacing.lg },

  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    borderStyle: 'dashed',
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: Colors.organic,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  discountBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.white },

  copyBtn: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  copyBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: Colors.white },

  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  cardDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#616161', marginTop: 4, lineHeight: 18 },

  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
  },
  codeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  codeTagText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#2E7D32' },
  cardExpiry: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#757575' },
});
