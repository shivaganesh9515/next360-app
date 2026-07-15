import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { geocodeAddress } from '../../lib/geocode';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddAddressScreen({ navigation }: any) {
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = fullAddress.trim() && city.trim() && state.trim() && pincode.trim().length === 6;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Missing details', 'Fill in the address, city, state, and a 6-digit pincode.');
      return;
    }
    setLoading(true);
    try {
      // Geocoded once here so every consumer of this address (Order Tracking's
      // map, delivery ETA, etc.) has a real lat/lng instead of nothing — this
      // was the actual gap: nothing in the app ever captured coordinates, so
      // the tracking map always fell back to a fixed placeholder location.
      // Best-effort — a failed/slow geocode still saves the address by text.
      const coords = await geocodeAddress({
        fullAddress: fullAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      });
      await customerApi.createAddress({
        label,
        fullAddress: fullAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        lat: coords?.lat,
        lng: coords?.lng,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not save address', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add Address</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>Label</Text>
        <View style={s.typeRow}>
          {LABELS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[s.typeChip, label === l && s.typeChipActive]}
              onPress={() => setLabel(l)}
            >
              <Text style={[s.typeText, label === l && s.typeTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Full Address *</Text>
        <TextInput
          style={[s.input, s.inputMultiline]}
          placeholder="House/flat no., building, street, area, landmark"
          placeholderTextColor={Colors.textSecondary}
          value={fullAddress}
          onChangeText={setFullAddress}
          multiline
          numberOfLines={3}
        />

        <Text style={s.label}>City *</Text>
        <TextInput
          style={s.input}
          placeholder="City"
          placeholderTextColor={Colors.textSecondary}
          value={city}
          onChangeText={setCity}
        />

        <Text style={s.label}>State *</Text>
        <TextInput
          style={s.input}
          placeholder="State"
          placeholderTextColor={Colors.textSecondary}
          value={state}
          onChangeText={setState}
        />

        <Text style={s.label}>Pincode *</Text>
        <TextInput
          style={s.input}
          placeholder="6-digit pincode"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          value={pincode}
          onChangeText={setPincode}
          maxLength={6}
        />
      </ScrollView>

      <View style={s.footer}>
        <BigButton label="Save Address" onPress={handleSave} loading={loading} disabled={!isValid} />
      </View>
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

  content: { flex: 1, padding: Spacing.lg },
  label: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  typeChipActive: { backgroundColor: Colors.organic, borderColor: Colors.organic },
  typeText: { ...Typography.bodySmall, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  typeTextActive: { color: Colors.white },

  footer: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
});
