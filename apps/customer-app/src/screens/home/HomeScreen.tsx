import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { useZone } from '../../lib/zone';
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

function SkeletonCard() {
  return (
    <View style={s.skeletonCard}>
      <View style={s.skeletonImg} />
      <View style={s.skeletonLine} />
      <View style={[s.skeletonLine, { width: '55%' }]} />
    </View>
  );
}

function getGreetingWord() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { storeType, setStoreType, addToCart, incrementCart, cartCount } = useStore();
  const { city, locality } = useZone();
  const { open: openProduct } = useProductSheet();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const accent = getStoreAccent(storeType);
  const accentTint = getStoreAccentLight(storeType);
  const accentDark = getStoreAccentDark(storeType);
  const storeLabel = getStoreLabel(storeType);

  const load = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        customerApi.getCategories({ storeType }),
        customerApi.getProducts({ storeType, categoryId: activeCategoryId, limit: 10 }),
      ]);
      setCategories(Array.isArray(catRes) ? catRes : (catRes as any)?.data || []);
      setProducts(Array.isArray(prodRes) ? prodRes : (prodRes as any)?.data || []);
    } catch {
      setProducts([]);
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

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={accent} />
        }
      >
        <SafeAreaView edges={['top']} style={s.safe}>

          {/* Top bar — dark circular icon buttons instead of bordered squares */}
          <View style={s.topBar}>
            <TouchableOpacity style={s.locRow} activeOpacity={0.7} onPress={() => navigation.navigate('SelectLocation')}>
              <View style={[s.locIconCircle, { backgroundColor: accentTint }]}>
                <Ionicons name="location" size={18} color={accent} />
              </View>
              <View>
                <Text style={s.locLabel}>Delivery to</Text>
                <View style={s.locNameRow}>
                  <Text style={s.locName}>{locality || city || 'Select location'}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
            <View style={s.topIcons}>
              <TouchableOpacity style={s.iconCircle} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconCircle} onPress={() => navigation.navigate('Cart')}>
                <Ionicons name="bag-handle-outline" size={18} color={Colors.white} />
                {cartCount > 0 && (
                  <View style={s.cartBadge}>
                    <Text style={s.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.iconCircle} onPress={() => navigation.navigate('ProfileFlow')}>
                <Ionicons name="person-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting — bold headline with an accent-colored keyword */}
          <Text style={s.greeting}>
            Good {getGreetingWord()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.{'\n'}
            Fresh <Text style={{ color: accent }}>{storeLabel.toLowerCase()}</Text> finds today.
          </Text>

          {/* Search */}
          <TouchableOpacity style={s.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
            <Ionicons name="search" size={17} color={Colors.textSecondary} />
            <Text style={s.searchHint}>Search organic, natural & eco-friendly products</Text>
          </TouchableOpacity>

          {/* Store swatch selector — the core 3-storefront mechanic */}
          <View style={{ marginBottom: Spacing.xl }}>
            <StoreToggle selected={storeType} onSelect={setStoreType} />
          </View>

          {/* Hero banner — gradient depth instead of flat fill */}
          <LinearGradient
            colors={[accent, accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.heroBanner, Shadows.raised]}
          >
            <View style={s.heroLeft}>
              <View style={s.heroCertBadge}>
                <Ionicons name="checkmark-circle" size={13} color={Colors.white} />
                <Text style={s.heroCertTxt}>India {storeLabel} Certified</Text>
              </View>
              <Text style={s.heroHeadline}>Farm-fresh produce,{'\n'}direct to your door</Text>
              <Text style={s.heroSub}>Sourced from AP & Telangana farmers · 24h delivery</Text>
            </View>
            <View style={s.heroIconWrap}>
              <Ionicons name="leaf" size={40} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>

          {/* Categories — circular photo badges with colored ring, not flat chips */}
          {categories.length > 0 && (
            <>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Shop by Category</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
                <CategoryBadge
                  label="All"
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
            <Text style={s.sectionTitle}>Popular in {storeLabel}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList', { storeType })}>
              <Text style={[s.seeAll, { color: accent }]}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={s.grid}>
            {loading ? (
              [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
            ) : products.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="leaf-outline" size={36} color={Colors.textSecondary} />
                <Text style={s.emptyText}>No products yet in {storeLabel}</Text>
              </View>
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={(p) => openProduct(p.id)}
                  onQuickAdd={handleQuickAdd}
                />
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safe: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locIconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  locLabel: { ...Typography.caption, color: Colors.textSecondary },
  locNameRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  topIcons: { flexDirection: 'row', gap: Spacing.sm },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.text,
  },
  cartBadge: {
    position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.background,
  },
  cartBadgeText: { fontSize: 9, color: Colors.white, fontFamily: 'Inter_600SemiBold' },

  greeting: {
    ...Typography.display, color: Colors.text, lineHeight: 34,
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg, marginTop: Spacing.xs,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    marginHorizontal: Spacing.xl, height: 50, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  searchHint: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, marginTop: Spacing.sm,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  seeAll: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold' },

  heroBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.xl, marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    padding: Spacing.xl, overflow: 'hidden',
  },
  heroLeft: { flex: 1, paddingRight: Spacing.md },
  heroCertBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BorderRadius.pill, paddingHorizontal: Spacing.sm + 2, paddingVertical: 5,
    alignSelf: 'flex-start', marginBottom: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroCertTxt: { ...Typography.caption, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  heroHeadline: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.sm },
  heroSub: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.85)' },
  heroIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  catScroll: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: Spacing.xl },

  skeletonCard: { width: '48%', marginBottom: Spacing.lg },
  skeletonImg: { height: 140, borderRadius: BorderRadius.lg, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: Colors.border, width: '90%', marginBottom: 6 },

  emptyState: { width: '100%', alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
