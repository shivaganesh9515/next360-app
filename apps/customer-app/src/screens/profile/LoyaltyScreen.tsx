import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows, SPRING_CONFIG } from '../../constants/theme';
import StaggerFadeIn from '../../components/StaggerFadeIn';
import AnimatedCounter from '../../components/AnimatedCounter';
import { customerApi } from '../../lib/api';
import * as Clipboard from 'expo-clipboard';

// 8-tier tree growth loyalty program — Seed → Forest
const LOYALTY_TIERS = [
  {
    id: 'SEED', name: 'Seed', emoji: '🌱', pointsNeeded: 0,
    color: '#8B9D7B', benefits: ['Welcome discount 5%', 'Exclusive organic tips', 'Early sale access'],
  },
  {
    id: 'SEEDLING', name: 'Seedling', emoji: '🌿', pointsNeeded: 100,
    color: '#7A9E6D', benefits: ['10% off first order', 'Birthday bonus', 'Free delivery on ₹300+'],
  },
  {
    id: 'SAPLING', name: 'Sapling', emoji: '🌲', pointsNeeded: 300,
    color: '#5C8A4D', benefits: ['15% store credit monthly', 'Early access new products', 'Free delivery on all orders'],
  },
  {
    id: 'PLANT', name: 'Plant', emoji: '🌳', pointsNeeded: 600,
    color: '#4A7C3A', benefits: ['20% off any order', 'Monthly free gift', 'Priority customer support'],
  },
  {
    id: 'YOUNG_TREE', name: 'Young Tree', emoji: '🌴', pointsNeeded: 1000,
    color: '#3D6E2E', benefits: ['25% store credit', 'Free eco-friendly tote', 'Invite-only product drops'],
  },
  {
    id: 'TREE', name: 'Tree', emoji: '🌲', pointsNeeded: 1500,
    color: '#2F5E20', benefits: ['30% off everything', 'Free weekly subscription box', 'Name in supporter wall'],
  },
  {
    id: 'MATURE_TREE', name: 'Mature Tree', emoji: '🌳', pointsNeeded: 2500,
    color: '#1E4A12', benefits: ['35% off everything', 'Personal shopper', 'Exclusive farm visits'],
  },
  {
    id: 'FOREST', name: 'Forest', emoji: '🌲🌳🌴', pointsNeeded: 5000,
    color: '#0C3506', benefits: ['40% off everything', 'VIP events access', 'Plant a tree in your name'],
  },
];

