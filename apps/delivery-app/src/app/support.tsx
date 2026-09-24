import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supportApi } from '../lib/api';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../constants/theme';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  { value: 'DELIVERY', label: 'Delivery' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'ACCOUNT', label: 'Account & KYC' },
  { value: 'APP_ISSUE', label: 'App Issue' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: Colors.warning, bg: Colors.warningLight },
  PENDING: { label: 'Pending', color: Colors.warning, bg: Colors.warningLight },
  ASSIGNED: { label: 'Assigned', color: Colors.blue, bg: Colors.blueLight },
  RESOLVED: { label: 'Resolved', color: Colors.success, bg: Colors.successLight },
  CLOSED: { label: 'Closed', color: Colors.textTertiary, bg: Colors.borderLight },
};

export default function SupportScreen() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('DELIVERY');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await supportApi.getMyTickets();
      const list = Array.isArray(res) ? res : (res?.data || res?.tickets || []);
      setTickets(list);
    } catch (error) {
      console.error('Fetch tickets error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required', 'Please enter a subject and message.');
      return;
    }
    setSubmitting(true);
    try {
      const res: any = await supportApi.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        category,
      });
      setSubject('');
      setMessage('');
      setShowNew(false);
      Alert.alert('Submitted', 'Our support team will get back to you soon.');
      load();
      if (res?.id) router.push(`/support/${res.id}` as any);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (date: string) => {
    const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return new Date(date).toLocaleDateString('en-IN');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.infoCard}>
              <Ionicons name="headset" size={22} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Need help?</Text>
                <Text style={styles.infoText}>
                  Raise a ticket and our team typically replies within 24 hours. Reply directly
                  for delivery, payment or account issues.
                </Text>
              </View>
            </View>
            {showNew && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>New Ticket</Text>

                <Text style={styles.label}>Category</Text>
                <View style={styles.chipRow}>
                  {CATEGORIES.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      style={[styles.chip, category === c.value && styles.chipActive]}
                      onPress={() => setCategory(c.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, category === c.value && styles.chipTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Subject</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Brief summary of the issue"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.label}>Message</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe the problem in detail"
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNew(false)} activeOpacity={0.7}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                    onPress={submitTicket}
                    disabled={submitting}
                    activeOpacity={0.85}
                  >
                    {submitting ? (
                      <ActivityIndicator color={Colors.white} size="small" />
                    ) : (
                      <Text style={styles.submitText}>Submit Ticket</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !loading && !showNew ? (
            <EmptyState
              icon="chatbubbles-outline"
              iconColor={Colors.textTertiary}
              title="No tickets yet"
              subtitle="Raised a delivery, payment or account issue? It will appear here."
              actionLabel="New Ticket"
              actionIcon="add"
              onAction={() => setShowNew(true)}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.status] || STATUS_META.OPEN;
          return (
            <TouchableOpacity
              style={styles.ticketCard}
              onPress={() => router.push(`/support/${item.id}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketIdWrap}>
                  <Text style={styles.ticketId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                </View>
              </View>
              <Text style={styles.ticketSubject} numberOfLines={2}>{item.subject}</Text>
              <Text style={styles.ticketMessage} numberOfLines={2}>{item.message}</Text>
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketMeta}>{(item.category || 'OTHER').toLowerCase().replace(/_/g, ' ')}</Text>
                <Text style={styles.ticketMeta}>•</Text>
                <Text style={styles.ticketMeta}>{timeAgo(item.createdAt)}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.replyCount}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color={Colors.textTertiary} /> {item._count?.replies ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {!showNew && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowNew(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.fabText}>New Ticket</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.lg, paddingBottom: 120 },
  infoCard: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.sm,
  },
  infoTitle: { ...Typography.title, color: Colors.textPrimary },
  infoText: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  formCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadow.sm },
  formTitle: { ...Typography.title, color: Colors.textPrimary, marginBottom: Spacing.md },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 6, marginTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.pill, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  input: { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: Spacing.lg },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: BorderRadius.md },
  cancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: BorderRadius.md, minWidth: 130, alignItems: 'center' },
  submitText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  ticketCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  ticketIdWrap: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  ticketId: { ...Typography.mono, fontSize: 12, color: Colors.textSecondary },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketSubject: { ...Typography.title, fontSize: 15, color: Colors.textPrimary },
  ticketMessage: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  ticketFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  ticketMeta: { ...Typography.caption, color: Colors.textTertiary },
  replyCount: { ...Typography.caption, color: Colors.textTertiary },
  fab: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.xxl,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 14,
    borderRadius: BorderRadius.pill, ...Shadow.md,
  },
  fabText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});