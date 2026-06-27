import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  RefreshControl, Dimensions, Image, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { customerApi } from '../../lib/api';
import { Product, StoreType } from '../../types';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

// ── Design tokens ─────────────────────────────────────────────────────────────
const G = {
  white:      '#FFFFFF',
  green:      '#2A7A4B',
  greenDark:  '#1A5C35',
  greenLight: '#EBF8F0',
  greenMid:   '#D4EDDA',
  amber:      '#E67E22',
  textDark:   '#1C1C1E',
  textMid:    '#3C3C43',
  textGray:   '#8E8E93',
  border:     '#F2F2F7',
  inputBg:    '#F5F5F5',
  skeleton:   '#EBEBEB',
};

// ── Intent-based categories ───────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Weekend\nMeal Box',     emoji: '🥘', value: StoreType.ORGANIC      },
  { label: 'Zero Pesticide\nPicks', emoji: '🌿', value: StoreType.NATURAL      },
  { label: 'A2 Dairy\n& Eggs',      emoji: '🥛', value: null                   },
  { label: 'Cold Pressed\n& Oils',  emoji: '🫙', value: StoreType.ECO_FRIENDLY },
  { label: 'For Your\nKids',        emoji: '👶', value: null                   },
];

const TABS = ['Top Sellers', 'Just Harvested', 'Highest Rated'];

