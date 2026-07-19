import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function SupportScreen({ navigation }: any) {
  const { t } = useTranslation();

  const FAQS = [
    { q: t('support.faq.trackOrder.q'), a: t('support.faq.trackOrder.a') },
    { q: t('support.faq.deliveryAreas.q'), a: t('support.faq.deliveryAreas.a') },
    { q: t('support.faq.cod.q'), a: t('support.faq.cod.a') },
    { q: t('support.faq.returns.q'), a: t('support.faq.returns.a') },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('support.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.contactRow}>
          <TouchableOpacity style={s.contactCard} onPress={() => Linking.openURL('tel:+911800000000')}>
            <Text style={s.contactIcon}>📞</Text>
            <Text style={s.contactLabel}>{t('support.contact.callUs')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.contactCard} onPress={() => Linking.openURL('mailto:support@next360.app')}>
            <Text style={s.contactIcon}>✉️</Text>
            <Text style={s.contactLabel}>{t('support.contact.emailUs')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.contactCard}
            onPress={() => Linking.openURL('https://wa.me/911800000000')}
          >
            <Text style={s.contactIcon}>💬</Text>
            <Text style={s.contactLabel}>{t('support.contact.whatsapp')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>{t('support.section.faq')}</Text>
        {FAQS.map((item) => (
          <View key={item.q} style={s.faqCard}>
            <Text style={s.faqQ}>{item.q}</Text>
            <Text style={s.faqA}>{item.a}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>{t('support.section.about')}</Text>
        <View style={s.faqCard}>
          <Text style={s.faqA}>{t('support.about.text')}</Text>
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
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  contactRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  contactCard: {
    flex: 1, alignItems: 'center', gap: 6, backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.lg,
  },
  contactIcon: { fontSize: 24 },
  contactLabel: { ...Typography.caption, color: Colors.text, fontFamily: 'Inter_600SemiBold' },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },
  faqCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.sm,
  },
  faqQ: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  faqA: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
});
