import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  Animated, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { customerApi } from '../../lib/api';
import { Product, StoreType } from '../../types';
import {
  Colors, Typography, Spacing, BorderRadius, Shadows,
  getStoreAccent, getStoreAccentDark, getStoreLabel,
} from '../../constants/theme';
import { useTranslation } from 'react-i18next';

const DEBOUNCE_MS = 350;

// Landing-state content — shown before the user has typed anything.
const STORE_SHORTCUTS: { type: StoreType; tag: string; icon: string }[] = [
  { type: StoreType.ORGANIC, tag: 'CURATED', icon: 'leaf' },
  { type: StoreType.NATURAL, tag: 'ARTISANAL', icon: 'flower' },
  { type: StoreType.ECO_FRIENDLY, tag: 'SUSTAINABLE', icon: 'earth' },
];

const POPULAR_SEARCHES = [
  'Organic Rice', 'Cold-Pressed Oil', 'Raw Honey', 'Herbal Tea',
  'Millet Snacks', 'Bamboo Utensils', 'Natural Soap',
];

export default function SearchScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { storeType } = useStore();
  const { open: openProduct } = useProductSheet();
  const initialQuery: string = route?.params?.initialQuery ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const popupAnim = useRef(new Animated.Value(0)).current;
  const [popupVisible, setPopupVisible] = useState(false);

  const accent = getStoreAccent(storeType);
  const showPopup = query.trim().length > 0;

  const storeTagMap: Record<string, string> = {
    [StoreType.ORGANIC]: t('search.store.organic.tag'),
    [StoreType.NATURAL]: t('search.store.natural.tag'),
    [StoreType.ECO_FRIENDLY]: t('search.store.eco.tag'),
  };

  useEffect(() => {
    if (showPopup) setPopupVisible(true);
    Animated.spring(popupAnim, {
      toValue: showPopup ? 1 : 0,
      useNativeDriver: true,
      friction: 10,
      tension: 90,
    }).start(({ finished }) => {
      if (finished && !showPopup) setPopupVisible(false);
    });
  }, [showPopup]);

  useEffect(() => {
    if (initialQuery) {
      runSearch(initialQuery);
    } else {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.getProducts({ search: text.trim(), storeType, limit: 8 });
      setResults(Array.isArray(res) ? res : (res as any)?.data || []);
      setSearchError(false);
    } catch {
      setResults([]);
      setSearchError(true);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [storeType]);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  };

  const handleSuggestionPress = (product: Product) => {
    openProduct(product.id);
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={query}
            onChangeText={onChangeText}
            placeholder={t('search.placeholder')}
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
          />
          {!!query && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }} hitSlop={8}>
              <Text style={s.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[s.filterBtn, { backgroundColor: accent }]} hitSlop={8}>
          <Ionicons name="options-outline" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Landing content always sits underneath — it's what you see once the
          popup below closes (query cleared), not a separate page state. */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.landing}>
        <Text style={s.landingHeadline}>{t('search.landing.headline')}</Text>

        <Text style={s.sectionTitle}>{t('search.section.shopByStore')}</Text>
        <View style={s.storeGrid}>
          {STORE_SHORTCUTS.map((store) => (
            <TouchableOpacity
              key={store.type}
              style={[s.storeCard, Shadows.card, { backgroundColor: getStoreAccentDark(store.type) }]}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AllProducts', { storeType: store.type })}
            >
              <Ionicons name={store.icon as any} size={26} color="rgba(255,255,255,0.5)" />
              <View>
                <Text style={s.storeCardTag}>{storeTagMap[store.type]}</Text>
                <Text style={s.storeCardLabel}>{getStoreLabel(store.type)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>{t('search.section.popularSearches')}</Text>
        <View style={s.chipRow}>
          {POPULAR_SEARCHES.map((term) => (
            <TouchableOpacity
              key={term}
              style={s.chip}
              onPress={() => { setQuery(term); runSearch(term); }}
            >
              <Text style={s.chipText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating suggestions popup — pops in over the landing content as you
          type, instead of the whole screen silently swapping to a plain grid. */}
      {popupVisible && (
        <>
          <TouchableOpacity
            style={s.popupBackdrop}
            activeOpacity={1}
            onPress={() => Keyboard.dismiss()}
          />
          <Animated.View
            style={[
              s.popup, Shadows.raised,
              {
                opacity: popupAnim,
                transform: [
                  { translateY: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
                  { scale: popupAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
                ],
              },
            ]}
          >
            {loading ? (
              <View style={s.popupCenter}><ActivityIndicator size="small" color={accent} /></View>
            ) : searchError ? (
              <View style={s.popupCenter}>
                <Text style={s.emptyTitle}>{t('search.error.title')}</Text>
                <TouchableOpacity onPress={() => runSearch(query)}>
                  <Text style={[s.hintText, { color: accent, fontFamily: 'Inter_600SemiBold' }]}>{t('common.tapToRetry')}</Text>
                </TouchableOpacity>
              </View>
            ) : searched && results.length === 0 ? (
              <View style={s.popupCenter}>
                <Text style={s.emptyTitle}>{t('search.empty.noResults', { query })}</Text>
                <Text style={s.hintText}>{t('search.empty.hint')}</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {results.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={s.suggestionRow}
                    onPress={() => handleSuggestionPress(item)}
                  >
                    <View style={[s.suggestionThumb, { backgroundColor: getStoreAccentDark(item.storeType) + '22' }]}>
                      <Ionicons name="leaf-outline" size={16} color={getStoreAccentDark(item.storeType)} />
                    </View>
                    <View style={s.suggestionInfo}>
                      <Text style={s.suggestionName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.suggestionUnit}>{item.unit}</Text>
                    </View>
                    <Text style={s.suggestionPrice}>₹{Number(item.price).toFixed(0)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backIcon: { fontSize: 22, color: Colors.text },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, height: 46, paddingHorizontal: Spacing.md,
  },
  searchIcon: { fontSize: 15, opacity: 0.5 },
  // outlineStyle/outlineWidth are web-only (react-native-web) — without them the
  // browser draws its own default black focus ring around the <input>.
  input: {
    flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 0,
    borderWidth: 0, outlineStyle: 'none' as any, outlineWidth: 0,
  },
  clearIcon: { fontSize: 14, color: Colors.textSecondary },
  filterBtn: {
    width: 46, height: 46, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },

  hintText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },

  // Floating suggestions popup — overlays the landing content as you type,
  // instead of the whole screen swapping to a plain in-page grid.
  popupBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(28,27,23,0.25)', zIndex: 10,
  },
  popup: {
    position: 'absolute', top: 68, left: Spacing.lg, right: Spacing.lg,
    maxHeight: 360, backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    overflow: 'hidden', zIndex: 20,
  },
  popupCenter: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  suggestionThumb: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionInfo: { flex: 1 },
  suggestionName: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  suggestionUnit: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
  suggestionPrice: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.brass },

  // Landing state — shown before the user has typed anything.
  landing: { padding: Spacing.lg },
  landingHeadline: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },

  storeGrid: { gap: Spacing.md, marginBottom: Spacing.xl },
  storeCard: {
    height: 96, borderRadius: BorderRadius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  storeCardTag: {
    ...Typography.caption, color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, textAlign: 'right',
  },
  storeCardLabel: { ...Typography.h2, color: Colors.white, textAlign: 'right' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
});
