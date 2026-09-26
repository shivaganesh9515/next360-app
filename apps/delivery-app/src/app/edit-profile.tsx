import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deliveryApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';
import { useSpringEntrance } from '../hooks/useDeliveryAnimation';

export default function EditProfileScreen() {
  const { user, loadProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useSpringEntrance(0);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await deliveryApi.updateProfile({ name: name.trim() });
      await loadProfile();
      router.back();
    } catch (error: any) {
      Alert.alert('Could not save', error?.message || 'Something went wrong. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {/* Identity (the screen title comes from the stack header) */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'D'}</Text>
          </View>
          <Text style={styles.email}>{user?.email || 'No email on file'}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Personal details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal details</Text>
            <Text style={styles.cardSubtitle}>These are the details your customers will see.</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={[styles.inputWrap, name.trim().length > 0 && styles.inputWrapValid]}>
              <Ionicons name="person-outline" size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                value={user?.phone || ''}
                editable={false}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
              />
            </View>
            <Text style={styles.inputHint}>Phone is linked to your login and cannot be changed here.</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                value={user?.email || ''}
                editable={false}
                placeholder="email@example.com"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="email-address"
              />
            </View>

            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="shield-outline" size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                value={user?.role || 'Delivery Partner'}
                editable={false}
              />
            </View>
            <Text style={styles.inputHint}>
              Email and delivery zone cannot be changed here. Contact support if you need to update them.
            </Text>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveDisabled]}
            onPress={handleSave}
            disabled={!canSave || isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={Colors.white} />
                <Text style={styles.saveText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  avatarWrap: { alignItems: 'center', paddingTop: Spacing.xxl },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    ...Shadow.md,
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: Colors.white },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.md },
  scroll: { paddingHorizontal: Spacing.xxl, paddingBottom: 40 },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xxl, ...Shadow.md },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl, lineHeight: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  inputWrapValid: { borderColor: Colors.primaryLight },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 14 },
  inputHint: { fontSize: 12, color: Colors.textTertiary, marginTop: -Spacing.sm },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: 16, gap: 8,
  },
  saveDisabled: { backgroundColor: Colors.textTertiary },
  saveText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
