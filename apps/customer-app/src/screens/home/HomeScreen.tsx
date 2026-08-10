import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  RefreshControl, ScrollView, Dimensions, Animated, Platform,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
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

  // ── Entrance animations ────────────────────────────────────────────────────
  const contentAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(contentAnim, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }).start();
  }, []);

  // ── Reanimated float & wobble loops (SLICK-DESIGN-PATTERN-V1) ───────────────
  const floatAnim = useSharedValue(0);
  const wobbleAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200 }),
        withTiming(0, { duration: 2200 })
      ),
      -1,
      true
    );
    wobbleAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2800 }),
        withTiming(-1, { duration: 2800 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [-5, 5]);
    const rotate = interpolate(wobbleAnim.value, [-1, 1], [-2.5, 2.5]);
    return {
      transform: [{ translateY }, { rotate: `${rotate}deg` }],
    };
  });

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
          <Text style={s.greeting}>Good {getGreetingWord()}! 👋</Text>
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
        {/* Banner carousel */}
        <View style={s.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveSlide(idx);
            }}
            style={{ marginTop: Spacing.xs }}
          >
            {banners.map((slide) => {
              const hasImage = !!slide.imageUrl;
              return (
                <View key={slide.id} style={[s.heroSlide, { width: SCREEN_WIDTH }]}>
                  <TouchableOpacity activeOpacity={0.95} onPress={() => navigation.navigate('Promos')}>
                    <LinearGradient
                      colors={hasImage ? ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.45)'] : [accent, accentDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={s.bannerCard}
                    >
                      {hasImage && (
                        <Image
                          source={{ uri: slide.imageUrl }}
                          style={[StyleSheet.absoluteFill, { opacity: 0.3 }]}
                          resizeMode="cover"
                        />
                      )}
                      
                      <View style={s.heroCopy}>
                        <View style={[s.bannerTag, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                          <Text style={s.bannerTagText}>LIMITED OFFER</Text>
                        </View>
                        <View style={s.offerRow}>
                          <Text style={s.offerValue}>{slide.offerValue}</Text>
                          <Text style={s.offerLabel}>{slide.offerLabel}</Text>
                        </View>
                        <Text style={s.heroDesc}>{slide.desc}</Text>
                      </View>

                      <Reanimated.View style={[s.glassBubble, floatStyle]}>
                        <Image
                          source={slide.imageUrl ? { uri: slide.imageUrl } : HERO_PLACEHOLDER_IMAGE}
                          style={s.glassBubbleImg}
                        />
                      </Reanimated.View>
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
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: SCREEN_WIDTH - Spacing.xl * 2,
    marginHorizontal: Spacing.xl,
    borderRadius: 30,
    padding: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    height: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    marginBottom: 8,
  },
  bannerTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroBody: { marginTop: Spacing.xs },
  heroDots: {
    flexDirection: 'row', justifyContent: 'center', gap: 6,
    marginTop: Spacing.md,
  },
  heroDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(28, 27, 23, 0.15)',
  },
  heroDotActive: { width: 18 },
  heroCopy: { flex: 1, paddingRight: Spacing.md, justifyContent: 'center' },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  offerValue: { fontFamily: 'Inter_800ExtraBold', fontSize: 40, color: '#FFFFFF', letterSpacing: -1 },
  offerLabel: {
    fontFamily: 'Inter_700Bold', color: '#FFFFFF',
    fontSize: 13, lineHeight: 16, letterSpacing: 0.2,
  },
  heroDesc: {
    fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, lineHeight: 18, marginTop: 4,
  },
  glassBubble: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassBubbleImg: {
    width: '75%',
    height: '75%',
    resizeMode: 'contain',
  },

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
