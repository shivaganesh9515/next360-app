import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { deliveryApi } from '../lib/api';
import { Colors, Spacing, BorderRadius, Shadow, Typography } from '../constants/theme';

export default function EditProfileScreen() {
  const { user, loadProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await deliveryApi.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      await loadProfile();
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'D'}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={Colors.textTertiary} />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 00000 00000"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.hint}>
            Your email and delivery zone cannot be changed here. Contact support if you need to update them.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.saveText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xl, paddingBottom: Spacing.huge },
  avatarWrap: { alignItems: 'center', marginVertical: Spacing.xl },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    ...Shadow.md,
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: Colors.white },
  email: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.md },
  formCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.xl, ...Shadow.sm },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: 8, marginTop: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  hint: { ...Typography.caption, color: Colors.textTertiary, lineHeight: 18, marginTop: Spacing.xs },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.xxl,
  },
  saveText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});