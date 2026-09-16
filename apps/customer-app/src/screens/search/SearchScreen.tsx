import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
  Animated, Keyboard, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { customerApi } from '../../lib/api';
import { Product, StoreType, Category } from '../../types';
import {
  Colors, Typography, Spacing, BorderRadius, Shadows,
  getStoreAccent, getStoreAccentDark, getStoreLabel,
} from '../../constants/theme';
import { useTranslation } from 'react-i18next';

const DEBOUNCE_MS = 350;

// Landing-state content — shown before the user has typed anything.
const STORE_SHORTCUTS: { type: StoreType; tag: string; icon: string }[] = [
  { type: StoreType.ORGANIC, tag: 'ORGANIC', icon: 'leaf' },
  { type: StoreType.NATURAL, tag: 'NATURAL', icon: 'flower' },
  { type: StoreType.ECO_FRIENDLY, tag: 'ECO-FRIENDLY', icon: 'earth' },
];

const POPULAR_SEARCHES = [
  'Organic Rice', 'Cold-Pressed Oil', 'Raw Honey', 'Herbal Tea',
  'Millet Snacks', 'Bamboo Utensils', 'Natural Soap',
];

const STORE_FILTER_OPTIONS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Organic', value: 'ORGANIC' },
  { label: 'Natural', value: 'NATURAL' },
  { label: 'Eco-Friendly', value: 'ECO_FRIENDLY' },
];

