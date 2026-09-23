import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  RefreshControl, TouchableOpacity, Alert, Image, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { Product, Category } from '../../types';
import ProductCard from '../../components/ProductCard';
import Shimmer from '../../components/Shimmer';
import StaggerFadeIn from '../../components/StaggerFadeIn';
import ErrorState from '../../components/ErrorState';
import { getCategoryIcon } from '../../constants/categoryIcons';
import { useScrollNav } from '../../lib/scrollNav';
import {
  Colors, Spacing, BorderRadius, Typography,
  getStoreAccent, getStoreAccentLight,
} from '../../constants/theme';
import { useTranslation } from 'react-i18next';

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low' },
  { key: 'price_desc', label: 'Price: High' },
  { key: 'rating', label: 'Rating' },
];

const RAIL_WIDTH = 72;
const RAIL_BORDER = 1;

const PRICE_RANGES: { key: string; label: string; min: number; max?: number }[] = [
  { key: 'under200', label: 'Under ₹200', min: 0, max: 200 },
  { key: 'range200to500', label: '₹200 – ₹500', min: 200, max: 500 },
  { key: 'range500to1000', label: '₹500 – ₹1000', min: 500, max: 1000 },
  { key: 'above1000', label: 'Above ₹1000', min: 1000 },
];

