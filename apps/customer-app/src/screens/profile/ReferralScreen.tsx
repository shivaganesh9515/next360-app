import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows, SPRING_CONFIG } from '../../constants/theme';
import StaggerFadeIn from '../../components/StaggerFadeIn';
import AnimatedCounter from '../../components/AnimatedCounter';

const DEMO_REFERRAL_CODE = 'NEXT360-GROW';
const DEMO_REFERRALS = [
  { name: 'Priya S.', date: '12 Jul', reward: 100, status: 'completed' },
  { name: 'Rahul K.', date: '8 Jul', reward: 100, status: 'completed' },
  { name: 'Ananya M.', date: '3 Jul', reward: 100, status: 'pending' },
];

// Animated counter for stat numbers — delegates to shared AnimatedCounter
// with a currency formatter for monetary values.

export default function ReferralScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Copy button spring animation
  const copyScale = useRef(new Animated.Value(1)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌱 Join me on Next360 — the organic marketplace for conscious living! Use my code ${DEMO_REFERRAL_CODE} to get ₹100 off your first order.\n\nDownload: https://next360.app/download`,
        title: 'Join me on Next360',
      });
    } catch {}
  };

  const handleCopyCode = async () => {
    // Copy to clipboard using expo-clipboard (installed via expo)
    try {
      const expoClipboard = require('expo-clipboard');
      if (expoClipboard?.setStringAsync) {
        await expoClipboard.setStringAsync(DEMO_REFERRAL_CODE);
      }
    } catch {
      // Clipboard not available — visual feedback still shows below
    }

    Animated.sequence([
      Animated.spring(copyScale, { toValue: 0.92, ...SPRING_CONFIG, useNativeDriver: true }),
      Animated.spring(copyScale, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }),
    ]).start();

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Hero reward card — springs into view */}
        <Animated.View
          style={[
            s.heroCard, Shadows.raised,
            {
              opacity: heroAnim,
              transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}
        >
          <View style={s.heroIconRow}>
            <View style={s.giftIconWrap}>
              <Ionicons name="gift-outline" size={28} color={Colors.white} />
            </View>
          </View>
          <Text style={s.heroTitle}>Invite friends, earn together</Text>
          <Text style={s.heroSubtitle}>
            Share your unique code. You get ₹100, they get ₹100 off their first order.
          </Text>

          {/* Referral code */}
          <View style={s.codeRow}>
            <View style={s.codeDisplay}>
              <Text style={s.codeText}>{DEMO_REFERRAL_CODE}</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: copyScale }] }}>
              <TouchableOpacity style={[s.copyBtn, copied && s.copyBtnDone]} onPress={handleCopyCode}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? '#FFF' : Colors.organic}
                />
                <Text style={[s.copyText, copied && s.copyTextDone]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Share button */}
          <TouchableOpacity style={[s.shareBtn, Shadows.button(Colors.organic)]} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#FFF" />
            <Text style={s.shareText}>Invite Friends</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats — animated counters using shared AnimatedCounter */}
        <View style={s.statsRow}>
          <View style={[s.statCard, Shadows.card]}>
            <AnimatedCounter to={3} style={s.statValue} />
            <Text style={s.statLabel}>Total Referrals</Text>
          </View>
          <View style={[s.statCard, Shadows.card]}>
            <AnimatedCounter
              to={300}
              style={[s.statValue, { color: Colors.organic }]}
              formatFn={(v) => `₹${v}`}
            />
            <Text style={s.statLabel}>Earned</Text>
          </View>
          <View style={[s.statCard, Shadows.card]}>
            <AnimatedCounter
              to={100}
              style={s.statValue}
              formatFn={(v) => `₹${v}`}
            />
            <Text style={s.statLabel}>Pending</Text>
          </View>
        </View>

        {/* How it works — staggered steps */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How it works</Text>
          <View style={[s.stepsCard, Shadows.card]}>
            {[
              { num: 1, text: 'Share your referral code with friends', color: Colors.organic },
              { num: 2, text: 'They sign up and place their first order', color: Colors.natural },
              { num: 3, text: 'You both get ₹100 credit instantly!', color: Colors.eco },
            ].map((step, i) => (
              <StaggerFadeIn key={i} index={i}>
                <View>
                  <View style={s.stepRow}>
                    <View style={[s.stepDot, { backgroundColor: step.color }]}>
                      <Text style={s.stepDotText}>{step.num}</Text>
                    </View>
                    <Text style={s.stepText}>{step.text}</Text>
                  </View>
                  {i < 2 && <View style={s.stepConnector} />}
                </View>
              </StaggerFadeIn>
            ))}
          </View>
        </View>

        {/* Recent referrals */}
        {DEMO_REFERRALS.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Referrals</Text>
            <View style={[s.referralsCard, Shadows.card]}>
              {DEMO_REFERRALS.map((ref, i) => (
                <StaggerFadeIn key={i} index={i}>
                  <View style={[s.referralRow, i < DEMO_REFERRALS.length - 1 && s.referralBorder]}>
                    <View style={s.referralAvatar}>
                      <Text style={s.referralAvatarText}>{ref.name[0]}</Text>
                    </View>
                    <View style={s.referralInfo}>
                      <Text style={s.referralName}>{ref.name}</Text>
                      <Text style={s.referralDate}>{ref.date}</Text>
                    </View>
                    <View style={[
                      s.referralStatus,
                      { backgroundColor: ref.status === 'completed' ? '#D1FAE5' : '#FEF3C7' },
                    ]}>
                      <Text style={[
                        s.referralStatusText,
                        { color: ref.status === 'completed' ? '#059669' : '#D97706' },
                      ]}>
                        {ref.status === 'completed' ? `+₹${ref.reward}` : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </StaggerFadeIn>
              ))}
            </View>
          </View>
        )}
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
    borderWidth: 1, borderColor: Colors.organic + '25',
  },
  heroIconRow: { marginBottom: Spacing.md },
  giftIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { ...Typography.h2, color: Colors.text, textAlign: 'center' },
  heroSubtitle: {
    ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center',
    marginTop: Spacing.sm, marginBottom: Spacing.xl,
  },

  codeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginBottom: Spacing.lg, width: '100%',
  },
  codeDisplay: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  codeText: {
    ...Typography.mono, fontSize: 16, fontFamily: 'JetBrainsMono_600SemiBold',
    color: Colors.text, textAlign: 'center', letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.organic,
    backgroundColor: Colors.white,
  },
  copyBtnDone: { backgroundColor: '#059669', borderColor: '#059669' },
  copyText: { ...Typography.button, color: Colors.organic, fontSize: 13 },
  copyTextDone: { color: '#FFF' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.organic,
    borderRadius: BorderRadius.pill, paddingVertical: Spacing.md,
    width: '100%',
  },
  shareText: { ...Typography.button, color: Colors.white },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { ...Typography.h2, color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  stepsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.white },
  stepText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },
  stepConnector: { width: 2, height: 16, marginLeft: 13, backgroundColor: Colors.border, marginVertical: 4 },

  referralsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  referralRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  referralBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  referralAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
  },
  referralAvatarText: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.organic },
  referralInfo: { flex: 1 },
  referralName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  referralDate: { ...Typography.caption, color: Colors.textSecondary },
  referralStatus: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  referralStatusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
