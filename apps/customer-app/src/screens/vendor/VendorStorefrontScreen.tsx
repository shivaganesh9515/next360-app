import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, FlatList,
  RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { Product, Category } from '../../types';
import ProductCard from '../../components/ProductCard';
import ErrorState from '../../components/ErrorState';
import Shimmer from '../../components/Shimmer';
import StaggerFadeIn from '../../components/StaggerFadeIn';
import {
  Colors, Spacing, BorderRadius, Typography, Shadows,
  getStoreAccent, getStoreAccentLight, getStoreAccentDark,
} from '../../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

// Strips HTML tags from a string — vendor descriptions sometimes include
// <p>, <br>, etc. that React Native's <Text> won't render.
const stripHtml = (str?: string) => str?.replace(/<[^>]*>/g, '') || '';

export default function VendorStorefrontScreen({ navigation, route }: any) {
  const { vendorId, vendorName } = route?.params || {};
  const { addToCart } = useStore();
  const { open: openProduct } = useProductSheet();

  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadVendor = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      // Fetch vendor details and their products in parallel
      // The vendor endpoint returns vendor profile + list of their products
      const [vendorRes, prodRes] = await Promise.all([
        customerApi.getVendorStorefront(vendorId).catch(() => null),
        customerApi.getProducts({ vendorId, limit: 50 }),
      ]);
      const v = vendorRes?.data || vendorRes;
      setVendor(v);

      const list: Product[] = Array.isArray(prodRes)
        ? prodRes
        : (prodRes as any)?.data || [];
      setProducts(list);

      // Derive categories from the fetched products
      const catMap = new Map<string, Category>();
      list.forEach((p) => {
        if (p.category && !catMap.has(p.category.id)) {
          catMap.set(p.category.id, p.category);
        }
      });
      setCategories(Array.from(catMap.values()));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendorId]);

  useEffect(() => { loadVendor(); }, [loadVendor]);

  const filteredProducts = activeCategoryId
    ? products.filter((p) => p.categoryId === activeCategoryId)
    : products;

  const accent = vendor?.storeType
    ? getStoreAccent(vendor.storeType)
    : Colors.organic;
  const accentTint = vendor?.storeType
    ? getStoreAccentLight(vendor.storeType)
    : Colors.organicLight;
  const accentDark = vendor?.storeType
    ? getStoreAccentDark(vendor.storeType)
    : Colors.organicDark;

  const handleQuickAdd = (product: Product) => {
    addToCart(product.id, 1).catch(() => {});
  };

  const handleVendorPress = (id: string, name: string) => {
    // Already on this vendor's storefront — no-op
  };

  const HeaderComponent = () => (
    <View>
      {/* Cover image */}
      <View style={[s.coverWrap, { backgroundColor: accentDark }]}>
        {vendor?.coverImage || vendor?.bannerImage ? (
          <Image
            source={{ uri: vendor.coverImage || vendor.bannerImage }}
            style={s.coverImage}
          />
        ) : (
          <View style={s.coverPlaceholder}>
            <Ionicons name="storefront" size={64} color="rgba(255,255,255,0.3)" />
          </View>
        )}
      </View>

      {/* Vendor avatar + name + quick stats */}
      <SafeAreaView edges={['top']} style={s.topOverlay}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Vendor info card */}
      <View style={[s.vendorCard, Shadows.card]}>
        <View style={s.vendorHeader}>
          <View style={[s.avatarWrap, { backgroundColor: accentTint, borderColor: accent }]}>
            {vendor?.logo || vendor?.avatarUrl ? (
              <Image source={{ uri: vendor.logo || vendor.avatarUrl }} style={s.avatar} />
            ) : (
              <Ionicons name="storefront-outline" size={28} color={accent} />
            )}
          </View>
          <View style={s.vendorInfo}>
            <Text style={s.vendorTitle}>{vendor?.storeName || vendorName || 'Vendor'}</Text>
            <View style={s.vendorMeta}>
              {!!vendor?.rating && (
                <View style={s.statRow}>
                  <Ionicons name="star" size={13} color={Colors.brass} />
                  <Text style={s.statText}>{vendor.rating.toFixed(1)}</Text>
                </View>
              )}
              {!!vendor?.productCount && (
                <View style={s.statRow}>
                  <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} />
                  <Text style={s.statText}>{vendor.productCount} items</Text>
                </View>
              )}
              {(vendor?.deliveryTimeMin != null && vendor?.deliveryTimeMax != null) && (
                <View style={[s.statRow, { backgroundColor: `${accent}12`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }]}>                  <Ionicons name="time-outline" size={12} color={accent} />
                  <Text style={[s.statText, { color: accent, fontFamily: 'Inter_600SemiBold' }]}>
                    {vendor.deliveryTimeMin}-{vendor.deliveryTimeMax} min
                    {vendor.deliveryLabel ? ` • ${vendor.deliveryLabel}` : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {stripHtml(vendor?.description) && (
          <Text style={s.description} numberOfLines={3}>
            {stripHtml(vendor.description)}
          </Text>
        )}
      </View>

      {/* Category filter chips */}
      {categories.length > 1 && (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catChips}
          ListHeaderComponent={
            <TouchableOpacity
              style={[s.catChip, !activeCategoryId && { backgroundColor: accent }]}
              onPress={() => setActiveCategoryId(undefined)}
            >
              <Text style={[s.catChipText, !activeCategoryId && { color: Colors.white }]}>
                All
              </Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const active = activeCategoryId === item.id;
            return (
              <TouchableOpacity
                style={[s.catChip, active && { backgroundColor: accent }]}
                onPress={() => setActiveCategoryId(item.id)}
              >
                <Text style={[s.catChipText, active && { color: Colors.white }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Section heading */}
      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Products</Text>
        <Text style={s.sectionCount}>{filteredProducts.length} items</Text>
      </View>
    </View>
  );

  if (loading && !vendor) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.headerShimmer}>
          <Shimmer style={{ height: 180, borderRadius: 0, width: '100%' }} />
          <Shimmer style={{ height: 100, borderRadius: BorderRadius.xl, margin: Spacing.lg }} />
        </View>
        <View style={s.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ width: CARD_WIDTH }}>
              <Shimmer style={{ height: CARD_WIDTH * 0.95, borderRadius: BorderRadius.xl, marginBottom: Spacing.sm }} />
              <Shimmer style={{ height: 12, borderRadius: 6, width: '80%', marginBottom: 6 }} />
              <Shimmer style={{ height: 12, borderRadius: 6, width: '50%' }} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error && !vendor) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.errorWrap}>
          <ErrorState message="Could not load vendor details" onRetry={loadVendor} />
          <TouchableOpacity style={s.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={s.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={HeaderComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVendor(); }} tintColor={accent} />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="storefront-outline" size={48} color={Colors.textSecondary} />
            <Text style={s.emptyText}>No products yet</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <StaggerFadeIn index={index}>
            <ProductCard
              product={item}
              onPress={(p) => openProduct(p.id)}
              onQuickAdd={handleQuickAdd}
              onVendorPress={handleVendorPress}
              cardWidth={CARD_WIDTH}
            />
          </StaggerFadeIn>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  coverWrap: {
    height: 180,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.lg,
    marginTop: Spacing.md,
  },

  vendorCard: {
    marginHorizontal: Spacing.lg,
    marginTop: -40,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  vendorInfo: { flex: 1 },
  vendorTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  vendorMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 21,
  },

  catChips: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  catChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  sectionCount: { ...Typography.caption, color: Colors.textSecondary },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  row: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  listContent: {
    paddingBottom: 100,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: { ...Typography.h3, color: Colors.text, opacity: 0.5 },

  headerShimmer: { marginBottom: Spacing.lg },

  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  goBackBtn: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.organic,
  },
  goBackText: {
    ...Typography.button,
    color: Colors.white,
  },
});
