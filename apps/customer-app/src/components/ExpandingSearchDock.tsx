import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Modal, ActivityIndicator, ScrollView, Platform, StatusBar, useWindowDimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  usePanelAnimation,
  useContentFadeIn, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

const DOCK_SIZE = 56;
const SEARCH_ROW_HEIGHT = 52;
const DEBOUNCE_MS = 300;
const DEFAULT_Y = 60;

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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const panelWidth = Math.min(480, screenWidth - Spacing.xl * 2);
  const panelHeight = Math.min(620, screenHeight * 0.85);

  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'web' ? 12 : (insets.top > 0 ? insets.top + 42 : 90);

  const { open: openProduct } = useProductSheet();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const originX = useSharedValue(screenWidth - Spacing.xl - DOCK_SIZE);
  const originY = useSharedValue(DEFAULT_Y);

  const triggerScale = useSharedValue(1);

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
    opacity: interpolate(anim.value, [0, 0.05], [1, 0]),
  }));

  const contentFade = useContentFadeIn(anim);

  // ── Start the spring ONLY after Modal is committed and visible ──
  const animationStarted = useRef(false);
  useEffect(() => {
    if (visible && !animationStarted.current) {
      animationStarted.current = true;
      requestAnimationFrame(() => {
        animOpen();
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      });
    }
    if (!visible) {
      animationStarted.current = false;
    }
  }, [visible, animOpen]);

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
    Keyboard.dismiss();
    triggerScale.value = withSpring(0.85, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y, width, height) => {
      console.log('[DEBUG] ExpandingSearchDock measured:', { x, y, width, height, OS: Platform.OS });
      originX.value = x;
      const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      originY.value = y + statusBarOffset;
      setTimeout(() => {
        setVisible(true);
        setExpanded(true);
      }, 50);
    });
  }, []);

  const finishClose = useCallback(() => {
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

  // ── Panel size + position ──
  // originX and originY are SharedValues — the worklet reads them directly
  // from the UI thread, always getting the latest measured position.
  const panelStyle = useAnimatedStyle(() => {
    const width = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelWidth, panelWidth]);
    const height = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelHeight * 0.4, panelHeight]);
    const desiredLeft = originX.value + DOCK_SIZE - panelWidth;
    const openX = Math.max(20, Math.min(screenWidth - panelWidth - 20, desiredLeft));
    const left = interpolate(anim.value, [0, 1], [originX.value, openX]);
    const top = interpolate(anim.value, [0, 1], [originY.value, safeTop]);
    return {
      left,
      top,
      width,
      height,
      borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
      backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
        [dockBg, 'rgba(250,249,246,0.95)', '#FAF9F6'],
      ),
    };
  }, [safeTop, screenWidth, screenHeight, panelWidth, panelHeight]);

  return (
    <>
      <Reanimated.View ref={dockRef} style={[styles.reserve, triggerAnimStyle]} collapsable={false}>
        <TouchableOpacity style={[styles.dock, { backgroundColor: dockBg }]} activeOpacity={1} onPress={open}>
          <Ionicons name="search" size={22} color={iconColor} />
        </TouchableOpacity>
      </Reanimated.View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop style={backdropStyle} onPress={close} />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          <Reanimated.View
            style={[styles.ghostWrap, triggerGhostStyle]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
          >
            <Ionicons name="search" size={22} color={iconColor} />
          </Reanimated.View>

          <Reanimated.View
            style={[StyleSheet.absoluteFill, contentFade]}
            pointerEvents={Platform.OS === 'web' ? undefined : (expanded ? 'auto' : 'none')}
          >
            <View style={Platform.OS === 'web' ? { flex: 1, pointerEvents: expanded ? 'auto' : 'none' as any } : { flex: 1 }}>
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
                  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
                    {results.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.suggestionRow}
                        onPress={() => handleSuggestionPress(item)}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.suggestionThumb, { backgroundColor: getStoreAccentDark(item.storeType) + '22' }]}>
                          <Ionicons name="leaf-outline" size={16} color={getStoreAccentDark(item.storeType)} />
                        </View>
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionName} numberOfLines={2}>{item.name}</Text>
                          <Text style={styles.suggestionUnit}>{item.unit}</Text>
                        </View>
                        <Text style={styles.suggestionPrice}>₹{Number(item.price).toFixed(0)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.landing}>
                  <Text style={styles.sectionTitle}>Shop by Store</Text>
                  <View style={styles.storeGrid}>
                    {STORE_SHORTCUTS.map((store) => (
                      <TouchableOpacity
                        key={store.type}
                        style={[styles.storeCard, { backgroundColor: getStoreAccentDark(store.type) }]}
                        activeOpacity={0.9}
                        onPress={() => handleStorePress(store.type)}
                      >
                        <Ionicons name={store.icon as any} size={22} color="rgba(255,255,255,0.5)" />
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.storeCardTag}>{store.tag}</Text>
                          <Text style={styles.storeCardLabel}>{getStoreLabel(store.type)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Popular Searches</Text>
                  <View style={styles.chipRow}>
                    {POPULAR_SEARCHES.map((term) => (
                      <TouchableOpacity key={term} style={styles.chip} onPress={() => handleChipPress(term)} activeOpacity={0.7}>
                        <Text style={styles.chipText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </View>
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
    position: 'absolute', top: 0, right: 0, width: DOCK_SIZE, height: DOCK_SIZE,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { pointerEvents: 'none' as any } }),
  },
  panel: { position: 'absolute', overflow: 'hidden', zIndex: 20 },
  panelShadow: Platform.select({
    web: {
      boxShadow: '0px 10px 40px rgba(10, 10, 8, 0.35)',
    },
    default: {
      shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
    },
  }) as any,
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.lg, paddingTop: 75, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchIcon: {},
  input: {
    flex: 1, ...Typography.body, color: Colors.text,
    borderWidth: 0, outlineStyle: 'none' as any, outlineWidth: 0,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
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
  suggestionName: { ...Typography.body, fontFamily: 'Inter_600SemiBold', color: Colors.text },
  suggestionUnit: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 1 },
  suggestionPrice: { ...Typography.body, fontFamily: 'Inter_600SemiBold', color: Colors.brass },
  landing: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl },
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
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
});