export default function ProductListScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { addToCart, storeType: activeStoreType } = useStore();
  const { open: openProduct } = useProductSheet();
  const { handleScroll } = useScrollNav();
  const { categoryId, categoryName } = route.params || {};
  // Falls back to the globally selected store (StoreToggle) when opened as the
  // "All Products" tab root rather than navigated to with an explicit storeType.
  const storeType = route.params?.storeType || activeStoreType;

  const { width: screenWidth } = useWindowDimensions();
  // Tablet-safe cap: bound the pane/card-width math to a phone-like width on
  // large screens (iPad, unfolded foldables) so cards don't stretch oversized.
  const cardBasisWidth = Math.min(screenWidth, 768);
  // ProductCard's default sizing assumes a full-width 2-column grid; this pane
  // is narrower (screen width minus the rail), so cards need an explicit width
  // or they'd overflow the pane using their own full-width calculation.
  const PANE_WIDTH = cardBasisWidth - RAIL_WIDTH - RAIL_BORDER;
  const CARD_WIDTH = (PANE_WIDTH - Spacing.lg * 3) / 2;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('trending');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(categoryId);
  const [priceRange, setPriceRange] = useState<typeof PRICE_RANGES[number] | null>(null);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState<number | null>(null);
  const [sortByDelivery, setSortByDelivery] = useState(false);

  const accent = getStoreAccent(storeType);
  const accentTint = getStoreAccentLight(storeType);

  useEffect(() => {
    customerApi.getCategories({ storeType: storeType || undefined })
      .then((res: any) => setCategories(Array.isArray(res) ? res : res?.data || []))
      .catch(() => setCategories([]));
  }, [storeType]);

  const fetchProducts = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      const params: Record<string, any> = {
        storeType: storeType || undefined,
        sort: sortBy,
        limit: 12,
        page: pageNum,
      };
      if (selectedCategoryId) params.categoryId = selectedCategoryId;

      const res = await customerApi.getProducts(params);
      const data = res.data || res || [];
      if (isRefresh || pageNum === 1) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 12);
      setError(false);
    } catch (err) {
      // Previously silently swallowed — a failed request on page 1 looked
      // identical to "no products match your filters," with no way to
      // distinguish a real outage from a genuinely empty result.
      if (pageNum === 1) setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeType, selectedCategoryId, sortBy]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts(1, true);
  }, [fetchProducts]);

  // Price/rating/stock/delivery are refined on whatever's already loaded rather
  // than re-querying — category and sort are the only server-side filters here.
  const visibleProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (priceRange) {
        const price = Number(p.price);
        if (price < priceRange.min) return false;
        if (priceRange.max !== undefined && price > priceRange.max) return false;
      }
      if (minRating && (p.rating || 0) < minRating) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (deliveryFilter != null) {
        if (p.vendor?.deliveryTimeMax == null || p.vendor.deliveryTimeMax > deliveryFilter) return false;
      }
      return true;
    });
    if (sortByDelivery) {
      result = [...result].sort((a, b) => {
        const aTime = a.vendor?.deliveryTimeMax ?? 999;
        const bTime = b.vendor?.deliveryTimeMax ?? 999;
        return aTime - bTime;
      });
    }
    return result;
  }, [products, priceRange, minRating, inStockOnly, deliveryFilter, sortByDelivery]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const handleQuickAdd = (product: Product) => {
    addToCart(product.id, 1)
      .then(() => Alert.alert(t('products.alert.added.title'), t('products.alert.added.message', { name: product.name })))
      .catch(() => Alert.alert(t('common.error'), t('products.alert.signInRequired')));
  };

  const handleProductPress = (product: Product) => {
    openProduct(product.id);
  };

  const handleVendorPress = (vendorId: string, vendorName: string) => {
    navigation.navigate('Home', { screen: 'VendorStorefront', params: { vendorId, vendorName } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sort bar */}
      <View style={styles.sortBar}>
        <View style={styles.titleRow}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={Colors.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.sortLabel}>
            {categoryName || t('products.title.allProducts')}
          </Text>
        </View>
        <FlatList
          data={SORT_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortOptions}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.sortChip, sortBy === item.key && { backgroundColor: accent }]}
              onPress={() => setSortBy(item.key)}
            >
              <Text style={[styles.sortChipText, sortBy === item.key && { color: Colors.white }]}>
                {t(`products.sort.${item.key}`)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Permanent split layout — category rail always visible on the left
          (Blinkit/Instamart-style), product grid on the right. Tapping a rail
          item re-queries (server-filtered, same as sort); price/rating/stock
          chips above the grid refine whatever's already loaded. */}
      <View style={styles.body}>
        <View style={styles.rail}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.railContent}
            ListHeaderComponent={
              <RailItem
                label="All"
                image={undefined}
                icon="grid"
                active={!selectedCategoryId}
                accent={accent}
                accentTint={accentTint}
                onPress={() => setSelectedCategoryId(undefined)}
              />
            }
            renderItem={({ item }) => (
              <RailItem
                label={item.name}
                image={item.imageUrl}
                icon={getCategoryIcon(item)}
                active={selectedCategoryId === item.id}
                accent={accent}
                accentTint={accentTint}
                onPress={() => setSelectedCategoryId(item.id)}
              />
            )}
          />
        </View>

        <View style={styles.main}>
          <FlatList
            data={PRICE_RANGES}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipList}
            ListHeaderComponent={
              <>
                <TouchableOpacity
                  style={[styles.chip, minRating === 4 && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setMinRating(minRating === 4 ? undefined : 4)}
                >
                  <Ionicons name="star" size={12} color={minRating === 4 ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.chipText, minRating === 4 && { color: Colors.white }]}>{t('products.filter.rating4')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, inStockOnly && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setInStockOnly((v) => !v)}
                >
                  <Text style={[styles.chipText, inStockOnly && { color: Colors.white }]}>{t('products.filter.inStock')}</Text>
                </TouchableOpacity>
                {[15, 20, 30].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[styles.chip, deliveryFilter === mins && { backgroundColor: accent, borderColor: accent }]}
                    onPress={() => setDeliveryFilter(deliveryFilter === mins ? null : mins)}
                  >
                    <Ionicons name="flash-outline" size={12} color={deliveryFilter === mins ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.chipText, deliveryFilter === mins && { color: Colors.white }]}>Under {mins} min</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.chip, sortByDelivery && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setSortByDelivery((v) => !v)}
                >
                  <Ionicons name={sortByDelivery ? 'arrow-down' : 'swap-vertical'} size={12} color={sortByDelivery ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.chipText, sortByDelivery && { color: Colors.white }]}>Fastest first</Text>
                </TouchableOpacity>
              </>
            }
            renderItem={({ item }) => {
              const active = priceRange?.label === item.label;
              return (
                <TouchableOpacity
                  style={[styles.chip, active && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => setPriceRange(active ? null : item)}
                >
                  <Text style={[styles.chipText, active && { color: Colors.white }]}>
                    {t(`products.price.${item.key}`)}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {loading && products.length === 0 ? (
            <View style={styles.skeletonGrid}>
              {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonProductCard key={i} cardWidth={CARD_WIDTH} />)}
            </View>
          ) : error && products.length === 0 ? (
            <ErrorState message={t('products.error.load')} onRetry={() => { setLoading(true); fetchProducts(1, true); }} />
          ) : (
            <FlatList
              data={visibleProducts}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                hasMore && products.length > 0 ? (
                  <View style={styles.footer}>
                    <ActivityIndicator size="small" color={accent} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyText}>{t('products.empty.noProducts')}</Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <StaggerFadeIn index={index}>
                  <ProductCard
                    product={item}
                    onPress={handleProductPress}
                    onQuickAdd={handleQuickAdd}
                    onVendorPress={handleVendorPress}
                    cardWidth={CARD_WIDTH}
                  />
                </StaggerFadeIn>
              )}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function RailItem({
  label, image, icon, active, accent, accentTint, onPress,
}: {
  label: string; image?: string; icon: string; active: boolean;
  accent: string; accentTint: string; onPress: () => void;
}) {
  // Falls back to the icon instead of a broken-image glyph if imageUrl 404s.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!image && !imageFailed;

  return (
    <TouchableOpacity style={styles.railItem} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.railIndicator, active && { backgroundColor: accent }]} />
      <View style={[styles.railImageWrap, { backgroundColor: active ? accentTint : Colors.background }]}>
        {showImage ? (
          <Image source={{ uri: image }} style={styles.railImage} onError={() => setImageFailed(true)} />
        ) : (
          <Ionicons name={icon as any} size={20} color={active ? accent : Colors.textSecondary} />
        )}
      </View>
      <Text
        style={[styles.railLabel, active && { color: accent, fontFamily: 'Inter_600SemiBold' }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SkeletonProductCard({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={[styles.skeletonCard, { width: cardWidth }]}>
      <Shimmer style={[styles.skeletonImg, { height: cardWidth * 0.95 }]} />
      <Shimmer style={styles.skeletonLine} />
      <Shimmer style={[styles.skeletonLine, { width: '55%' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sortBar: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortLabel: {
    ...Typography.h3,
    color: Colors.text,
  },
  sortOptions: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '500',
  },

  body: {
    flex: 1,
    flexDirection: 'row',
  },

  rail: {
    width: RAIL_WIDTH,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.white,
  },
  railContent: {
    paddingVertical: Spacing.sm,
  },
  railItem: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  railIndicator: {
    position: 'absolute',
    left: 0,
    top: '30%',
    bottom: '30%',
    width: 3,
    borderRadius: 2,
  },
  railImageWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  railImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  railLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  main: {
    flex: 1,
  },
  chipList: {
    flexGrow: 0,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  skeletonCard: {
    marginBottom: Spacing.lg,
  },
  skeletonImg: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  footer: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.text,
  },
});
