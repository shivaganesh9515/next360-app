import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export default function SupportScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const FAQS = [
    {
      q: 'How do I track my live order?',
      a: 'Go to "My Orders" tab on the bottom navbar or tap on your active order card on the home screen to view real-time delivery GPS tracking.',
    },
    {
      q: 'What are Next360 delivery areas & timings?',
      a: 'We deliver 100% certified organic groceries across Hyderabad and Vijayawada. Morning slot: 6:00 AM – 9:00 AM. Evening slot: 5:00 PM – 9:00 PM.',
    },
    {
      q: 'How does the Organic Quality Guarantee work?',
      a: 'If any produce arrives damaged or un-fresh, report it within 2 hours of delivery for an instant 100% refund straight to your Next360 Wallet.',
    },
    {
      q: 'What payment modes are accepted?',
      a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, Next360 Wallet Cash, and Cash on Delivery (COD).',
    },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>24x7 Customer Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Support Banner */}
        <View style={s.bannerCard}>
          <View style={s.bannerTop}>
            <View style={s.headsetCircle}>
              <Ionicons name="headset" size={24} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bannerTitle}>How can we help you today?</Text>
              <Text style={s.bannerSub}>24x7 live assistance for orders, returns & quality</Text>
            </View>
          </View>
        </View>

        {/* Contact Cards */}
        <Text style={s.sectionHeader}>DIRECT CONTACT OPTIONS</Text>
        <View style={s.contactGrid}>
          <TouchableOpacity style={s.contactCard} onPress={() => Linking.openURL('tel:+911800000000')} activeOpacity={0.8}>
            <View style={[s.contactIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="call" size={20} color="#2E7D32" />
            </View>
            <Text style={s.contactTitle}>Call Us</Text>
            <Text style={s.contactSub}>Toll-free 1800-00-00</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.contactCard} onPress={() => Linking.openURL('https://wa.me/911800000000')} activeOpacity={0.8}>
            <View style={[s.contactIconBox, { backgroundColor: '#E0F2F1' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#00796B" />
            </View>
            <Text style={s.contactTitle}>WhatsApp</Text>
            <Text style={s.contactSub}>Instant chat reply</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.contactCard} onPress={() => Linking.openURL('mailto:support@next360.app')} activeOpacity={0.8}>
            <View style={[s.contactIconBox, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="mail" size={20} color="#0288D1" />
            </View>
            <Text style={s.contactTitle}>Email Us</Text>
            <Text style={s.contactSub}>support@next360.app</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={s.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={s.faqList}>
          {FAQS.map((item, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <TouchableOpacity
                key={item.q}
                style={[s.faqCard, idx < FAQS.length - 1 && s.faqBorder]}
                onPress={() => setExpandedFaq(isOpen ? null : idx)}
                activeOpacity={0.7}
              >
                <View style={s.faqHeaderRow}>
                  <Text style={s.faqQ}>{item.q}</Text>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#757575" />
                </View>
                {isOpen && <Text style={s.faqA}>{item.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Organic Assurance Card */}
        <View style={s.assuranceCard}>
          <Ionicons name="shield-checkmark" size={22} color="#2E7D32" />
          <View style={{ flex: 1 }}>
            <Text style={s.assuranceTitle}>Next360 Farm Assurance Policy</Text>
            <Text style={s.assuranceSub}>100% replacement or refund guaranteed for fresh produce quality issues.</Text>
          </View>
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

  bannerCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.raised,
  },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headsetCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22FF88',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF' },
  bannerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#A0A0A0', marginTop: 2 },

  sectionHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#757575',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  contactGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.text },
  contactSub: { fontFamily: 'Inter_400Regular', fontSize: 10, color: '#757575', marginTop: 2 },

  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  faqCard: {
    padding: 14,
  },
  faqBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQ: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  faqA: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#616161', marginTop: 8, lineHeight: 19 },

  assuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginBottom: Spacing.lg,
  },
  assuranceTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#1B5E20' },
  assuranceSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#2E7D32', marginTop: 2 },
});
