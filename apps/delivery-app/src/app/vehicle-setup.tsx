import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deliveryApi } from '../lib/api';

// MVP is zone-gated to exactly these two cities (CLAUDE.md: "Zone-Gated
// Launch: MVP restricted to Hyderabad and Vijayawada only"). There's no
// zones list endpoint yet, so this is a fixed list rather than a fetch.
const ZONES = ['Hyderabad', 'Vijayawada'];

const VEHICLE_TYPES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'BIKE', label: 'Motorbike', icon: 'bicycle-outline' },
  { key: 'SCOOTER', label: 'Scooter', icon: 'bicycle-outline' },
  { key: 'BICYCLE', label: 'Bicycle', icon: 'bicycle-outline' },
  { key: 'CAR', label: 'Car', icon: 'car-outline' },
];

export default function VehicleSetupScreen() {
  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = !!vehicleType && !!zoneName;

  const handleSave = async () => {
    if (!vehicleType || !zoneName) return;
    setIsSaving(true);
    try {
      await deliveryApi.setupProfile({ vehicleType, zoneName });
      router.back();
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
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle & Zone</Text>
      <Text style={styles.subtitle}>Tell us what you drive and where you'll deliver.</Text>

      <Text style={styles.sectionLabel}>VEHICLE TYPE</Text>
      <View style={styles.grid}>
        {VEHICLE_TYPES.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[styles.optionCard, vehicleType === v.key && styles.optionCardActive]}
            onPress={() => setVehicleType(v.key)}
          >
            <Ionicons name={v.icon} size={28} color={vehicleType === v.key ? '#10B981' : '#6B7280'} />
            <Text style={[styles.optionLabel, vehicleType === v.key && styles.optionLabelActive]}>
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>DELIVERY ZONE</Text>
      <View style={styles.zoneList}>
        {ZONES.map((zone) => (
          <TouchableOpacity
            key={zone}
            style={[styles.zoneRow, zoneName === zone && styles.zoneRowActive]}
            onPress={() => setZoneName(zone)}
          >
            <Text style={[styles.zoneText, zoneName === zone && styles.zoneTextActive]}>{zone}</Text>
            {zoneName === zone && <Ionicons name="checkmark-circle" size={22} color="#10B981" />}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave || isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
  },
  optionCard: {
    width: '47%',
    aspectRatio: 1.4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '6%',
    marginBottom: 12,
  },
  optionCardActive: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  optionLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  optionLabelActive: {
    color: '#059669',
  },
  zoneList: {
    marginBottom: 32,
  },
  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  zoneRowActive: {
    borderColor: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  zoneText: {
    fontSize: 16,
    color: '#374151',
  },
  zoneTextActive: {
    color: '#059669',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
