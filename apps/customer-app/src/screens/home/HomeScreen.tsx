import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  RefreshControl, ScrollView, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import ProfileAvatarPopover from '../../components/ProfileAvatarPopover';
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
import { useTranslation } from 'react-i18next';

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

  // Apple-style "stretchy header": on iOS overscroll (pulling down past the top),
  // contentOffset.y goes negative. We scale the hero up to fill that revealed
  // gap and translate it back by half the extra height so it grows downward
  // from a pinned top edge, instead of stretching symmetrically from center.
  const heroScale = scrollY.interpolate({
    inputRange: [-heroHeight, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });
  const heroTranslateY = scrollY.interpolate({
    inputRange: [-heroHeight, 0],
    outputRange: [-heroHeight / 2, 0],
    extrapolate: 'clamp',
  });

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
        {/* Dark hero card — deep "bark" gradient (matches the app's near-black text
            color, so it reads as a brand tone rather than a random dark) with the
            offer copy, storefront photo bleeding off the top-right corner, and a
            leaf accent. Search sits below, floating half-in/half-out of the hero's
            bottom edge on a strong shadow — the one part of the layout that should
            look "lifted" off the page. Scales/translates on overscroll for the
            iOS-style rubber-band stretch. */}
        <Animated.View
          onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
          style={{ transform: [{ translateY: heroTranslateY }, { scale: heroScale }] }}
        >
          <LinearGradient
            colors={['#26251E', Colors.text, '#100F0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <SafeAreaView edges={['top']}>
              <View style={s.topBar}>
                {/* flex:1-matched to the icons zone on the right, so the location
                    block below still lands at true horizontal center regardless
                    of this side's own content width. Profile now opens as a
                    popup from here instead of living in the bottom nav. */}
                <View style={[s.topBarSide, s.topBarLeft]}>
                  <ProfileAvatarPopover navigation={navigation} />
                </View>
                <LocationPopover accent={accent} />
                <View style={[s.topBarSide, s.topIcons]}>
                  <NotificationsPopover />
                </View>
              </View>

              <View style={s.heroBody}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    setActiveSlide(idx);
                  }}
                >
                  {banners.map((slide) => (
                    <View key={slide.id} style={[s.heroSlide, { width: SCREEN_WIDTH }]}>
                      <View style={s.heroCopy}>
                        <Ionicons name="leaf-outline" size={22} color="rgba(150,185,140,0.5)" style={s.heroLeaf} />
                        <View style={s.offerRow}>
                          <Text style={[s.offerValue, { color: accent }]}>{slide.offerValue}</Text>
                          <Text style={s.offerLabel}>{slide.offerLabel}</Text>
                        </View>
                        <Text style={s.heroDesc}>{slide.desc}</Text>
                      </View>
                      <View style={s.heroPhoto}>
                        <Image
                          source={slide.imageUrl ? { uri: slide.imageUrl } : HERO_PLACEHOLDER_IMAGE}
                          style={s.heroPhotoImg}
                        />
                      </View>
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
          {/* Store swatch selector — the core 3-storefront mechanic */}
          <View style={{ marginBottom: Spacing.xl }}>
            <StoreToggle selected={storeType} onSelect={setStoreType} />
          </View>

          {/* Categories — circular photo badges with colored ring, not flat chips */}
          {categories.length > 0 && (
            <>
              <View style={s.sectionRow}>
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
            </>
          )}

          {/* Product grid */}
          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>{t('home.section.popularIn', { storeLabel })}</Text>
            <TouchableOpacity
              style={s.seeAllRow}
              onPress={() => navigation.navigate('AllProducts', { storeType })}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[s.seeAll, { color: accent }]}>{t('common.seeAll')}</Text>
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
                  />
                </StaggerFadeIn>
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },

  // Hero is a dark card in the app's own "bark" tone (Colors.text), rounded at the
  // bottom so it reads as a distinct floating panel rather than a full-bleed band.
  hero: {
    position: 'relative',
    paddingBottom: Spacing.xxxl + 8,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  // Equal-width flex zones on each side keep the location block truly centered
  // regardless of the icon cluster on the right (2 buttons) outweighing the
  // single menu button on the left — space-between alone skews it off-center.
  topBarSide: { flex: 1 },
  topBarLeft: { alignItems: 'flex-start' },
  iconGhost: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  topIcons: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },

  heroBody: { marginTop: Spacing.xl },
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

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  // Bolder, bigger section headline — the confident graphic-headline energy
  // from the Behance reference ("Get the best snacks"), not a timid label.
  sectionTitle: { ...Typography.h2, color: Colors.text },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAll: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold' },

  catScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },

  skeletonCard: { width: '48%', marginBottom: Spacing.lg },
  skeletonImg: { height: 140, borderRadius: BorderRadius.lg, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Colors.border, width: '90%', marginBottom: 6 },

  emptyState: { width: '100%', alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
