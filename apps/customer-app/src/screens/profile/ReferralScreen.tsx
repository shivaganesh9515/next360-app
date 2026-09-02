import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';
import AnimatedCounter from '../../components/AnimatedCounter';

const DEMO_REFERRAL_CODE = 'NEXT360-GROW';
const DEMO_REFERRALS = [
  { name: 'Priya S.', date: '12 Jul', reward: 100, status: 'completed' },
  { name: 'Rahul K.', date: '8 Jul', reward: 100, status: 'completed' },
  { name: 'Ananya M.', date: '3 Jul', reward: 100, status: 'pending' },
];

export default function ReferralScreen({ navigation }: any) {
  const [copied, setCopied] = useState(false);
  const copyScale = useRef(new Animated.Value(1)).current;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🌱 Join me on Next360 — the organic marketplace! Use code ${DEMO_REFERRAL_CODE} to get ₹100 off your first order.\n\nDownload: https://next360.app/download`,
        title: 'Join Next360',
      });
    } catch { /* Share cancelled or failed */ }
  };

  const handleCopyCode = async () => {
    try {
      if (Platform.OS === 'web' && (navigator as any)?.clipboard) {
        await (navigator as any).clipboard.writeText(DEMO_REFERRAL_CODE);
      } else {
        const expoClipboard = require('expo-clipboard');
        if (expoClipboard?.setStringAsync) await expoClipboard.setStringAsync(DEMO_REFERRAL_CODE);
      }
    } catch { /* Clipboard not available */ }

    Animated.sequence([
      Animated.spring(copyScale, { toValue: 0.92, useNativeDriver: true }),
      Animated.spring(copyScale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Refer & Earn Organic</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Dark Hero Card */}
        <View style={s.heroCard}>
          <View style={s.giftIconCircle}>
            <Ionicons name="gift" size={28} color="#0A0A0A" />
          </View>
          <Text style={s.heroTitle}>Give ₹100, Get ₹100</Text>
          <Text style={s.heroSubtitle}>
            Share your code with friends. They get ₹100 off their first order, and you get ₹100 wallet credit!
          </Text>

          {/* Referral Code Box */}
          <View style={s.codeBox}>
            <Text style={s.codeText}>{DEMO_REFERRAL_CODE}</Text>
            <Animated.View style={{ transform: [{ scale: copyScale }] }}>
              <TouchableOpacity style={[s.copyBtn, copied && s.copyBtnDone]} onPress={handleCopyCode} activeOpacity={0.8}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? '#FFFFFF' : '#0A0A0A'} />
                <Text style={[s.copyText, copied && s.copyTextDone]}>{copied ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Share CTA */}
          <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={18} color="#0A0A0A" />
            <Text style={s.shareText}>Invite via WhatsApp / Share</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <AnimatedCounter to={3} style={s.statValue} />
            <Text style={s.statLabel}>FRIENDS JOINED</Text>
          </View>
          <View style={s.statCard}>
            <AnimatedCounter to={300} style={[s.statValue, { color: '#2E7D32' }]} formatFn={(v) => `₹${v}`} />
            <Text style={s.statLabel}>EARNED CASH</Text>
          </View>
          <View style={s.statCard}>
            <AnimatedCounter to={100} style={s.statValue} formatFn={(v) => `₹${v}`} />
            <Text style={s.statLabel}>PENDING</Text>
          </View>
        </View>

        {/* How It Works */}
        <Text style={s.sectionHeader}>HOW REFERRAL WORKS</Text>
        <View style={s.card}>
          <View style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumText}>1</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Share your unique code</Text>
              <Text style={s.stepSub}>Send your code to friends via WhatsApp or SMS</Text>
            </View>
          </View>
          <View style={s.stepDivider} />
          <View style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumText}>2</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Friend orders fresh groceries</Text>
              <Text style={s.stepSub}>They get ₹100 discount applied at checkout</Text>
            </View>
          </View>
          <View style={s.stepDivider} />
          <View style={s.stepRow}>
            <View style={s.stepNum}><Text style={s.stepNumText}>3</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>Get ₹100 in Next360 Wallet</Text>
              <Text style={s.stepSub}>Wallet credit added automatically upon delivery completion</Text>
            </View>
          </View>
        </View>

        {/* Recent Referrals List */}
        <Text style={s.sectionHeader}>REFERRAL HISTORY</Text>
        <View style={s.card}>
          {DEMO_REFERRALS.map((ref, idx) => (
            <View key={ref.name} style={[s.refRow, idx < DEMO_REFERRALS.length - 1 && s.refDivider]}>
              <View style={s.refAvatar}>
                <Text style={s.refAvatarText}>{ref.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.refName}>{ref.name}</Text>
                <Text style={s.refDate}>{ref.date}</Text>
              </View>
              <View style={[s.refBadge, { backgroundColor: ref.status === 'completed' ? '#E8F5E9' : '#FFF8E1' }]}>
                <Text style={[s.refBadgeText, { color: ref.status === 'completed' ? '#2E7D32' : '#F57F17' }]}>
                  {ref.status === 'completed' ? `+₹${ref.reward}` : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

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

  content: { padding: Spacing.lg },

  heroCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.raised,
  },
  giftIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22FF88',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#FFFFFF', textAlign: 'center' },
  heroSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A0A0A0', textAlign: 'center', marginTop: 4, marginBottom: 16, lineHeight: 18 },

  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    borderRadius: BorderRadius.md,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333340',
    marginBottom: 12,
  },
  codeText: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 16, color: '#22FF88', letterSpacing: 1.5 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22FF88',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  copyBtnDone: { backgroundColor: '#4CAF50' },
  copyText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#0A0A0A' },
  copyTextDone: { color: '#FFFFFF' },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22FF88',
    borderRadius: BorderRadius.lg,
    height: 48,
    width: '100%',
  },
  shareText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0A0A0A' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.text },
  statLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, color: '#757575', marginTop: 3, letterSpacing: 0.5 },

  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#757575',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#2E7D32' },
  stepContent: { flex: 1 },
  stepTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text },
  stepSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#757575', marginTop: 1 },
  stepDivider: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 4 },

  refRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  refDivider: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  refAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refAvatarText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#2E7D32' },
  refName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text },
  refDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#757575', marginTop: 1 },
  refBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: BorderRadius.pill },
  refBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 11 },
});
