import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows, SPRING_CONFIG } from '../../constants/theme';
import StaggerFadeIn from '../../components/StaggerFadeIn';

const PLANS = [
  {
    id: 'weekly', name: 'Weekly Box', price: 499,
    badge: 'Popular', badgeColor: Colors.organic,
    description: 'Fresh organic essentials delivered every week',
    includes: ['5 seasonal fruits & vegetables', '2 pantry staples', '1 artisanal product'],
  },
  {
    id: 'biweekly', name: 'Bi-Weekly Box', price: 899,
    badge: 'Best Value', badgeColor: Colors.eco,
    description: 'Larger selection delivered every two weeks',
    includes: ['10 seasonal fruits & vegetables', '4 pantry staples', '2 artisanal products', 'Free delivery'],
  },
  {
    id: 'monthly', name: 'Monthly Box', price: 1499,
    badge: 'Premium', badgeColor: Colors.natural,
    description: 'Full pantry restock once a month',
    includes: ['20 seasonal fruits & vegetables', '8 pantry staples', '4 artisanal products', 'Free delivery', 'Bonus surprise gift'],
  },
];

const BOX_CUSTOMIZATION = [
  { id: 'fruits', label: 'Fruits', icon: 'nutrition-outline' },
  { id: 'vegetables', label: 'Vegetables', icon: 'leaf-outline' },
  { id: 'grains', label: 'Grains & Pulses', icon: 'layers-outline' },
  { id: 'oils', label: 'Oils & Ghee', icon: 'water-outline' },
  { id: 'spices', label: 'Spices', icon: 'flame-outline' },
  { id: 'skincare', label: 'Natural Skincare', icon: 'color-palette-outline' },
];

// Spring scale animation on toggle — used for plan selection radio dots
// and category chips
function useSpringToggle(active: boolean) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: active ? 1 : 0, ...SPRING_CONFIG, useNativeDriver: true }).start();
  }, [active]);

  return anim;
}

function PlanRadio({ selected, color }: { selected: boolean; color: string }) {
  const anim = useSpringToggle(selected);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={[s.planRadio, selected && { borderColor: color }]}>
      <Animated.View style={[s.planRadioDot, { backgroundColor: color, transform: [{ scale }] }]} />
    </View>
  );
}

