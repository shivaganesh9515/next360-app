import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../lib/api';
import { geocodeAddress, ReverseGeocodeResult } from '../../lib/geocode';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';
import AddressMapPicker from '../../components/AddressMapPicker';

const LABELS = [
  { key: 'Home', icon: 'home-outline' },
  { key: 'Work', icon: 'briefcase-outline' },
  { key: 'Other', icon: 'location-outline' },
];

export default function AddAddressScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
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
      Alert.alert('Missing Details', 'Please fill in address, city, state, and 6-digit pincode.');
      return;
    }
    setLoading(true);
    try {
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
      Alert.alert(t('addAddress.alert.saveError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Add New Address</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Map Picker Card */}
        <TouchableOpacity style={s.mapCard} onPress={() => setMapVisible(true)} activeOpacity={0.85}>
          <View style={s.mapIconBox}>
            <Ionicons name="location" size={20} color="#2E7D32" />
          </View>
          <View style={s.mapTextWrap}>
            <Text style={s.mapTitle}>
              {pickedCoords ? 'Pin Location Set on Map' : 'Select Location on Live Map'}
            </Text>
            <Text style={s.mapSub}>
              {pickedCoords ? 'Tap to adjust pin location' : 'Auto-fill street, city & pincode'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#757575" />
        </TouchableOpacity>

        {/* Tag Selector */}
        <Text style={s.sectionTitle}>SAVE ADDRESS AS</Text>
        <View style={s.tagRow}>
          {LABELS.map((item) => {
            const active = label === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[s.tagChip, active && s.tagChipActive]}
                onPress={() => setLabel(item.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={16} color={active ? '#0A0A0A' : '#757575'} />
                <Text style={[s.tagText, active && s.tagTextActive]}>{item.key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Details Form Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>DELIVERY ADDRESS DETAILS</Text>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Flat, House No., Building & Street</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="e.g. Flat 402, Sunshine Apartments, Green Street"
              placeholderTextColor="#9E9E9E"
              value={fullAddress}
              onChangeText={withEditReset(setFullAddress)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={s.rowFields}>
            <View style={[s.fieldGroup, { flex: 1 }]}>
              <Text style={s.label}>City</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Hyderabad"
                placeholderTextColor="#9E9E9E"
                value={city}
                onChangeText={withEditReset(setCity)}
              />
            </View>

            <View style={[s.fieldGroup, { flex: 1 }]}>
              <Text style={s.label}>State</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Telangana"
                placeholderTextColor="#9E9E9E"
                value={state}
                onChangeText={withEditReset(setState)}
              />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Pincode (6 digits)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 500081"
              placeholderTextColor="#9E9E9E"
              keyboardType="numeric"
              value={pincode}
              onChangeText={withEditReset(setPincode)}
              maxLength={6}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Save Button */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, (!isValid || loading) && s.disabledBtn]}
          onPress={handleSave}
          disabled={!isValid || loading}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>{loading ? 'Saving Address...' : 'Save & Proceed'}</Text>
        </TouchableOpacity>
      </View>

      <AddressMapPicker
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={handleMapConfirm}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.text },

  content: { padding: Spacing.lg },

  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  mapIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mapTextWrap: { flex: 1 },
  mapTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#1B5E20' },
  mapSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#2E7D32', marginTop: 1 },

  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#757575',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },

  tagRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  tagChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  tagChipActive: {
    backgroundColor: Colors.organic,
    borderColor: Colors.organic,
  },
  tagText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#757575' },
  tagTextActive: { color: Colors.white },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.lg,
  },

  fieldGroup: { marginBottom: Spacing.lg },
  rowFields: { flexDirection: 'row', gap: 10 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.text, marginBottom: 6 },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 48,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
  },
  inputMultiline: { minHeight: 76, paddingVertical: 10, textAlignVertical: 'top' },

  footer: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  saveBtn: {
    backgroundColor: '#0A0A0A',
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.organic,
  },
  disabledBtn: { opacity: 0.5 },
  saveBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.white },
});