// ── Placeholder products (shown when API returns nothing) ─────────────────────
const PLACEHOLDER_PRODUCTS: any[] = [
  {
    id: 'ph-1', name: 'Desi A2 Cow Milk',
    price: 89, compareAtPrice: 110, unit: '1 L', images: [],
    storeType: StoreType.ORGANIC, emoji: '🥛',
    vendor: { storeName: 'Godhuma Farms · Vijayawada' },
  },
  {
    id: 'ph-2', name: 'Heirloom Tomatoes',
    price: 65, unit: '500g', images: [],
    storeType: StoreType.ORGANIC, emoji: '🍅',
    vendor: { storeName: 'Sai Farms · Chittoor' },
  },
  {
    id: 'ph-3', name: 'Cold Pressed Coconut Oil',
    price: 299, compareAtPrice: 380, unit: '500 ml', images: [],
    storeType: StoreType.ECO_FRIENDLY, emoji: '🫙',
    vendor: { storeName: 'Kerala Naturals · Kochi' },
  },
  {
    id: 'ph-4', name: 'Baby Spinach',
    price: 45, unit: '250g', images: [],
    storeType: StoreType.ORGANIC, emoji: '🥬',
    vendor: { storeName: 'Green Valley · Hyderabad' },
  },
  {
    id: 'ph-5', name: 'Free Range Eggs',
    price: 72, compareAtPrice: 84, unit: '6 pcs', images: [],
    storeType: StoreType.NATURAL, emoji: '🥚',
    vendor: { storeName: 'Satya Farms · Nellore' },
  },
  {
    id: 'ph-6', name: 'Sonamasuri Rice',
    price: 120, unit: '1 kg', images: [],
    storeType: StoreType.ORGANIC, emoji: '🌾',
    vendor: { storeName: 'AP Organic Co-op · Guntur' },
  },
];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard({ left }: { left: boolean }) {
  return (
    <View style={[s.card, left ? s.cardLeft : s.cardRight]}>
      <View style={[s.cardImgWrap, { backgroundColor: G.skeleton }]} />
      <View style={s.cardInfo}>
        <View style={sk.line} />
        <View style={[sk.line, { width: '55%', marginTop: 6 }]} />
        <View style={[sk.line, { width: '35%', marginTop: 5 }]} />
        <View style={sk.bottomRow}>
          <View style={[sk.line, { width: 44 }]} />
          <View style={sk.addSkeleton} />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const { user }                                   = useAuth();
  const { storeType, setStoreType, incrementCart } = useStore();
  const [activeTab,  setActiveTab]                 = useState(0);
  const [products,   setProducts]                  = useState<Product[]>([]);
  const [loading,    setLoading]                   = useState(true);
  const [refreshing, setRefreshing]                = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const res = await customerApi.getProducts({ storeType, limit: 10 });
      setProducts(Array.isArray(res) ? res : (res as any).data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeType]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleCategoryPress = (value: StoreType | null) => {
    if (value) setStoreType(value).catch(() => {});
  };

  const handleAdd = (id: string) => {
    if (id.startsWith('ph-')) { incrementCart(); return; }
    customerApi.addToCart(id, 1)
      .then(() => incrementCart())
      .catch(() => {});
  };

  // ── Display list: real products or placeholders ────────────────────────────
  const displayProducts = products.length > 0 ? products : PLACEHOLDER_PRODUCTS;
  const isPlaceholder   = products.length === 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={G.white} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={G.green}
          />
        }
      >
        <SafeAreaView edges={['top']} style={s.safe}>

          {/* ━━ TOP BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={s.topBar}>
            <TouchableOpacity style={s.locRow} activeOpacity={0.7}>
              <View style={s.locIconCircle}>
                <Text style={s.locPin}>📍</Text>
              </View>
              <View>
                <Text style={s.locLabel}>Delivery to</Text>
                <View style={s.locNameRow}>
                  <Text style={s.locName}>Hyderabad</Text>
                  <Text style={s.locChevron}>  ▾</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={s.topIcons}>
              <TouchableOpacity
                style={s.iconCircle}
                onPress={() => navigation.navigate('Notifications')}
              >
                <Text style={s.iconEmoji}>🔔</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ━━ SEARCH BAR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <TouchableOpacity
            style={s.searchBar}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.85}
          >
            <Text style={s.searchIcon}>🔍</Text>
            <Text style={s.searchHint}>Try A2 milk, cold-pressed oils, heirloom tomatoes...</Text>
          </TouchableOpacity>

          {/* ━━ TRUST HERO BANNER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={s.heroBanner}>
            <View style={s.heroLeft}>
              <View style={s.heroCertBadge}>
                <Text style={s.heroCertTxt}>✓  India Organic Certified</Text>
              </View>
              <Text style={s.heroHeadline}>Farm-fresh{'\n'}produce, direct{'\n'}to your door</Text>
              <Text style={s.heroSub}>Sourced from AP & Telangana{'\n'}farmers · 24h delivery</Text>
              <TouchableOpacity style={s.shopNowBtn} activeOpacity={0.85}>
                <Text style={s.shopNowTxt}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            <View style={s.heroRight}>
              <Text style={s.heroEmoji}>🧑‍🌾</Text>
              <Text style={s.heroEmojiStack}>🥦🍅🥕</Text>
            </View>
          </View>

          {/* ━━ DELIVERY PROMISE STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={s.deliveryStrip}>
            <Text style={s.deliveryStripTxt}>
              🚚  Free delivery on orders above ₹299 · Delivered by 7am tomorrow
            </Text>
          </View>

          {/* ━━ SHOP BY INTENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Shop by Intent</Text>
            <TouchableOpacity><Text style={s.seeAll}>See All</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catScroll}
          >
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={s.catItem}
                onPress={() => handleCategoryPress(cat.value)}
                activeOpacity={0.8}
              >
                <View style={s.catCircle}>
                  <Text style={s.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={s.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ━━ POPULAR THIS WEEK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Popular this week 🔥</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList', {})}>
              <Text style={s.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={s.tabRow}>
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={i} style={s.tabItem}
                onPress={() => setActiveTab(i)}
                activeOpacity={0.8}
              >
                <Text style={[s.tabTxt, activeTab === i && s.tabTxtActive]}>{t}</Text>
                {activeTab === i && <View style={s.tabLine} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* ━━ PRODUCT GRID — skeleton → placeholders → real ━━━━━━━━━━━━━━ */}
          <View style={s.grid}>
            {loading ? (
              // Skeleton cards while fetching
              [0, 1, 2, 3].map(i => (
                <SkeletonCard key={i} left={i % 2 === 0} />
              ))
            ) : (
              displayProducts.map((item, idx) => {
                const hasDeal   = item.compareAtPrice && item.compareAtPrice > item.price;
                const isTopPick = idx < 2;
                const emoji     = (item as any).emoji || '🌿';

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.card, idx % 2 === 0 ? s.cardLeft : s.cardRight]}
                    onPress={() => {
                      if (!isPlaceholder) {
                        navigation.navigate('ProductDetail', { productId: item.id });
                      }
                    }}
                    activeOpacity={isPlaceholder ? 1 : 0.9}
                  >
                    {/* Image / emoji area */}
                    <View style={s.cardImgWrap}>
                      <View style={[s.badge, isTopPick && s.badgeTopPick]}>
                        <Text style={s.badgeTxt}>
                          {isTopPick ? '🔥 Top Pick' : '✓ ORGANIC'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={s.heartBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={s.heartIcon}>♡</Text>
                      </TouchableOpacity>
                      {item.images?.[0] ? (
                        <Image source={{ uri: item.images[0] }} style={s.cardImg} />
                      ) : (
                        <View style={s.emojiWrap}>
                          <Text style={s.cardEmoji}>{emoji}</Text>
                        </View>
                      )}
                    </View>

                    {/* Info */}
                    <View style={s.cardInfo}>
                      <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
                      <Text style={s.cardUnit} numberOfLines={1}>{item.unit}</Text>
                      <Text style={s.cardFarm} numberOfLines={1}>
                        {item.vendor?.storeName || 'Next360 Farms · Andhra Pradesh'}
                      </Text>
                      <View style={s.cardBottom}>
                        <View>
                          <Text style={s.cardPrice}>₹{item.price}</Text>
                          {hasDeal && (
                            <Text style={s.cardCompare}>₹{item.compareAtPrice}</Text>
                          )}
                        </View>
                        <TouchableOpacity
                          style={s.addBtn}
                          onPress={() => handleAdd(item.id)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Text style={s.addBtnTxt}>ADD</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Placeholder label */}
          {!loading && isPlaceholder && (
            <Text style={s.placeholderNote}>
              Sample products · Connect to API for live inventory
            </Text>
          )}

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: G.white },
  safe:     { flex: 1, backgroundColor: G.white },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
  },
  locRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locIconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: G.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  locPin:    { fontSize: 18 },
  locLabel:  { fontFamily: 'Inter_400Regular', fontSize: 12, color: G.textGray, lineHeight: 16 },
  locNameRow:{ flexDirection: 'row', alignItems: 'center' },
  locName:   { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: G.textDark },
  locChevron:{ fontFamily: 'Inter_400Regular', fontSize: 13, color: G.textGray },
  topIcons:  { flexDirection: 'row', gap: 10 },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1.5, borderColor: G.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: G.white,
  },
  iconEmoji: { fontSize: 18 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.inputBg, borderRadius: 14,
    marginHorizontal: 20, height: 50,
    paddingHorizontal: 16, gap: 10, marginBottom: 22,
  },
  searchIcon: { fontSize: 16, opacity: 0.4 },
  searchHint: { fontFamily: 'Inter_400Regular', fontSize: 13, color: G.textGray, flex: 1 },

  // Section header
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14, marginTop: 6,
  },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: G.textDark },
  seeAll:       { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: G.green },

  // Hero banner
  heroBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: G.greenMid, borderRadius: 20,
    marginHorizontal: 20, marginBottom: 14,
    padding: 20, overflow: 'hidden',
  },
  heroLeft: { flex: 1, paddingRight: 10 },
  heroCertBadge: {
    backgroundColor: G.green, borderRadius: 50,
    paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  heroCertTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: G.white, letterSpacing: 0.3 },
  heroHeadline: {
    fontFamily: 'Inter_600SemiBold', fontSize: 20, color: G.textDark,
    lineHeight: 28, marginBottom: 8,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: G.textMid,
    lineHeight: 18, marginBottom: 16,
  },
  shopNowBtn: {
    backgroundColor: G.greenDark, borderRadius: 50,
    paddingHorizontal: 20, paddingVertical: 10, alignSelf: 'flex-start',
  },
  shopNowTxt:     { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: G.white },
  heroRight:      { alignItems: 'center', justifyContent: 'center' },
  heroEmoji:      { fontSize: 52 },
  heroEmojiStack: { fontSize: 22, marginTop: 4 },

  // Delivery strip
  deliveryStrip: {
    marginHorizontal: 20, marginBottom: 22,
    backgroundColor: G.greenLight, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  deliveryStripTxt: {
    fontFamily: 'Inter_600SemiBold', fontSize: 12, color: G.greenDark, lineHeight: 18,
  },

  // Categories
  catScroll: { paddingLeft: 20, paddingRight: 8, gap: 16, marginBottom: 6 },
  catItem:   { alignItems: 'center', gap: 8, width: 76 },
  catCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: G.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  catEmoji: { fontSize: 28 },
  catLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: G.textDark,
    textAlign: 'center', lineHeight: 15,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 24,
    borderBottomWidth: 1, borderBottomColor: G.border, marginBottom: 16,
  },
  tabItem: { paddingBottom: 12, position: 'relative' },
  tabTxt:       { fontFamily: 'Inter_400Regular', fontSize: 14, color: G.textGray },
  tabTxtActive: { fontFamily: 'Inter_600SemiBold', color: G.textDark },
  tabLine: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 2.5, backgroundColor: G.greenDark, borderRadius: 2,
  },

  // Product grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  card: {
    width: CARD_W, borderRadius: 16, backgroundColor: G.white,
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
    overflow: 'hidden',
  },
  cardLeft:  { marginRight: 10 },
  cardRight: { marginLeft: 10 },

  cardImgWrap: {
    backgroundColor: G.greenLight,
    height: CARD_W * 0.85,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  emojiWrap: { alignItems: 'center', justifyContent: 'center' },
  cardImg:   { width: '70%', height: '70%', resizeMode: 'contain' },
  cardEmoji: { fontSize: 52 },

  badge: {
    position: 'absolute', top: 10, left: 10, zIndex: 1,
    backgroundColor: G.green, borderRadius: 50,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeTopPick: { backgroundColor: G.amber },
  badgeTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: G.white, letterSpacing: 0.3 },

  heartBtn:  { position: 'absolute', top: 8, right: 10, zIndex: 1 },
  heartIcon: { fontSize: 20, color: '#CCC' },

  cardInfo: { padding: 12, backgroundColor: G.white },
  cardName: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13, color: G.textDark,
    lineHeight: 18, marginBottom: 2,
  },
  cardUnit: { fontFamily: 'Inter_400Regular', fontSize: 11, color: G.textGray, marginBottom: 2 },
  cardFarm: { fontFamily: 'Inter_400Regular', fontSize: 10, color: G.green, marginBottom: 6 },
  cardCompare: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: G.textGray,
    textDecorationLine: 'line-through',
  },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: G.textDark },
  addBtn:    { backgroundColor: G.green, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addBtnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: G.white, letterSpacing: 0.8 },

  // Placeholder note
  placeholderNote: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: G.textGray,
    textAlign: 'center', marginBottom: 8, opacity: 0.6,
  },
});

// Skeleton styles
const sk = StyleSheet.create({
  line: { height: 12, borderRadius: 6, backgroundColor: G.skeleton, width: '80%' },
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12,
  },
  addSkeleton: { width: 52, height: 30, borderRadius: 8, backgroundColor: G.skeleton },
});