function CategoryChip({
  cat, isSelected, onToggle,
}: {
  cat: typeof BOX_CUSTOMIZATION[number];
  isSelected: boolean;
  onToggle: () => void;
}) {
  const anim = useSpringToggle(isSelected);
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.white, Colors.organicLight],
  });
  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.organic],
  });

  return (
    <Animated.View style={{ backgroundColor: bgColor, borderColor, borderWidth: 1.5, borderRadius: BorderRadius.pill }}>
      <TouchableOpacity
        style={s.categoryChipInner}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Ionicons
          name={cat.icon as any}
          size={18}
          color={isSelected ? Colors.organic : Colors.textSecondary}
        />
        <Text style={[s.categoryLabel, isSelected && s.categoryLabelSelected]}>
          {cat.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SubscriptionScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['fruits', 'vegetables']);

  // Hero entrance animation
  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }).start();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    Alert.alert('Coming Soon', 'Subscription box ordering will be available shortly!');
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Subscription Box</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Hero */}
        <Animated.View
          style={[
            s.heroCard, Shadows.raised,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={s.heroIconWrap}>
            <Ionicons name="gift" size={32} color={Colors.white} />
          </View>
          <Text style={s.heroTitle}>Curated boxes, delivered on your schedule</Text>
          <Text style={s.heroSubtitle}>
            Fresh seasonal organic produce + handpicked artisanal products.
            Skip, pause, or cancel anytime.
          </Text>
        </Animated.View>

        {/* Plans */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Choose your plan</Text>
          {PLANS.map((plan, i) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <StaggerFadeIn key={plan.id} index={i}>
                <TouchableOpacity
                  style={[s.planCard, Shadows.card, isSelected && s.planCardSelected]}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.85}
                >
                  {plan.badge && (
                    <View style={[s.planBadge, { backgroundColor: plan.badgeColor }]}>
                      <Text style={s.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={s.planTop}>
                    <Text style={s.planName}>{plan.name}</Text>
                    <Text style={[s.planPrice, { color: plan.badgeColor }]}>₹{plan.price}</Text>
                  </View>
                  <Text style={s.planSubtitle}>per {plan.id === 'weekly' ? 'week' : plan.id === 'biweekly' ? '2 weeks' : 'month'}</Text>
                  <Text style={s.planDesc}>{plan.description}</Text>
                  <View style={s.planIncludes}>
                    {plan.includes.map((item, j) => (
                      <View key={j} style={s.includeRow}>
                        <Ionicons name="checkmark-circle" size={14} color={plan.badgeColor} />
                        <Text style={s.includeText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <PlanRadio selected={isSelected} color={plan.badgeColor} />
                </TouchableOpacity>
              </StaggerFadeIn>
            );
          })}
        </View>

        {/* Customize your box — animated category chips */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Customize your box</Text>
          <Text style={s.sectionSubtitle}>Select the categories you'd like included</Text>
          <View style={s.categoryGrid}>
            {BOX_CUSTOMIZATION.map((cat) => (
              <CategoryChip
                key={cat.id}
                cat={cat}
                isSelected={selectedCategories.includes(cat.id)}
                onToggle={() => toggleCategory(cat.id)}
              />
            ))}
          </View>
        </View>

        {/* Delivery schedule */}
        <View style={[s.scheduleCard, Shadows.card]}>
          <View style={s.scheduleHeader}>
            <Ionicons name="calendar-outline" size={20} color={Colors.organic} />
            <Text style={s.scheduleTitle}>Delivery Schedule</Text>
          </View>
          <View style={s.scheduleRow}>
            <Text style={s.scheduleLabel}>Next delivery</Text>
            <Text style={s.scheduleValue}>Every {selectedPlan === 'weekly' ? 'Monday' : selectedPlan === 'biweekly' ? 'other Monday' : '1st Monday'}</Text>
          </View>
          <View style={s.scheduleRow}>
            <Text style={s.scheduleLabel}>Skip next</Text>
            <TouchableOpacity>
              <Text style={s.scheduleAction}>Pause deliveries</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscribe CTA */}
        <TouchableOpacity
          style={[s.subscribeBtn, Shadows.button(Colors.organic), !selectedPlan && s.subscribeBtnDisabled]}
          onPress={handleSubscribe}
          disabled={!selectedPlan}
        >
          <Ionicons name="sparkles" size={18} color="#FFF" />
          <Text style={s.subscribeText}>
            {selectedPlan ? `Subscribe to ${PLANS.find((p) => p.id === selectedPlan)?.name}` : 'Select a plan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  heroCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.organic + '20',
  },
  heroIconWrap: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  heroTitle: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  heroSubtitle: {
    ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm,
  },

  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  sectionSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg },

  planCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border, position: 'relative',
  },
  planCardSelected: { borderColor: Colors.organic },
  planBadge: {
    position: 'absolute', top: -8, right: Spacing.lg,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm,
  },
  planBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.white, letterSpacing: 0.3 },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { ...Typography.h3, color: Colors.text },
  planPrice: { ...Typography.h2 },
  planSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  planDesc: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.md },
  planIncludes: { gap: 4, marginBottom: Spacing.md },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  includeText: { ...Typography.caption, color: Colors.text },
  planRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  planRadioDot: { width: 12, height: 12, borderRadius: 6 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChipInner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  categoryLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  categoryLabelSelected: { color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  scheduleCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  scheduleTitle: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  scheduleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  scheduleLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  scheduleValue: { ...Typography.bodySmall, color: Colors.text, maxWidth: '60%', textAlign: 'right' },
  scheduleAction: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.organic,
    borderRadius: BorderRadius.pill, paddingVertical: Spacing.lg,
  },
  subscribeBtnDisabled: { opacity: 0.5 },
  subscribeText: { ...Typography.button, color: Colors.white },
});
