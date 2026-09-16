import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  RefreshControl, ScrollView, Dimensions, Animated, Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { customerApi } from '../../lib/api';
import { Product, Category } from '../../types';
import {
  Colors, Typography, Spacing, BorderRadius, Shadows,
  getStoreAccent, getStoreAccentLight, getStoreAccentDark, getStoreLabel,
} from '../../constants/theme';
import StoreToggle from '../../components/StoreToggle';
import CategoryBadge from '../../components/CategoryBadge';
import ProductCard from '../../components/ProductCard';
import NotificationsPopover from '../../components/NotificationsPopover';
import LocationPopover from '../../components/LocationPopover';
import Shimmer from '../../components/Shimmer';
import ErrorState from '../../components/ErrorState';
import TrustBadge from '../../components/TrustBadge';
import { useTranslation } from 'react-i18next';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={s.skeletonCard}>
      <Shimmer style={s.skeletonImg} />
      <Shimmer style={s.skeletonLine} />
      <Shimmer style={[s.skeletonLine, { width: '55%' }]} />
    </View>
  );
}

function getGreetingWord() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_PLACEHOLDER_IMAGE = require('../../../assets/images/hero-plate.png');

interface HeroBanner {
  id: string;
  imageUrl?: string;
  offerValue: string;
  offerLabel: string;
  desc: string;
}

