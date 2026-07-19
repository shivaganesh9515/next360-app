import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Dimensions, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolate, interpolateColor, runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../lib/api';
import { useProductSheet } from '../lib/productSheet';
import PopoverBackdrop from './PopoverBackdrop';
import { Product, StoreType } from '../types';
import {
  Colors, Spacing, Typography, BorderRadius, REANIMATED_SPRING_CONFIG,
  getStoreAccentDark, getStoreLabel,
} from '../constants/theme';

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

// Springs open from wherever the collapsed dock actually sits (measured live)
// and travels up to just below the status bar, growing into a full mini search
// experience — not just a bare input. Empty query shows the same "Shop by
// Store" + "Popular Searches" landing content as the full Search screen;
// typing shows live matching products. Tapping a suggestion opens it directly.
export default function ExpandingSearchDock({
  onSearch,
  placeholder = 'Search...',
  accent = Colors.text,
  iconColor = Colors.white,
  dockBg = 'rgba(255,255,255,0.12)',
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const { open: openProduct } = useProductSheet();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [origin, setOrigin] = useState({ x: SCREEN_WIDTH - Spacing.xl - DOCK_SIZE, y: 100 });
  const anim = useSharedValue(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topTarget = insets.top + Spacing.md;

  const runSearch = async (text: string) => {
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
  };

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  };

  const open = () => {
    dockRef.current?.measureInWindow((x, y) => {
      setOrigin({ x, y });
      setVisible(true);
      setExpanded(true);
      requestAnimationFrame(() => {
        anim.value = withSpring(1, REANIMATED_SPRING_CONFIG);
      });
    });
  };

  const close = () => {
    Keyboard.dismiss();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const finishClose = () => {
      setExpanded(false);
      setVisible(false);
      setQuery('');
      setResults([]);
      setSearched(false);
    };
    anim.value = withSpring(0, REANIMATED_SPRING_CONFIG, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const submit = () => {
    const trimmed = query.trim();
    if (onSearch && trimmed) {
      onSearch(trimmed);
      close();
    } else {
      Keyboard.dismiss();
    }
  };

  const handleSuggestionPress = (product: Product) => {
    openProduct(product.id);
    close();
  };

  const handleStorePress = (storeType: StoreType) => {
    navigation?.navigate?.('AllProducts', { storeType });
    close();
  };

  const handleChipPress = (term: string) => {
    setQuery(term);
    runSearch(term);
  };

  // Combined into useAnimatedStyle blocks (Reanimated, UI-thread) instead of
  // the classic Animated API's useNativeDriver:false — top/left/width/height/
  // borderRadius can't run on the native thread with the old API, so every
  // frame previously required a JS-bridge round trip, which is what made this
  // (and the other three expand-in-place popovers) feel laggy on real devices.
  const backdropStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  const panelStyle = useAnimatedStyle(() => ({
    top: interpolate(anim.value, [0, 1], [origin.y, topTarget]),
    left: interpolate(anim.value, [0, 1], [origin.x, Spacing.xl]),
    width: interpolate(anim.value, [0, 1], [DOCK_SIZE, PANEL_WIDTH]),
    height: interpolate(anim.value, [0, 1], [DOCK_SIZE, PANEL_HEIGHT]),
    borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
    // Interpolated in lockstep with the shrink/grow instead of snapping between
    // dockBg and white at the end — that boolean snap was showing a plain white
    // circle for a frame right as it collapsed back into the nav bar.
    backgroundColor: interpolateColor(anim.value, [0, 1], [dockBg, Colors.white]),
  }));
  const iconOnlyStyle = useAnimatedStyle(() => ({ opacity: interpolate(anim.value, [0, 0.35, 1], [1, 0, 0]) }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: interpolate(anim.value, [0, 0.6, 1], [0, 0, 1]) }));

  const showSuggestions = query.trim().length > 0;

  return (
    <>
      <View ref={dockRef} style={styles.reserve} collapsable={false}>
        <TouchableOpacity style={[styles.dock, { backgroundColor: dockBg }]} activeOpacity={0.7} onPress={open}>
          <Ionicons name="search" size={17} color={iconColor} />
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop
          style={[styles.backdrop, backdropStyle]}
          pointerEvents={expanded ? 'auto' : 'none'}
          onPress={close}
        />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          <Reanimated.View style={[styles.iconOnly, iconOnlyStyle]} pointerEvents="none">
            <Ionicons name="search" size={17} color={iconColor} />
          </Reanimated.View>

          <Reanimated.View style={[styles.content, contentStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
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
                  <Text style={styles.emptyText}>No results for "{query}"</Text>
                </View>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {results.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.suggestionRow}
                      onPress={() => handleSuggestionPress(item)}
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
                      <View>
                        <Text style={styles.storeCardTag}>{store.tag}</Text>
                        <Text style={styles.storeCardLabel}>{getStoreLabel(store.type)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Popular Searches</Text>
                <View style={styles.chipRow}>
                  {POPULAR_SEARCHES.map((term) => (
                    <TouchableOpacity key={term} style={styles.chip} onPress={() => handleChipPress(term)}>
                      <Text style={styles.chipText}>{term}</Text>
                    </TouchableOpacity>
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
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,8,0.35)',
  },
  // Absolutely positioned within the Modal's own root (the whole screen), not
  // relative to the dock's parent — that's what lets it travel from the nav
  // bar all the way up to the top instead of only growing in place.
  panel: { position: 'absolute', overflow: 'hidden', zIndex: 20 },
  // Deep-shadow card — same weight as NotificationsPopover's, so both docks
  // read as one consistent "pops forward off a blurred backdrop" language.
  panelShadow: {
    shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
  },
  iconOnly: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: SEARCH_ROW_HEIGHT, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchIcon: {},
  // outlineStyle/outlineWidth are web-only (react-native-web) — without them the
  // browser draws its own default black focus ring around the <input>.
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
