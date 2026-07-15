import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocode, searchPlaces, PlaceSuggestion, ReverseGeocodeResult } from '../lib/geocode';
import { Colors, Typography, Spacing } from '../constants/theme';

const DEBOUNCE_MS = 400;

interface AddressMapPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: ReverseGeocodeResult & { lat: number; lng: number }) => void;
}

// Web fallback — react-native-maps has no web implementation (throws on
// import via codegenNativeComponent), so this swaps the pin-drop map for a
// search-and-select list: picking a result already carries lat/lng, so no
// visual map is actually needed to resolve coordinates. Metro resolves this
// file automatically for web builds; AddressMapPicker.tsx (with the live map)
// is used for iOS/Android.
export default function AddressMapPickerWeb({ visible, onClose, onConfirm }: AddressMapPickerProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchPlaces(text);
      setSearching(false);
      setSuggestions(results);
    }, DEBOUNCE_MS);
  };

  const handleSelect = async (place: PlaceSuggestion) => {
    setResolving(true);
    const details = await reverseGeocode(place.lat, place.lng);
    setResolving(false);
    onConfirm({
      fullAddress: details?.fullAddress || place.label,
      city: details?.city || '',
      state: details?.state || '',
      pincode: details?.pincode || '',
      lat: place.lat,
      lng: place.lng,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.searchBar}>
          <TouchableOpacity onPress={onClose} hitSlop={8} style={s.closeBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <TextInput
            style={s.searchInput}
            placeholder="Search for area, street, landmark..."
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={onChangeQuery}
            autoFocus
            returnKeyType="search"
          />
          {(searching || resolving) && <ActivityIndicator size="small" color={Colors.organic} style={{ marginRight: Spacing.sm }} />}
        </View>

        <View style={s.hintWrap}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.hintText}>Pin-drop map is available in the mobile app — search and select below on web.</Text>
        </View>

        <FlatList
          data={suggestions}
          keyExtractor={(item, i) => `${item.lat}-${item.lng}-${i}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={s.suggestionRow} onPress={() => handleSelect(item)} disabled={resolving}>
              <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
              <Text style={s.suggestionText} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { padding: Spacing.xs },
  searchInput: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: Spacing.sm },

  hintWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.organicLight,
  },
  hintText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },

  suggestionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  suggestionText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },
});
