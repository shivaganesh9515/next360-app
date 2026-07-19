import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Dimensions, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, interpolateColor, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../lib/api';
import { useProductSheet } from '../lib/productSheet';
import PopoverBackdrop from './PopoverBackdrop';
import { Product, StoreType } from '../types';
import {
  Colors, Spacing, Typography, BorderRadius,
  getStoreAccentDark, getStoreLabel,
} from '../constants/theme';
import {
  usePanelAnimation, PanelOrigin, StaggeredItem,
  useBodyStaggerStyle, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DOCK_SIZE = 36;
const PANEL_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const SEARCH_ROW_HEIGHT = 52;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.68;
const DEBOUNCE_MS = 300;

const STORE_SHORTCUTS: { type: StoreType; tag: string; icon: string }[] = [
  { type: StoreType.ORGANIC, tag: 'CURATED', icon: 'leaf' },
  { type: StoreType.NATURAL, tag: 'ARTISANAL', icon: 'flower' },
  { type: StoreType.ECO_FRIENDLY, tag: 'SUSTAINABLE', icon: 'earth' },
];

const POPULAR_SEARCHES = [
  'Organic Rice', 'Cold-Pressed Oil', 'Raw Honey', 'Herbal Tea',
  'Millet Snacks', 'Bamboo Utensils', 'Natural Soap',
];

interface Props {
  onSearch?: (query: string) => void;
  placeholder?: string;
  accent?: string;
  iconColor?: string;
  dockBg?: string;
  navigation?: any;
}

export default function ExpandingSearchDock({
  onSearch,
  placeholder = 'Search...',
  accent = Colors.text,
  iconColor = Colors.white,
  dockBg = 'rgba(255,255,255,0.12)',
  navigation,
}: Props) {
  const { open: openProduct } = useProductSheet();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Trigger press scale ──
  const triggerScale = useSharedValue(1);
  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const bodyStyle = useBodyStaggerStyle(anim);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.getProducts({ search: text.trim(), limit: 8 });
      setResults(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  const onChangeText = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  }, [runSearch]);

  const open = useCallback(() => {
    // Press feedback — scale down then snap back
    triggerScale.value = withSpring(0.85, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y) => {
      const origin: PanelOrigin = { x, y, width: DOCK_SIZE, height: DOCK_SIZE };
      setVisible(true);
      setExpanded(true);
      requestAnimationFrame(() => {
        animOpen(origin);
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      });
    });
  }, [animOpen]);

  const finishClose = useCallback(() => {
    Keyboard.dismiss();
    setExpanded(false);
    setVisible(false);
    setQuery('');
    setResults([]);
    setSearched(false);
  }, []);

  const close = useCallback(() => {
    Keyboard.dismiss();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    animClose(finishClose);
  }, [animClose]);

  const submit = useCallback(() => {
    const trimmed = query.trim();
    if (onSearch && trimmed) {
      onSearch(trimmed);
      close();
    } else {
      Keyboard.dismiss();
    }
  }, [query, onSearch, close]);

  const handleSuggestionPress = useCallback((product: Product) => {
    openProduct(product.id);
    close();
  }, [openProduct, close]);

  const handleStorePress = useCallback((storeType: StoreType) => {
    navigation?.navigate?.('AllProducts', { storeType });
    close();
  }, [navigation, close]);

  const handleChipPress = useCallback((term: string) => {
    setQuery(term);
    runSearch(term);
  }, [runSearch]);

  const showSuggestions = query.trim().length > 0;

  // ── Panel size (expand-in-place from nav dock) ──
  const panelSizeStyle = useAnimatedStyle(() => ({
    right: Spacing.xl + DOCK_SIZE / 2,
    width: interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, PANEL_WIDTH, PANEL_WIDTH]),
    height: interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, DOCK_SIZE * 3, PANEL_HEIGHT]),
    borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
    backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
      [dockBg, 'rgba(255,255,255,0.95)', Colors.white],
    ),
  }));

  return (
    <>
      <Reanimated.View ref={dockRef} style={[styles.reserve, triggerAnimStyle]} collapsable={false}>
        <TouchableOpacity style={[styles.dock, { backgroundColor: dockBg }]} activeOpacity={1} onPress={open}>
          <Ionicons name="search" size={17} color={iconColor} />
        </TouchableOpacity>
      </Reanimated.View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop style={backdropStyle} onPress={close} />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelSizeStyle]}>
          {/* Trigger ghost — fades out as panel opens */}
          <Reanimated.View style={[styles.ghostWrap, triggerGhostStyle, { pointerEvents: 'none' }]}>
            <Ionicons name="search" size={17} color={iconColor} />
          </Reanimated.View>

          {/* Content — staggers in */}
          <Reanimated.View style={[StyleSheet.absoluteFill, bodyStyle, { pointerEvents: expanded ? 'auto' : 'none' }]}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.textSecondary}
                autoFocus={expanded}
                returnKeyType="search"
                onSubmitEditing={submit}
                underlineColorAndroid="transparent"
                selectionColor={accent}
              />
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: accent }]} onPress={close}>
                <Ionicons name="close" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {showSuggestions ? (
              loading ? (
                <View style={styles.center}><ActivityIndicator size="small" color={accent} /></View>
              ) : searched && results.length === 0 ? (
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No results for &quot;{query}&quot;</Text>
                </View>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {results.map((item, idx) => (
                    <StaggeredItem key={item.id} anim={anim} index={idx}>
                      <TouchableOpacity
                        style={styles.suggestionRow}
                        onPress={() => handleSuggestionPress(item)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.suggestionThumb, { backgroundColor: getStoreAccentDark(item.storeType) + '22' }]}>
                          <Ionicons name="leaf-outline" size={16} color={getStoreAccentDark(item.storeType)} />
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.suggestionUnit}>{item.unit}</Text>
                        </View>
                        <Text style={styles.suggestionPrice}>₹{Number(item.price).toFixed(0)}</Text>
                      </TouchableOpacity>
                    </StaggeredItem>
                  ))}
                </ScrollView>
              )
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.landing}>
                <Text style={styles.sectionTitle}>Shop by Store</Text>
                <View style={styles.storeGrid}>
                  {STORE_SHORTCUTS.map((store, idx) => (
                    <StaggeredItem key={store.type} anim={anim} index={idx}>
                      <TouchableOpacity
                        style={[styles.storeCard, { backgroundColor: getStoreAccentDark(store.type) }]}
                        activeOpacity={0.9}
                        onPress={() => handleStorePress(store.type)}
                      >
                        <Ionicons name={store.icon as any} size={22} color="rgba(255,255,255,0.5)" />
                        <View>
                          <Text style={styles.storeCardTag}>{store.tag}</Text>
                          <Text style={styles.storeCardLabel}>{getStoreLabel(store.type)}</Text>
                        </View>
                      </TouchableOpacity>
                    </StaggeredItem>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Popular Searches</Text>
                <View style={styles.chipRow}>
                  {POPULAR_SEARCHES.map((term, idx) => (
                    <StaggeredItem key={term} anim={anim} index={idx + 3}>
                      <TouchableOpacity style={styles.chip} onPress={() => handleChipPress(term)} activeOpacity={0.7}>
                        <Text style={styles.chipText}>{term}</Text>
                      </TouchableOpacity>
                    </StaggeredItem>
                  ))}
                </View>
              </ScrollView>
            )}
          </Reanimated.View>
        </Reanimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reserve: { width: DOCK_SIZE, height: DOCK_SIZE },
  dock: {
    width: DOCK_SIZE, height: DOCK_SIZE, borderRadius: DOCK_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  ghostWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  panel: { position: 'absolute', overflow: 'hidden', zIndex: 20 },
  panelShadow: {
    shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: SEARCH_ROW_HEIGHT, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchIcon: {},
  input: {
    flex: 1, ...Typography.bodySmall, color: Colors.text,
    borderWidth: 0, outlineStyle: 'none' as any, outlineWidth: 0,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  center: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { ...Typography.bodySmall, color: Colors.textSecondary },
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
  landing: { padding: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  storeGrid: { gap: Spacing.md, marginBottom: Spacing.xl },
  storeCard: {
    height: 80, borderRadius: BorderRadius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  storeCardTag: {
    ...Typography.caption, color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, textAlign: 'right',
  },
  storeCardLabel: { ...Typography.h3, color: Colors.white, textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
});
