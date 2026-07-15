import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { reverseGeocode, searchPlaces, PlaceSuggestion, ReverseGeocodeResult } from '../lib/geocode';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import BigButton from './BigButton';

const DEBOUNCE_MS = 400;
// Roughly a city-block zoom level — close enough to place a pin accurately,
// wide enough that the user isn't lost after a search jump.
const DEFAULT_DELTA = 0.01;
// Hyderabad, matching the zone-gated MVP launch city per CLAUDE.md — used only
// when GPS permission is denied/unavailable and the user hasn't searched yet.
const FALLBACK_CENTER = { latitude: 17.4483, longitude: 78.3915 };

interface AddressMapPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: ReverseGeocodeResult & { lat: number; lng: number }) => void;
}

export default function AddressMapPicker({ visible, onClose, onConfirm }: AddressMapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    ...FALLBACK_CENTER, latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA,
  });
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [preview, setPreview] = useState<ReverseGeocodeResult | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveTokenRef = useRef(0);

  // Center on the user's real location the moment the picker opens, rather
  // than always defaulting to the fallback city center.
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setSuggestions([]);
    handleUseCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const resolveCenter = async (lat: number, lng: number) => {
    const token = ++resolveTokenRef.current;
    setResolving(true);
    const result = await reverseGeocode(lat, lng);
    if (token !== resolveTokenRef.current) return; // a newer drag/search superseded this
    setResolving(false);
    setPreview(result);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        resolveCenter(region.latitude, region.longitude);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next: Region = {
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA,
      };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 400);
      resolveCenter(next.latitude, next.longitude);
    } catch {
      resolveCenter(region.latitude, region.longitude);
    } finally {
      setLocating(false);
    }
  };

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

  const handleSelectSuggestion = (place: PlaceSuggestion) => {
    Keyboard.dismiss();
    setSuggestions([]);
    setQuery(place.label);
    const next: Region = {
      latitude: place.lat, longitude: place.lng,
      latitudeDelta: DEFAULT_DELTA, longitudeDelta: DEFAULT_DELTA,
    };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 400);
    resolveCenter(place.lat, place.lng);
  };

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm({ ...preview, lat: region.latitude, lng: region.longitude });
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
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={Colors.organic} style={{ marginRight: Spacing.sm }} />}
        </View>

        {suggestions.length > 0 && (
          <FlatList
            style={s.suggestions}
            data={suggestions}
            keyExtractor={(item, i) => `${item.lat}-${item.lng}-${i}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={s.suggestionRow} onPress={() => handleSelectSuggestion(item)}>
                <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
                <Text style={s.suggestionText} numberOfLines={2}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={s.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
            onRegionChangeComplete={(r) => {
              setRegion(r);
              resolveCenter(r.latitude, r.longitude);
            }}
          />
          {/* Fixed center pin (Swiggy/Zomato pattern) — the map moves under it,
              so the pin never needs its own drag gesture handling. */}
          <View style={s.pinWrap} pointerEvents="none">
            <Ionicons name="location" size={40} color={Colors.organic} />
          </View>

          <TouchableOpacity
            style={s.locateBtn}
            onPress={handleUseCurrentLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={Colors.organic} />
            ) : (
              <Ionicons name="navigate" size={20} color={Colors.organic} />
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <View style={s.previewRow}>
            <Ionicons name="location-sharp" size={18} color={Colors.organic} />
            <Text style={s.previewText} numberOfLines={2}>
              {resolving ? 'Finding address...' : preview?.fullAddress || 'Move the map to place the pin'}
            </Text>
          </View>
          <BigButton
            label="Confirm Location"
            onPress={handleConfirm}
            disabled={resolving || !preview}
          />
        </View>
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
  searchInput: {
    flex: 1, ...Typography.body, color: Colors.text,
    paddingVertical: Spacing.sm,
  },

  suggestions: {
    maxHeight: 220, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  suggestionText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },

  mapWrap: { flex: 1 },
  pinWrap: {
    position: 'absolute', top: '50%', left: '50%',
    marginLeft: -20, marginTop: -40,
  },
  locateBtn: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.lg,
    width: 44, height: 44, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    ...Shadows.raised,
  },

  footer: {
    padding: Spacing.lg, paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.xxl,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  previewText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },
});