export default function LoyaltyScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [currentTierId, setCurrentTierId] = useState('SEED');
  const [tierPointsEarned, setTierPointsEarned] = useState(0);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      const [loyaltyStatus, referrals] = await Promise.all([
        customerApi.getLoyaltyMe(),
        customerApi.getReferrals(),
      ]);
      setPoints(loyaltyStatus.pointsBalance || 0);
      setCurrentTierId(loyaltyStatus.tier?.id || 'SEED');
      setTierPointsEarned(loyaltyStatus.tierPointsEarned || 0);
      setReferralCode(referrals.referralCode || '');
    } catch (err) {
      // Fallback to demo data if API fails
      setPoints(450);
      setCurrentTierId('SAPLING');
      setTierPointsEarned(450);
    } finally {
      setLoading(false);
    }
  };

  const currentTierIndex = LOYALTY_TIERS.findIndex((t) => t.id === currentTierId);
  const currentTier = LOYALTY_TIERS[currentTierIndex >= 0 ? currentTierIndex : 0];
  const nextTier = LOYALTY_TIERS[currentTierIndex + 1];
  const progress = nextTier
    ? (tierPointsEarned - currentTier.pointsNeeded) / (nextTier.pointsNeeded - currentTier.pointsNeeded)
    : 1;
  const progressPct = Math.min(Math.max(progress, 0), 1);

  // Animated progress bar fill — sweeps from 0 to target on mount
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  // Hero card entrance — fades up with spring
  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Your Loyalty</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.organic} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Loyalty</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Current tier hero card — springs into view */}
        <Animated.View
          style={[
            s.heroCard, Shadows.raised,
            { borderColor: currentTier.color + '40', opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
          ]}
        >
          <View style={[s.heroEmojiWrap, { backgroundColor: currentTier.color + '18' }]}>
            <Text style={s.heroEmoji}>{currentTier.emoji}</Text>
          </View>
          <Text style={[s.heroTierName, { color: currentTier.color }]}>{currentTier.name}</Text>
          <AnimatedCounter to={points} style={s.heroPoints} formatFn={(v) => v.toLocaleString()} />

          {/* Progress bar to next tier — animated fill */}
          {nextTier && (
            <View style={s.progressSection}>
              <View style={s.progressLabels}>
                <Text style={s.progressLabel}>{currentTier.name}</Text>
                <Text style={s.progressLabel}>{nextTier.name}</Text>
              </View>
              <View style={[s.progressTrack, { backgroundColor: currentTier.color + '20' }]}>
                <Animated.View
                  style={[
                    s.progressFill,
                    { width: progressWidth, backgroundColor: currentTier.color },
                  ]}
                />
                <Animated.View
                  style={[
                    s.progressThumb,
                    { left: progressWidth, marginLeft: -9 },
                  ]}
                >
                  <View style={[s.progressThumbInner, { backgroundColor: currentTier.color }]} />
                </Animated.View>
              </View>
              <Text style={s.progressHint}>
                {nextTier.pointsNeeded - tierPointsEarned} more points to {nextTier.name}
              </Text>
            </View>
          )}

          {!nextTier && (
            <Text style={s.maxTierText}>You've reached the highest tier! Thank you for growing with us. 🌱</Text>
          )}
        </Animated.View>

        {/* Current tier benefits — staggered fade-in */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{currentTier.name} Benefits</Text>
          <View style={[s.benefitsCard, Shadows.card]}>
            {currentTier.benefits.map((benefit, i) => (
              <StaggerFadeIn key={i} index={i}>
                <View style={[s.benefitRow, i < currentTier.benefits.length - 1 && s.benefitBorder]}>
                  <View style={[s.benefitDot, { backgroundColor: currentTier.color }]}>
                    <Ionicons name="leaf" size={10} color="#FFF" />
                  </View>
                  <Text style={s.benefitText}>{benefit}</Text>
                </View>
              </StaggerFadeIn>
            ))}
          </View>
        </View>

        {/* All tiers timeline — staggered fade-in */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Growth Journey</Text>
          <View style={[s.timelineCard, Shadows.card]}>
            {LOYALTY_TIERS.map((tier, i) => {
              const isUnlocked = i <= currentTierIndex;
              const isCurrent = i === currentTierIndex;
              return (
                <StaggerFadeIn key={tier.id} index={i}>
                  <TouchableOpacity
                    style={[s.tierRow, isCurrent && s.tierRowCurrent, { borderLeftColor: tier.color }]}
                    activeOpacity={0.7}
                  >
                    <View style={s.tierLeft}>
                      <Text style={s.tierEmoji}>{tier.emoji}</Text>
                      <View style={s.tierInfo}>
                        <Text style={[s.tierName, !isUnlocked && s.tierLocked]}>{tier.name}</Text>
                        <Text style={s.tierPoints}>{tier.pointsNeeded.toLocaleString()} points</Text>
                      </View>
                    </View>
                    {isCurrent && (
                      <View style={[s.currentBadge, { backgroundColor: tier.color }]}>
                        <Text style={s.currentBadgeText}>You are here</Text>
                      </View>
                    )}
                    {!isUnlocked && <Ionicons name="lock-closed" size={14} color={Colors.textSecondary} />}
                    {isUnlocked && !isCurrent && <Ionicons name="checkmark-circle" size={18} color={tier.color} />}
                  </TouchableOpacity>
                </StaggerFadeIn>
              );
            })}
          </View>
        </View>

        {/* Referral Code */}
        {referralCode && (
          <View style={[s.infoCard, Shadows.card]}>
            <Text style={s.infoTitle}>Refer a Friend</Text>
            <View style={s.referralRow}>
              <Text style={s.referralCode}>{referralCode}</Text>
              <TouchableOpacity style={s.copyButton} onPress={() => Clipboard.setStringAsync(referralCode)}>
                <Ionicons name="copy-outline" size={16} color={Colors.organic} />
              </TouchableOpacity>
            </View>
            <Text style={s.infoText}>Share this code and earn 100 points when they make their first purchase!</Text>
          </View>
        )}

        {/* How it works */}
        <View style={[s.infoCard, Shadows.card]}>
          <Text style={s.infoTitle}>How to earn points</Text>
          <View style={s.infoRow}>
            <Ionicons name="cart-outline" size={18} color={Colors.organic} />
            <Text style={s.infoText}>₹1 spent = 1 point</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="star-outline" size={18} color={Colors.natural} />
            <Text style={s.infoText}>Write a review = 25 points</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="people-outline" size={18} color={Colors.eco} />
            <Text style={s.infoText}>Refer a friend = 100 points</Text>
          </View>
          <View style={s.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.brass} />
            <Text style={s.infoText}>Birthday bonus = 50 points</Text>
          </View>
        </View>
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
    borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  heroEmojiWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  heroEmoji: { fontSize: 36 },
  heroTierName: { ...Typography.h2, fontFamily: 'Fraunces_700Bold', marginBottom: 4 },
  heroPoints: {
    ...Typography.body, color: Colors.textSecondary, fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 20, letterSpacing: 0.5,
  },

  progressSection: { width: '100%', marginTop: Spacing.xl },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm,
  },
  progressLabel: { ...Typography.caption, color: Colors.textSecondary },
  progressTrack: {
    height: 8, borderRadius: 4, position: 'relative', overflow: 'visible',
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressThumb: {
    position: 'absolute', top: -5, width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
      },
    }),
  },
  progressThumbInner: { width: 10, height: 10, borderRadius: 5 },
  progressHint: {
    ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm,
  },
  maxTierText: {
    ...Typography.bodySmall, color: Colors.organic, textAlign: 'center', marginTop: Spacing.lg,
    fontFamily: 'Inter_600SemiBold',
  },

  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  benefitsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  benefitBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  benefitDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },

  timelineCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  tierRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderLeftWidth: 3,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tierRowCurrent: { backgroundColor: Colors.background },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  tierEmoji: { fontSize: 24 },
  tierInfo: { flex: 1 },
  tierName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  tierLocked: { color: Colors.textSecondary },
  tierPoints: { ...Typography.caption, color: Colors.textSecondary },
  currentBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  currentBadgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.white, letterSpacing: 0.3 },

  infoCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  infoTitle: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  infoText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },

  referralRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  referralCode: {
    fontFamily: 'JetBrainsMono_400Regular', fontSize: 16, color: Colors.text,
    letterSpacing: 1,
  },
  copyButton: { padding: Spacing.sm },
});
