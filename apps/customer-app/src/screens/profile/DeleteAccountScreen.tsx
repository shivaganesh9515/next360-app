import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { customerApi } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const RED = '#C62828';

const WHAT_GETS_DELETED = [
  'Your profile — name, phone number, email and photo',
  'All saved delivery addresses',
  'Your cart and wishlist items',
  'Push notification preferences',
];

const WHAT_WE_KEEP = [
  'Past order records (required for tax & legal purposes)',
  'Payment history linked to those orders',
  'Reviews you posted (shown as "Deleted User")',
];

export default function DeleteAccountScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = () => {
    Alert.alert(
      'Final Confirmation',
      'This will permanently delete your account. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await customerApi.deleteAccount();
              await signOut();
            } catch (err) {
              setDeleting(false);
              Alert.alert(
                'Something went wrong',
                'We could not process your deletion request right now. Please try again or contact support@next360.app.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Delete Account</Text>
        <View style={{ width: 36 }} />
      </View>

      {deleting ? (
        <View style={s.deletingWrap}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={s.deletingText}>Deleting your account…</Text>
          <Text style={s.deletingSub}>You will be signed out automatically.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Warning Banner */}
          <View style={s.warningCard}>
            <Ionicons name="warning" size={22} color={RED} />
            <View style={{ flex: 1 }}>
              <Text style={s.warningTitle}>This is permanent</Text>
              <Text style={s.warningBody}>
                Deleting your account removes your profile and personal data from Next360.
                This action cannot be undone.
              </Text>
            </View>
          </View>

          {/* Deleted data */}
          <Text style={s.sectionHeader}>WHAT WILL BE DELETED</Text>
          {WHAT_GETS_DELETED.map((item) => (
            <View key={item} style={s.listRow}>
              <Ionicons name="trash-outline" size={16} color={RED} />
              <Text style={s.listText}>{item}</Text>
            </View>
          ))}

          {/* Retained data */}
          <Text style={[s.sectionHeader, { marginTop: Spacing.lg }]}>WHAT WE KEEP</Text>
          {WHAT_WE_KEEP.map((item) => (
            <View key={item} style={s.listRow}>
              <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
              <Text style={s.listText}>{item}</Text>
            </View>
          ))}

          {/* Confirm input */}
          <Text style={[s.sectionHeader, { marginTop: Spacing.lg }]}>CONFIRM</Text>
          <Text style={s.confirmHint}>
            Type <Text style={s.confirmWord}>DELETE</Text> below to enable the button:
          </Text>
          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              placeholder="Type DELETE"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              autoCorrect={false}
              value={confirmText}
              onChangeText={setConfirmText}
            />
          </View>

          <TouchableOpacity
            style={[s.deleteBtn, !canDelete && s.deleteBtnDisabled]}
            disabled={!canDelete}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Ionicons name="person-remove-outline" size={18} color="#FFFFFF" />
            <Text style={s.deleteBtnText}>Delete My Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={s.cancelBtnText}>Keep My Account</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 48,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: RED,
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 19,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#6B7280',
    marginTop: Spacing.lg,
    marginBottom: 10,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  listText: {
    flex: 1,
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 19,
  },
  confirmHint: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 10,
  },
  confirmWord: {
    fontWeight: '700',
    color: RED,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  input: {
    height: 46,
    fontSize: 15,
    color: '#111827',
  },
  deleteBtn: {
    marginTop: Spacing.xl,
    backgroundColor: RED,
    borderRadius: BorderRadius.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111827',
  },
  deletingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: Spacing.lg,
  },
  deletingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  deletingSub: {
    fontSize: 13,
    color: '#6B7280',
  },
});