const PRICE_RANGE_OPTIONS: { label: string; min: number; max?: number }[] = [
  { label: 'Under ₹200', min: 0, max: 200 },
  { label: '₹200 – ₹500', min: 200, max: 500 },
  { label: '₹500 – ₹1000', min: 500, max: 1000 },
  { label: 'Above ₹1000', min: 1000 },
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

  // Filter state — the search filters operate on the full product results
  // (client-side refinement on top of the server query) rather than
  // re-querying, matching how ProductListScreen handles price/stock/rating
  // filters.
  const [showFilters, setShowFilters] = useState(false);
  const [filterStoreType, setFilterStoreType] = useState<string | undefined>();
  const [filterPriceRange, setFilterPriceRange] = useState<{ min: number; max?: number } | null>(null);
  const [filterMinRating, setFilterMinRating] = useState<number | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterCategoryId, setFilterCategoryId] = useState<string | undefined>();

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

  // Client-side filtering — refines whatever search results are already
  // loaded, matching how ProductListScreen applies price/rating/stock
  // filters locally instead of re-querying.
  const filteredResults = useMemo(() => {
    return results.filter((p) => {
      if (filterStoreType && p.storeType !== filterStoreType) return false;
      if (filterCategoryId && p.categoryId !== filterCategoryId) return false;
      if (filterPriceRange) {
        const price = Number(p.price);
        if (price < filterPriceRange.min) return false;
        if (filterPriceRange.max !== undefined && price > filterPriceRange.max) return false;
      }
      if (filterMinRating && (p.rating || 0) < filterMinRating) return false;
      return true;
    });
  }, [results, filterStoreType, filterCategoryId, filterPriceRange, filterMinRating]);

  // Count how many active filters are applied — shown as a badge on the
  // filter button so there's always a visible cue that something's active.
  const activeFilterCount = [
    filterStoreType,
    filterCategoryId,
    filterPriceRange ? true : null,
    filterMinRating,
  ].filter(Boolean).length;

  // Load categories for filter panel
  useEffect(() => {
    customerApi.getCategories({ storeType: filterStoreType || storeType })
      .then((res: any) => setCategories(Array.isArray(res) ? res : res?.data || []))
      .catch(() => {});
  }, [filterStoreType, storeType]);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  };

  const handleSuggestionPress = (product: Product) => {
    openProduct(product.id);
  };

  const clearFilters = () => {
    setFilterStoreType(undefined);
    setFilterCategoryId(undefined);
    setFilterPriceRange(null);
    setFilterMinRating(undefined);
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
        <TouchableOpacity style={[s.filterBtn, { backgroundColor: accent }]} hitSlop={8} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={18} color={Colors.white} />
          {activeFilterCount > 0 && (
            <View style={s.filterBadge}>
              <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
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
                {filteredResults.map((item) => (
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
            {/* Active filter chips — shown below the search popup when filters
                are applied, so the user can see at a glance what's active and
                tap to clear a specific filter. */}
            {activeFilterCount > 0 && searched && filteredResults.length > 0 && (
              <View style={s.activeFilters}>
                {!!filterStoreType && (
                  <TouchableOpacity style={s.activeFilterChip} onPress={() => setFilterStoreType(undefined)}>
                    <Text style={s.activeFilterLabel}>{filterStoreType}</Text>
                    <Ionicons name="close" size={12} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
                {!!filterCategoryId && categories.find((c) => c.id === filterCategoryId) && (
                  <TouchableOpacity style={s.activeFilterChip} onPress={() => setFilterCategoryId(undefined)}>
                    <Text style={s.activeFilterLabel}>{categories.find((c) => c.id === filterCategoryId)!.name}</Text>
                    <Ionicons name="close" size={12} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
                {!!filterPriceRange && (
                  <TouchableOpacity style={s.activeFilterChip} onPress={() => setFilterPriceRange(null)}>
                    <Text style={s.activeFilterLabel}>
                      {PRICE_RANGE_OPTIONS.find((o) => o.min === filterPriceRange.min)?.label || 'Price'}
                    </Text>
                    <Ionicons name="close" size={12} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
                {!!filterMinRating && (
                  <TouchableOpacity style={s.activeFilterChip} onPress={() => setFilterMinRating(undefined)}>
                    <Text style={s.activeFilterLabel}>&#9733; {filterMinRating}+</Text>
                    <Ionicons name="close" size={12} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>
        </>
      )}

      {/* Filter Modal — slides up from the bottom when the filter button is
          tapped. Contains store type, category, price range, and rating
          options to refine search results client-side. */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <View style={[s.filterPanel, Shadows.raised]}>
          <View style={s.filterHandle} />
          <View style={s.filterHeader}>
            <Text style={s.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={[s.clearAllText, { color: accent }]}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Store Type */}
            <Text style={s.filterLabel}>Store Type</Text>
            <View style={s.filterChips}>
              {STORE_FILTER_OPTIONS.map((opt) => {
                const active = filterStoreType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[s.filterChip, active && { backgroundColor: accent }]}
                    onPress={() => setFilterStoreType(opt.value)}
                  >
                    <Text style={[s.filterChipText, active && { color: Colors.white }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Category */}
            <Text style={s.filterLabel}>Category</Text>
            <View style={s.filterChips}>
              <TouchableOpacity
                style={[s.filterChip, !filterCategoryId && { backgroundColor: accent }]}
                onPress={() => setFilterCategoryId(undefined)}
              >
                <Text style={[s.filterChipText, !filterCategoryId && { color: Colors.white }]}>All</Text>
              </TouchableOpacity>
              {categories.map((cat) => {
                const active = filterCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.filterChip, active && { backgroundColor: accent }]}
                    onPress={() => setFilterCategoryId(cat.id)}
                  >
                    <Text style={[s.filterChipText, active && { color: Colors.white }]}>{cat.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price Range */}
            <Text style={s.filterLabel}>Price Range</Text>
            <View style={s.filterChips}>
              {PRICE_RANGE_OPTIONS.map((opt) => {
                const active = filterPriceRange?.min === opt.min && filterPriceRange?.max === opt.max;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[s.filterChip, active && { backgroundColor: accent }]}
                    onPress={() => setFilterPriceRange(active ? null : opt)}
                  >
                    <Text style={[s.filterChipText, active && { color: Colors.white }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Minimum Rating */}
            <Text style={s.filterLabel}>Minimum Rating</Text>
            <View style={s.filterChips}>
              <TouchableOpacity
                style={[s.filterChip, !filterMinRating && { backgroundColor: accent }]}
                onPress={() => setFilterMinRating(undefined)}
              >
                <Text style={[s.filterChipText, !filterMinRating && { color: Colors.white }]}>Any</Text>
              </TouchableOpacity>
              {[4, 3].map((n) => {
                const active = filterMinRating === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[s.filterChip, active && { backgroundColor: accent }]}
                    onPress={() => setFilterMinRating(active ? undefined : n)}
                  >
                    <Text style={[s.filterChipText, active && { color: Colors.white }]}>
                      <Ionicons name="star" size={11} color={active ? Colors.white : Colors.textSecondary} /> {n}+
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[s.applyBtn, { backgroundColor: accent }]}
            onPress={() => setShowFilters(false)}
          >
            <Text style={s.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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

  // Filter badge on the filter button — a small dot with count so there's
  // always a visible cue that something's active.
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.white,
  },
  filterBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: Colors.white },

  // Active filter chips displayed within the popup — compact removable pills.
  activeFilters: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  activeFilterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.border + '88',
  },
  activeFilterLabel: { ...Typography.caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },

  // Filter Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(28,27,23,0.35)' },
  filterPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '75%', backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    paddingBottom: 34,
  },
  filterHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: Spacing.sm,
  },
  filterHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  filterTitle: { ...Typography.h2, color: Colors.text },
  clearAllText: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold' },
  filterLabel: {
    ...Typography.caption, color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xl, marginTop: Spacing.md,
  },
  filterChips: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  filterChipText: { ...Typography.caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  applyBtn: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg, height: 50,
    borderRadius: BorderRadius.pill, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { ...Typography.button, color: Colors.white },
});
