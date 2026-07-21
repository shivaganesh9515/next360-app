import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  RefreshControl, ScrollView, Dimensions, Animated, Platform,
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
  getStoreAccent, getStoreAccentLight, getStoreLabel,
} from '../../constants/theme';
import StoreToggle from '../../components/StoreToggle';
import CategoryBadge from '../../components/CategoryBadge';
import ProductCard from '../../components/ProductCard';
import NotificationsPopover from '../../components/NotificationsPopover';
import LocationPopover from '../../components/LocationPopover';
import Shimmer from '../../components/Shimmer';
import StaggerFadeIn from '../../components/StaggerFadeIn';
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
const HERO_FALLBACK_HEIGHT = 300;

const HERO_PLACEHOLDER_IMAGE = require('../../../assets/images/hero-plate.png');

interface HeroBanner {
  id: string;
  imageUrl?: string;
  offerValue: string;
  offerLabel: string;
  desc: string;
}

const FALLBACK_HERO_SLIDES: HeroBanner[] = [
  { id: 'placeholder-1', offerValue: '27%', offerLabel: 'EXTRA\nDISCOUNT', desc: 'Enjoy your first order with a\nspecial discount!' },
  { id: 'placeholder-2', offerValue: '15%', offerLabel: 'FRESH\nARRIVALS', desc: 'New organic harvest,\njust landed this week!' },
  { id: 'placeholder-3', offerValue: 'FREE', offerLabel: 'DELIVERY\nOVER ₹499', desc: 'Fast, reliable delivery\nright to your doorstep.' },
];

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { storeType, setStoreType, addToCart, incrementCart } = useStore();
  const { open: openProduct } = useProductSheet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>(FALLBACK_HERO_SLIDES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroHeight, setHeroHeight] = useState(HERO_FALLBACK_HEIGHT);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // ── Entrance animations ────────────────────────────────────────────────────
  const contentAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(contentAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, []);

  const accent = getStoreAccent(storeType);
  const accentTint = getStoreAccentLight(storeType);
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
          imageUrl: b.imageUrl || b.image,
          offerValue: b.title || b.offerValue || '',
          offerLabel: b.subtitle || b.offerLabel || '',
          desc: b.description || b.desc || '',
        }));
        setBanners(mapped);
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

  // ── Parallax Hero Animation ──
  const HERO_SCROLL_RANGE = heroHeight;
  const HERO_OVERSCROLL_RANGE = heroHeight;

  const heroScale = scrollY.interpolate({
    inputRange: [-HERO_OVERSCROLL_RANGE, 0, HERO_SCROLL_RANGE * 0.6],
    outputRange: [2.4, 1, 0.88],
    extrapolate: 'clamp',
  });
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-HERO_OVERSCROLL_RANGE, 0, HERO_SCROLL_RANGE * 0.6],
    outputRange: [-HERO_OVERSCROLL_RANGE * 0.45, 0, -HERO_SCROLL_RANGE * 0.12],
    extrapolate: 'clamp',
  });

  const imageParallax = scrollY.interpolate({
    inputRange: [-HERO_OVERSCROLL_RANGE, 0],
    outputRange: [-HERO_OVERSCROLL_RANGE * 0.1, 0],
    extrapolate: 'clamp',
  });

  const overscrollOverlay = scrollY.interpolate({
    inputRange: [-HERO_OVERSCROLL_RANGE * 0.4, 0],
    outputRange: [0.35, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const listenerId = scrollY.addListener((val) => {
      headerOpacity.setValue(Math.max(0, 1 - val.value / (heroHeight * 0.35)));
    });
    return () => scrollY.removeListener(listenerId);
  }, [heroHeight]);

  const animatedContentStyle = {
    opacity: contentAnim,
    transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <View style={s.root}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />
        }
      >
        {/* ── Premium Hero — editorial dark card ── */}
        <Animated.View
          onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
          style={{ transform: [{ translateY: heroTranslateY }, { scale: heroScale }] }}
        >
          <LinearGradient
            colors={['#2A2820', Colors.text, '#100F0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <Animated.View
              style={[s.overscrollOverlay, { opacity: overscrollOverlay }]}
              pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
            />

            <SafeAreaView edges={['top']}>
              {/* Top bar — fades out on scroll */}
              <Animated.View style={{ opacity: headerOpacity }}>
                <View style={s.topBar}>
                  <LocationPopover accent={accent} />
                  <View style={[s.topBarSide, s.topIcons]}>
                    <NotificationsPopover />
                  </View>
                </View>

                <View style={{ paddingHorizontal: Spacing.xl, marginTop: Spacing.sm }}>
                  <View style={s.greetingRow}>
                    <Text style={s.greeting}>Good {getGreetingWord()}! 👋</Text>
                    <View style={[s.trustChip, { backgroundColor: accent + '22' }]}>
                      <Ionicons name="shield-checkmark" size={12} color={accent} />
                      <Text style={[s.trustChipText, { color: accent }]}>Verified {storeLabel}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Banner carousel */}
              <View style={s.heroBody}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setActiveSlide(idx);
                  }}
                  style={{ marginTop: Spacing.md }}
                >
                  {banners.map((slide) => (
                    <View key={slide.id} style={[s.heroSlide, { width: SCREEN_WIDTH }]}>
                      <View style={s.heroCopy}>
                        <Ionicons name="leaf-outline" size={20} color="rgba(150,185,140,0.5)" style={s.heroLeaf} />
                        <View style={s.offerRow}>
                          <Text style={[s.offerValue, { color: accent }]}>{slide.offerValue}</Text>
                          <Text style={s.offerLabel}>{slide.offerLabel}</Text>
                        </View>
                        <Text style={s.heroDesc}>{slide.desc}</Text>
                      </View>

                      <Animated.View style={[s.heroPhoto, { transform: [{ translateY: imageParallax }] }]}>
                        <Image
                          source={slide.imageUrl ? { uri: slide.imageUrl } : HERO_PLACEHOLDER_IMAGE}
                          style={s.heroPhotoImg}
                        />
                      </Animated.View>
                    </View>
                  ))}
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
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

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
                  <Text style={s.farmerCardTitle}>Know Your Farmer 🌱</Text>
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

          {/* Product Grid */}
          <Animated.View style={animatedContentStyle}>
            <View style={s.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.sectionLabel}>{t('home.section.popularIn', { storeLabel }).toUpperCase()}</Text>
                <Text style={s.sectionTitle}>{t('home.section.popularIn', { storeLabel })}</Text>
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
                [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
              ) : error ? (
                <View style={{ width: '100%' }}>
                  <ErrorState message={t('home.error.loadProducts')} onRetry={load} />
                </View>
              ) : products.length === 0 ? (
                <View style={s.emptyState}>
                  <Ionicons name="leaf-outline" size={36} color={Colors.textSecondary} />
                  <Text style={s.emptyText}>{t('home.empty.noProducts', { storeLabel })}</Text>
                </View>
              ) : (
                products.map((product, index) => (
                  <StaggerFadeIn key={product.id} index={index}>
                    <ProductCard
                      product={product}
                      onPress={(p) => openProduct(p.id)}
                      onQuickAdd={handleQuickAdd}
                      onVendorPress={handleVendorPress}
                    />
                  </StaggerFadeIn>
                ))
              )}
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </Animated.ScrollView>
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

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  topBarSide: { flex: 1 },
  topIcons: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },

  greeting: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.white,
    opacity: 0.85,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  heroBody: { marginTop: Spacing.xs },
  heroSlide: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  heroDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    marginTop: Spacing.lg,
  },
  heroDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)',
  },
  heroDotActive: { width: 18 },
  heroCopy: { flex: 1, paddingRight: Spacing.md },
  heroLeaf: { marginBottom: Spacing.xs },
  offerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  offerValue: { fontFamily: 'Inter_600SemiBold', fontSize: 44, lineHeight: 44, letterSpacing: -1.5 },
  offerLabel: {
    ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.white,
    fontSize: 14, lineHeight: 18, letterSpacing: 0.3,
  },
  heroDesc: {
    ...Typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: 12, maxWidth: 190,
  },
  heroPhoto: {
    width: 118, height: 118, borderRadius: 999, overflow: 'hidden',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.08)',
  },
  heroPhotoImg: { width: '100%', height: '100%', resizeMode: 'cover' },

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

  catScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },

  skeletonCard: { width: '48%', marginBottom: Spacing.lg },
  skeletonImg: { height: 140, borderRadius: BorderRadius.lg, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Colors.border, width: '90%', marginBottom: 6 },

  emptyState: { width: '100%', alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
