import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// A real in-app confirmation dialog — Alert.alert renders nothing at all on
// react-native-web (no native implementation there), so anything gated behind
// it silently looked broken on web (hit this twice already: cart quantity
// errors, sign-out). This is a plain RN Modal, which react-native-web does
// implement, styled to match the app instead of falling back to the
// browser's own unstyled window.confirm() chrome.
export default function ConfirmModal({
  visible, title, message, confirmLabel, cancelLabel = 'Cancel', icon = 'help-circle',
  destructive, onConfirm, onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={onCancel}>
        <Pressable style={[s.card, Shadows.raised]} onPress={(e) => e.stopPropagation()}>
          <View style={[s.iconWrap, { backgroundColor: destructive ? '#FEF2F2' : Colors.primaryLight }]}>
            <Ionicons name={icon} size={24} color={destructive ? Colors.error : Colors.primary} />
          </View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={s.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: destructive ? Colors.error : Colors.primary }]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={s.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,20,20,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h3, color: Colors.text, textAlign: 'center' },
  message: {
    ...Typography.body, color: Colors.textSecondary, textAlign: 'center',
    marginTop: Spacing.sm, lineHeight: 20,
  },
  actions: {
    flexDirection: 'row', gap: Spacing.md,
    marginTop: Spacing.xxl, width: '100%',
  },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: BorderRadius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelText: { ...Typography.button, color: Colors.text },
  confirmBtn: {
    flex: 1, height: 48, borderRadius: BorderRadius.pill,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { ...Typography.button, color: Colors.white },
});
