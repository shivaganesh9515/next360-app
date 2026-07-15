import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { geocodeAddress, ReverseGeocodeResult } from '../../lib/geocode';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';
import AddressMapPicker from '../../components/AddressMapPicker';

const LABELS = ['Home', 'Work', 'Other'];

export default function AddAddressScreen({ navigation }: any) {
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  // Set only by the map picker, cleared the moment the user hand-edits a
  // field afterwards — a stale pin's coordinates shouldn't get attached to
  // text the user then changed by hand.
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const isValid = fullAddress.trim() && city.trim() && state.trim() && pincode.trim().length === 6;

  const withEditReset = (setter: (v: string) => void) => (v: string) => {
    setPickedCoords(null);
    setter(v);
  };

  const handleMapConfirm = (result: ReverseGeocodeResult & { lat: number; lng: number }) => {
    setFullAddress(result.fullAddress);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    if (result.pincode) setPincode(result.pincode);
    setPickedCoords({ lat: result.lat, lng: result.lng });
    setMapVisible(false);
  };

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Missing details', 'Fill in the address, city, state, and a 6-digit pincode.');
      return;
    }
    setLoading(true);
    try {
      // Prefer the map pin's exact coordinates when available — falls back to
      // forward-geocoding the typed text so every consumer of this address
      // (Order Tracking's map, delivery ETA, etc.) still gets a real lat/lng
      // even if the user never opened the map picker. Best-effort either way —
      // a failed/slow geocode still saves the address by text.
      const coords = pickedCoords || await geocodeAddress({
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

        <TouchableOpacity style={s.mapPickerBtn} onPress={() => setMapVisible(true)}>
          <Ionicons name="location" size={18} color={Colors.organic} />
          <Text style={s.mapPickerText}>
            {pickedCoords ? 'Location pinned — tap to change' : 'Set location on map'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Text style={s.label}>Full Address *</Text>
        <TextInput
          style={[s.input, s.inputMultiline]}
          placeholder="House/flat no., building, street, area, landmark"
          placeholderTextColor={Colors.textSecondary}
          value={fullAddress}
          onChangeText={withEditReset(setFullAddress)}
          multiline
          numberOfLines={3}
        />

        <Text style={s.label}>City *</Text>
        <TextInput
          style={s.input}
          placeholder="City"
          placeholderTextColor={Colors.textSecondary}
          value={city}
          onChangeText={withEditReset(setCity)}
        />

        <Text style={s.label}>State *</Text>
        <TextInput
          style={s.input}
          placeholder="State"
          placeholderTextColor={Colors.textSecondary}
          value={state}
          onChangeText={withEditReset(setState)}
        />

        <Text style={s.label}>Pincode *</Text>
        <TextInput
          style={s.input}
          placeholder="6-digit pincode"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="numeric"
          value={pincode}
          onChangeText={withEditReset(setPincode)}
          maxLength={6}
        />
      </ScrollView>

      <View style={s.footer}>
        <BigButton label="Save Address" onPress={handleSave} loading={loading} disabled={!isValid} />
      </View>

      <AddressMapPicker
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={handleMapConfirm}
      />
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

  mapPickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.lg, padding: Spacing.md,
    backgroundColor: Colors.organicLight, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  mapPickerText: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', flex: 1 },

  footer: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
});
