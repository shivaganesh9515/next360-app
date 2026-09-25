import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { deliveryApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';
import { useSpringEntrance } from '../hooks/useDeliveryAnimation';

const FALLBACK_ZONES = ['Hyderabad', 'Vijayawada'];

const VEHICLE_TYPES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'BIKE', label: 'Motorbike', icon: 'bicycle-outline' },
  { key: 'SCOOTER', label: 'Scooter', icon: 'bicycle-outline' },
  { key: 'BICYCLE', label: 'Bicycle', icon: 'bicycle-outline' },
  { key: 'CAR', label: 'Car', icon: 'car-outline' },
];

export default function VehicleSetupScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';
  const { user, loadProfile } = useAuthStore();
  const [vehicleType, setVehicleType] = useState<string | null>(user?.deliveryPartner?.vehicleType || null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [zones, setZones] = useState<string[]>(FALLBACK_ZONES);
  const [isSaving, setIsSaving] = useState(false);

  const fadeAnim = useSpringEntrance(0);
  const canSave = !!vehicleType && !!zoneName;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await deliveryApi.getZones();
        if (!active) return;
        const names = (data || [])
          .map((z: any) => z?.name)
          .filter((n: string | undefined): n is string => !!n);
        if (names.length) setZones(names);
        // Prefill the partner's current zone by matching their zoneId.
        const partnerZoneId = user?.deliveryPartner?.zoneId;
        if (partnerZoneId) {
          const match = (data || []).find(
            (z: any) => z?.id === partnerZoneId,
          );
          if (match?.name) setZoneName((prev) => prev ?? match.name);
        }
      } catch {
        // Live zones unavailable — keep the MVP fallback (Hyderabad, Vijayawada).
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!vehicleType || !zoneName) return;
    setIsSaving(true);
    try {
      await deliveryApi.setupProfile({ vehicleType, zoneName });
      if (isOnboarding) {
        router.replace('/kyc-documents?onboarding=1');
      } else {
        await loadProfile();
        Alert.alert('Saved', 'Your vehicle and delivery zone have been updated.');
        router.back();
      }
    } catch (error: any) {
      Alert.alert(
        'Could not save yet',
        error?.message || 'Vehicle/zone setup isn\'t available yet — this will work once the backend is live.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Vehicle & Zone</Text>
            <Text style={styles.subtitle}>Tell us what you drive and where you'll deliver.</Text>
          </View>
        </View>

        {isOnboarding && (
          <View style={styles.stepPill}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
            <Text style={styles.stepPillText}>Step 2 of 3</Text>
          </View>
        )}

        {/* Vehicle Type */}
        <Text style={styles.sectionLabel}>
          <Ionicons name="car-outline" size={14} color={Colors.textTertiary} /> VEHICLE TYPE
        </Text>
        <View style={styles.vehicleGrid}>
          {VEHICLE_TYPES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.optionCard, vehicleType === v.key && styles.optionCardActive]}
              onPress={() => setVehicleType(v.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconWrap, vehicleType === v.key && styles.optionIconWrapActive]}>
                <Ionicons name={v.icon} size={26} color={vehicleType === v.key ? Colors.white : Colors.textSecondary} />
              </View>
              <Text style={[styles.optionLabel, vehicleType === v.key && styles.optionLabelActive]}>
                {v.label}
              </Text>
              {vehicleType === v.key && (
                <View style={styles.selectedCheck}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Zone */}
        <Text style={styles.sectionLabel}>
          <Ionicons name="location-outline" size={14} color={Colors.textTertiary} /> DELIVERY ZONE
        </Text>
        <View style={styles.zoneList}>
          {zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneRow, zoneName === zone && styles.zoneRowActive]}
              onPress={() => setZoneName(zone)}
              activeOpacity={0.8}
            >
              <View style={styles.zoneLeft}>
                <View style={[styles.zoneIcon, zoneName === zone && styles.zoneIconActive]}>
                  <Ionicons name="location" size={16} color={zoneName === zone ? Colors.primary : Colors.textSecondary} />
                </View>
                <Text style={[styles.zoneText, zoneName === zone && styles.zoneTextActive]}>{zone}</Text>
              </View>
              {zoneName === zone && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textTertiary} />
          <Text style={styles.infoText}>
            You can update these details later from your profile settings.
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
              <Text style={styles.saveText}>{isOnboarding ? 'Save & Continue' : 'Save Details'}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.lg, marginBottom: Spacing.xxl },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadow.sm, marginTop: 4 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary, letterSpacing: 0.8, marginBottom: Spacing.md, gap: 4, flexDirection: 'row', alignItems: 'center' },
  stepPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.pill,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: Spacing.xl,
  },
  stepPillText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark, letterSpacing: 0.4 },
  // Vehicle Grid
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.xxl, gap: 12 },
  optionCard: {
    width: '47%', paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center',
    position: 'relative',
  },
  optionCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionIconWrap: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optionIconWrapActive: { backgroundColor: Colors.primary },
  optionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  optionLabelActive: { color: Colors.primaryDark },
  selectedCheck: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  // Zone
  zoneList: { marginBottom: Spacing.xxl },
  zoneRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.border,
  },
  zoneRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  zoneLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  zoneIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
  },
  zoneIconActive: { backgroundColor: Colors.white },
  zoneText: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  zoneTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  // Info
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginBottom: Spacing.xxl, ...Shadow.sm,
  },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  // Save
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: 16, gap: 8,
  },
  saveDisabled: { backgroundColor: Colors.textTertiary },
  saveText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
