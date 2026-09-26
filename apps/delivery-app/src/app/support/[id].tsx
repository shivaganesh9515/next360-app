import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { supportApi } from '../../lib/api';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../../constants/theme';

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'Open', color: Colors.warning, bg: Colors.warningLight },
  PENDING: { label: 'Pending', color: Colors.warning, bg: Colors.warningLight },
  ASSIGNED: { label: 'Assigned', color: Colors.blue, bg: Colors.blueLight },
  RESOLVED: { label: 'Resolved', color: Colors.success, bg: Colors.successLight },
  CLOSED: { label: 'Closed', color: Colors.textTertiary, bg: Colors.borderLight },
};

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await supportApi.getTicket(id);
      setTicket(res?.data || res);
    } catch (error: any) {
      console.error('Fetch ticket error:', error);
      Alert.alert('Error', error?.message || 'Could not load ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await supportApi.replyToTicket(id!, reply.trim());
      setReply('');
      await load();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!ticket) return null;

  const meta = STATUS_META[ticket.status] || STATUS_META.OPEN;
  const replies = ticket.replies || [];
  const isClosed = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={88}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.idText}>#{ticket.id.slice(0, 8).toUpperCase()}</Text>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <Text style={styles.dateText}>{formatDate(ticket.createdAt)}</Text>
        </View>

        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={styles.messageText}>{ticket.message}</Text>
          <Text style={styles.messageMeta}>You · {formatDate(ticket.createdAt)}</Text>
        </View>

        {replies.map((r: any) => {
          const fromSupport = r.user?.role === 'ADMIN' || r.user?.role === 'VENDOR';
          return (
            <View
              key={r.id}
              style={[styles.messageBubble, fromSupport ? styles.supportBubble : styles.userBubble]}
            >
              <Text style={[styles.messageText, fromSupport && styles.supportText]}>{r.message}</Text>
              <Text style={[styles.messageMeta, fromSupport && styles.supportMeta]}>
                {fromSupport ? r.user?.name || 'Support' : 'You'} · {formatDate(r.createdAt)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {!isClosed && (
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            value={reply}
            onChangeText={setReply}
            placeholder="Type a reply..."
            placeholderTextColor={Colors.textTertiary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!reply.trim() || sending) && { opacity: 0.5 }]}
            onPress={sendReply}
            disabled={!reply.trim() || sending}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  idText: { ...Typography.mono, fontSize: 12, color: Colors.textSecondary, backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingHorizontal: 8, paddingVertical: 3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.pill },
  statusText: { fontSize: 11, fontWeight: '700' },
  subject: { ...Typography.headline, color: Colors.textPrimary },
  dateText: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
  messageBubble: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, maxWidth: '92%', ...Shadow.sm },
  userBubble: { backgroundColor: Colors.primaryLight, alignSelf: 'flex-start', borderTopLeftRadius: 4 },
  supportBubble: { backgroundColor: Colors.white, alignSelf: 'flex-end', borderTopRightRadius: 4, borderWidth: 1, borderColor: Colors.borderLight },
  messageText: { ...Typography.body, color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  supportText: {},
  messageMeta: { ...Typography.caption, color: Colors.textTertiary, marginTop: 6 },
  supportMeta: {},
  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: Spacing.lg, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  replyInput: {
    flex: 1, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: 10,
    fontSize: 15, color: Colors.textPrimary, maxHeight: 110, minHeight: 44,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
});