const DEMO_FALLBACK_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEMO_FALLBACK === 'true';
// Banners come only from the API. When the API returns none there is no
// active campaign, so the carousel renders nothing — never a fabricated offer.

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { storeType, setStoreType, addToCart, incrementCart } = useStore();
  const { open: openProduct } = useProductSheet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  // Production must not fabricate discount banners — empty means “no active campaign”, not a fake 27% off
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [deliveryFilter, setDeliveryFilter] = useState<number | null>(null);
  const [sortByDelivery, setSortByDelivery] = useState(false);
  const bannerScrollRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserDragging = useRef(false);

  // ── Auto-scroll banner carousel ───────────────────────────────────────────
  const startAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    if (banners.length === 0) return;
    autoScrollTimer.current = setInterval(() => {
      if (isUserDragging.current) return;
      setActiveSlide((prev) => {
        const next = (prev + 1) % banners.length;
        bannerScrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, 4000);
  }, [banners.length]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  // Start / restart auto-scroll when banners change
  useEffect(() => {
    startAutoScroll();
    return stopAutoScroll;
  }, [startAutoScroll, stopAutoScroll]);

  // ── Entrance animations ────────────────────────────────────────────────────
  const contentAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(contentAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, []);

  const accent = getStoreAccent(storeType);
  const accentTint = getStoreAccentLight(storeType);
  const accentDark = getStoreAccentDark(storeType);
  const storeLabel = getStoreLabel(storeType);

  const load = useCallback(async () => {
    try {
      const [catRes, prodRes, bannerRes] = await Promise.all([
        customerApi.getCategories({ storeType }),
        customerApi.getProducts({ storeType, categoryId: activeCategoryId, limit: 10 }),
        customerApi.getBanners({ storeType, isActive: true }).catch(() => null),
      ]);
      setCategories(Array.isArray(catRes) ? catRes : (catRes as any)?.data || []);
      setProducts(Array.isArray(prodRes) ? prodRes : (prodRes as any)?.data || []);

      const bannerList = Array.isArray(bannerRes) ? bannerRes : (bannerRes as any)?.data;
      if (bannerList && bannerList.length > 0) {
        const mapped: HeroBanner[] = bannerList.map((b: any) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          offerValue: b.title || '',
          offerLabel: b.subtitle || '',
          desc: b.description || '',
        }));
        setBanners(mapped);
      } else {
        // Backend returned no banners (or request failed) → show nothing, not a fabricated discount
        setBanners([]);
      }
      setError(false);
    } catch {
      setProducts([]);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeType, activeCategoryId]);

  useEffect(() => {
    setLoading(true);
    setActiveCategoryId(undefined);
    load();
  }, [storeType]);

  useEffect(() => { load(); }, [activeCategoryId]);

  const handleQuickAdd = (product: Product) => {
    incrementCart();
    addToCart(product.id, 1).catch(() => {});
  };

  const handleVendorPress = (vendorId: string, vendorName: string) => {
    navigation.navigate('VendorStorefront', { vendorId, vendorName });
  };

  const animatedContentStyle = {
    opacity: contentAnim,
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <View style={s.root}>
      {/* Sticky Zomato-Style Header */}
      <SafeAreaView edges={['top']} style={s.topHeader}>
        <View style={s.topBar}>
          <LocationPopover accent={accent} isLight />
          <View style={[s.topBarSide, s.topIcons]}>
            <NotificationsPopover iconColor={Colors.text} />
          </View>
        </View>

        <View style={s.greetingRow}>
          <Text style={s.greeting}>Good {getGreetingWord()}</Text>
          <View style={[s.trustChip, { backgroundColor: `${accent}14` }]}>
            <Ionicons name="shield-checkmark" size={12} color={accent} />
            <Text style={[s.trustChipText, { color: accent }]}>Verified {storeLabel}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />
        }
      >
        {/* Banner carousel — rendered only when the API returns active banners */}
        {banners.length > 0 && (
        <View style={s.carouselContainer}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => { isUserDragging.current = true; }}
            onScrollEndDrag={() => { isUserDragging.current = false; }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveSlide(idx);
            }}
            style={{ marginTop: Spacing.sm }}
          >
            {banners.map((slide) => {
              const hasImage = !!slide.imageUrl;
              return (
                <View key={slide.id} style={[s.heroSlide, { width: SCREEN_WIDTH }]}>
                  <TouchableOpacity activeOpacity={0.95} onPress={() => navigation.navigate('Promos')}>
                    <LinearGradient
                      colors={hasImage ? ['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.52)'] : [accent, accentDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.bannerCard}
                    >
                      {hasImage && (
                        <Image
                          source={{ uri: slide.imageUrl }}
                          style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}
                          resizeMode="cover"
                        />
                      )}

                      <View style={s.heroCopy}>
                        <View style={[s.bannerTag, { backgroundColor: accent }]}>
                          <Text style={s.bannerTagText}>OFFER</Text>
                        </View>
                        <View style={s.offerRow}>
                          <Text style={s.offerValue}>{slide.offerValue}</Text>
                          <Text style={s.offerLabel}>{slide.offerLabel}</Text>
                        </View>
                        <Text style={s.heroDesc}>{slide.desc}</Text>
                      </View>

                      <View style={s.bannerCTARow}>
                        <Text style={[s.bannerCTAText, { color: '#FFFFFF' }]}>Shop now</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <View style={s.heroDots}>
            {banners.map((slide, i) => (
              <View
                key={slide.id}
                style={[s.heroDot, i === activeSlide && [s.heroDotActive, { backgroundColor: accent }]]}
              />
            ))}
          </View>
        </View>
        )}

        <SafeAreaView edges={[]} style={s.safe}>
          {/* Store Swatch Selector */}
          <View style={{ marginBottom: Spacing.xl }}>
            <StoreToggle selected={storeType} onSelect={setStoreType} />
          </View>

          {/* Farmer Story Card — premium trust signal */}
          {!loading && products.length > 0 && (
            <Animated.View style={animatedContentStyle}>
              <TouchableOpacity
                style={[s.farmerCard, Shadows.card]}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('VendorStorefront', { vendorId: products[0]?.vendor?.id, vendorName: products[0]?.vendor?.storeName })}
              >
                <View style={s.farmerCardLeft}>
                  <Text style={s.farmerCardLabel}>MEET THE GROWERS</Text>
                  <Text style={s.farmerCardTitle}>Know Your Farmer</Text>
                  <Text style={s.farmerCardDesc}>Meet the growers behind your fresh organic produce</Text>
                  <View style={s.farmerCardCTA}>
                    <Text style={[s.farmerCardLink, { color: accent }]}>Explore farmers</Text>
                    <Ionicons name="arrow-forward" size={12} color={accent} />
                  </View>
                </View>
                <View style={[s.farmerCardIcon, { backgroundColor: accentTint }]}>
                  <Ionicons name="people" size={28} color={accent} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Trust Strip — certification badges */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.trustStrip}>
            <TrustBadge type="NPOP" size="sm" />
            <TrustBadge type="ORGANIC" size="sm" />
            <TrustBadge type="NATURAL" size="sm" />
            <TrustBadge type="ECO_FRIENDLY" size="sm" />
            <TrustBadge type="FAIR_TRADE" size="sm" />
          </ScrollView>

          {/* Categories */}
          {categories.length > 0 && (
            <Animated.View style={animatedContentStyle}>
              <View style={[s.sectionHeader, { marginTop: Spacing.md }]}>
                <Text style={s.sectionLabel}>SHOP BY</Text>
                <Text style={s.sectionTitle}>{t('home.section.categories')}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
                <CategoryBadge
                  label={t('common.all')}
                  icon="grid"
                  accent={accent}
                  accentTint={accentTint}
                  isActive={!activeCategoryId}
                  onPress={() => setActiveCategoryId(undefined)}
                />
                {categories.map((cat) => (
                  <CategoryBadge
                    key={cat.id}
                    label={cat.name}
                    image={cat.image}
                    accent={accent}
                    accentTint={accentTint}
                    isActive={activeCategoryId === cat.id}
                    onPress={() => setActiveCategoryId(cat.id)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Delivery Speed Filter + Sort */}
          <View style={s.deliveryFilterWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.deliveryFilterScroll}>
              {[
                { label: 'All', value: null, icon: 'grid-outline' as const },
                { label: 'Under 15 min', value: 15, icon: 'flash-outline' as const },
                { label: 'Under 20 min', value: 20, icon: 'flash-outline' as const },
                { label: 'Under 30 min', value: 30, icon: 'flash-outline' as const },
              ].map((opt) => {
                const active = deliveryFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[s.deliveryFilterChip, active && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => setDeliveryFilter(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon} size={12} color={active ? '#FFFFFF' : accent} />
                    <Text style={[s.deliveryFilterText, active && { color: '#FFFFFF' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[s.deliveryFilterChip, sortByDelivery && { backgroundColor: accent, borderColor: accent }]}
                onPress={() => setSortByDelivery((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons name={sortByDelivery ? 'arrow-down' : 'swap-vertical'} size={12} color={sortByDelivery ? '#FFFFFF' : accent} />
                <Text style={[s.deliveryFilterText, sortByDelivery && { color: '#FFFFFF' }]}>Fastest first</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Product Grid */}
          {(() => {
            let filtered = deliveryFilter != null
              ? products.filter((p) => p.vendor?.deliveryTimeMax != null && p.vendor.deliveryTimeMax <= deliveryFilter)
              : [...products];
            if (sortByDelivery) {
              filtered.sort((a, b) => {
                const aTime = a.vendor?.deliveryTimeMax ?? 999;
                const bTime = b.vendor?.deliveryTimeMax ?? 999;
                return aTime - bTime;
              });
            }

            return (
          <Animated.View style={animatedContentStyle}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionLabel}>{t('home.section.popularIn', { storeLabel }).toUpperCase()}</Text>
                <Text style={s.sectionTitle}>{t('home.section.popularIn', { storeLabel })}</Text>
                {deliveryFilter != null && (
                  <Text style={s.deliveryFilterHint}>Showing items with delivery under {deliveryFilter} min</Text>
                )}
              </View>
              <TouchableOpacity
                style={s.seeAllBtn}
                onPress={() => navigation.navigate('AllProducts', { storeType })}
                activeOpacity={0.7}
              >
                <Text style={[s.seeAllText, { color: accent }]}>{t('common.seeAll')}</Text>
                <Ionicons name="chevron-forward" size={14} color={accent} />
              </TouchableOpacity>
            </View>

            <View style={s.grid}>
              {loading ? (
                [0, 1, 2, 3].map((i) => <SkeletonCard key={`skeleton-${i}`} />)
              ) : error ? (
                <View style={{ width: '100%' }}>
                  <ErrorState message={t('home.error.loadProducts')} onRetry={load} />
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  // Nested in the screen ScrollView — the outer scroller owns
                  // scrolling, this list only lays out rows (no per-row timers).
                  scrollEnabled={false}
                  style={s.gridList}
                  columnWrapperStyle={s.gridRow}
                  contentContainerStyle={s.gridContent}
                  renderItem={({ item }) => (
                    <ProductCard
                      product={item}
                      onPress={(p) => openProduct(p.id)}
                      onQuickAdd={handleQuickAdd}
                      onVendorPress={handleVendorPress}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={s.emptyState}>
                      <Ionicons name="time-outline" size={36} color={Colors.textSecondary} />
                      <Text style={s.emptyText}>No products with delivery under {deliveryFilter} min</Text>
                      <TouchableOpacity onPress={() => setDeliveryFilter(null)}>
                        <Text style={[s.emptyText, { color: accent, fontFamily: 'Inter_600SemiBold' }]}>Clear filter</Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              )}
            </View>
          </Animated.View>
          );
          })()}

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },

  hero: {
    position: 'relative',
    paddingBottom: Spacing.xxxl + 8,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },

  overscrollOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0A0A08',
    zIndex: 10,
    ...Platform.select({ web: { pointerEvents: 'none' as any } }),
  },

  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 23, 0.08)',
    paddingBottom: Spacing.md,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
  },
  topBarSide: { flex: 1 },
  topIcons: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },

  greeting: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1C1B17',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  trustChipText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    backgroundColor: '#F3F4F6', // Zomato soft grey input
    borderRadius: BorderRadius.md,
    height: 44,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Shadows.card,
  },
  searchPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  scrollContent: {
    paddingBottom: Spacing.xxl + 20,
  },

  carouselContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  heroSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - Spacing.xl * 2,
    marginHorizontal: Spacing.xl,
    borderRadius: 22,
    padding: Spacing.xl,
    paddingVertical: Spacing.xl + 4,
    overflow: 'hidden',
    position: 'relative',
    height: 220,
  },
  bannerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginBottom: 10,
  },
  bannerTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  heroBody: { marginTop: Spacing.xs },
  heroDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    marginTop: Spacing.md,
  },
  heroDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(28, 27, 23, 0.12)',
  },
  heroDotActive: { width: 20, borderRadius: 4 },
  heroCopy: { flex: 1, justifyContent: 'center' },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  offerValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 40, color: '#FFFFFF', letterSpacing: -1 },
  offerLabel: {
    fontFamily: 'Inter_700Bold', color: '#FFFFFF',
    fontSize: 13, lineHeight: 16, letterSpacing: 0.2,
  },
  heroDesc: {
    fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.75)', fontSize: 13, lineHeight: 18, marginTop: 6,
  },
  bannerCTARow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
  },
  bannerCTAText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  // Removed glassBubble — clean banner layout

  // ══ Section Headers (matching ProfileScreen style) ═══════════════════════════
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.pill,
    marginBottom: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },

  // Farmer card — editorial premium block
  farmerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  farmerCardLeft: { flex: 1 },
  farmerCardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  farmerCardTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 17,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  farmerCardDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  farmerCardCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  farmerCardLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  farmerCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },

  // Trust strip
  trustStrip: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  catScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xs },

  deliveryFilterWrap: {
    marginBottom: Spacing.md,
  },
  deliveryFilterScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  deliveryFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  deliveryFilterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.text,
  },
  deliveryFilterHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },
  gridList: { width: '100%' },
  gridRow: { justifyContent: 'space-between' },
  gridContent: { flexGrow: 1 },

  skeletonCard: { width: '48%', marginBottom: Spacing.lg },
  skeletonImg: { height: 140, borderRadius: BorderRadius.lg, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Colors.border, width: '90%', marginBottom: 6 },

  emptyState: { width: '100%', alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
