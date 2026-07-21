import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

const PLANS = [
  {
    id: 'weekly',
    name: 'Weekly Organic Box',
    price: 499,
    badge: 'MOST POPULAR',
    badgeColor: '#22FF88',
    sub: 'Fresh farm essentials every 7 days',
    features: ['5 Seasonal fruits & vegetables', '2 Pantry staples', 'Free priority delivery'],
  },
  {
    id: 'biweekly',
    name: 'Bi-Weekly Family Pack',
    price: 899,
    badge: 'BEST VALUE',
    badgeColor: '#FFD700',
    sub: 'Complete organic supply every 14 days',
    features: ['10 Seasonal fruits & vegetables', '4 Pantry staples', 'Free priority delivery', '10% Cashback'],
  },
  {
    id: 'monthly',
    name: 'Monthly Mega Pantry',
    price: 1499,
    badge: 'VIP SAVINGS',
    badgeColor: '#00E676',
    sub: 'Full month organic restock',
    features: ['20 Seasonal fruits & vegetables', '8 Pantry staples', 'Free priority delivery', 'Bonus gift item'],
  },
];

export default function SubscriptionScreen({ navigation }: any) {
  const [selectedPlan, setSelectedPlan] = useState<string>('weekly');

  const handleSubscribe = () => {
    const plan = PLANS.find((p) => p.id === selectedPlan);
    Alert.alert(
      'Subscription Activated',
      `You have selected ${plan?.name} (₹${plan?.price}). Your first delivery will arrive this Monday!`,
      [{ text: 'Great!', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Next360 VIP Pass</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* VIP Hero Card */}
        <View style={s.vipCard}>
          <View style={s.vipBadgeRow}>
            <Ionicons name="sparkles" size={16} color="#FFD700" />
            <Text style={s.vipTag}>ORGANIC VIP MEMBERSHIP</Text>
          </View>
          <Text style={s.vipTitle}>Unlimited Free Delivery & Extra Discounts</Text>
          <Text style={s.vipSub}>Save over ₹4,500 every year with Next360 farm-direct subscription</Text>
        </View>

        {/* Plans */}
        <Text style={s.sectionHeader}>SELECT YOUR SUBSCRIPTION PLAN</Text>
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[s.planCard, isSelected && s.planCardSelected]}
              onPress={() => setSelectedPlan(plan.id)}
              activeOpacity={0.8}
            >
              <View style={s.planHeader}>
                <View style={s.planRadio}>
                  {isSelected && <View style={s.planRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.planName}>{plan.name}</Text>
                  <Text style={s.planSub}>{plan.sub}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.planPrice}>₹{plan.price}</Text>
                  <View style={[s.badgePill, { backgroundColor: plan.badgeColor }]}>
                    <Text style={s.badgeText}>{plan.badge}</Text>
                  </View>
                </View>
              </View>

              <View style={s.featuresList}>
                {plan.features.map((feat, idx) => (
                  <View key={idx} style={s.featureRow}>
                    <Ionicons name="checkmark-circle" size={15} color="#2E7D32" />
                    <Text style={s.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Perks Card */}
        <View style={s.perksCard}>
          <Text style={s.perksTitle}>VIP Member Privileges</Text>
          <View style={s.perkRow}>
            <Ionicons name="flash-outline" size={18} color="#22FF88" />
            <Text style={s.perkText}>Priority 6:00 AM slots reserved exclusively for VIP</Text>
          </View>
          <View style={s.perkRow}>
            <Ionicons name="refresh-outline" size={18} color="#22FF88" />
            <Text style={s.perkText}>Pause, skip delivery or cancel subscription anytime</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer CTA */}
      <View style={s.footer}>
        <TouchableOpacity style={s.subscribeBtn} onPress={handleSubscribe} activeOpacity={0.85}>
          <Ionicons name="sparkles" size={18} color="#0A0A0A" />
          <Text style={s.subscribeBtnText}>Activate VIP Membership</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

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
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1A1A1A' },

  content: { padding: Spacing.lg },

  vipCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.raised,
  },
  vipBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  vipTag: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#FFD700', letterSpacing: 0.8 },
  vipTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF' },
  vipSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#A0A0A0', marginTop: 4, lineHeight: 18 },

  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#757575',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  planCardSelected: {
    borderColor: '#22FF88',
    backgroundColor: '#FAFFFA',
  },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#22FF88',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  planRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0A0A0A' },
  planName: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#1A1A1A' },
  planSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#757575', marginTop: 1 },
  planPrice: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1A1A1A' },
  badgePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.pill, marginTop: 2 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#0A0A0A' },

  featuresList: { gap: 6, borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#424242' },

  perksCard: {
    backgroundColor: '#1E1E24',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  perksTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFD700', marginBottom: 10 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  perkText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#E0E0E0', flex: 1 },

  footer: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22FF88',
    borderRadius: BorderRadius.lg,
    height: 52,
  },
  subscribeBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#0A0A0A' },
});
