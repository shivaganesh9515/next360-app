import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deliveryApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useSpringEntrance } from '../../hooks/useDeliveryAnimation';

export default function OnboardingBasicScreen() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useSpringEntrance(0);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      await deliveryApi.updateProfile({ name: name.trim() });
      router.replace('/vehicle-setup?onboarding=1');
    } catch (error: any) {
      Alert.alert('Could not save', error?.message || 'Something went wrong. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Basic Details</Text>
            <Text style={styles.subtitle}>Let's set up your deliver partner profile.</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
        </View>
        <Text style={styles.stepLabel}>Step 1 of 3 · Profile</Text>

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
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                editable={false}
              />
            </View>
            <Text style={styles.inputHint}>Phone is linked to your login and cannot be changed here.</Text>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              Next, you'll tell us about your vehicle and delivery zone, then verify your documents.
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
                <Text style={styles.saveText}>Continue to Vehicle & Zone</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.white} />
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
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg, paddingHorizontal: Spacing.xxl, paddingTop: 60, paddingBottom: Spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadow.sm, marginTop: 4 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.sm },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary },
  progressLine: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: Colors.border, marginHorizontal: Spacing.xs },
  stepLabel: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
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
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.xxl,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 18 },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: 16, gap: 8,
  },
  saveDisabled: { backgroundColor: Colors.textTertiary },
  saveText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});