import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, StyleSheet,
  RefreshControl, TouchableOpacity, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { Product, StoreType } from '../../types';
import ProductCard from '../../components/ProductCard';
import {
  Colors, Spacing, BorderRadius, Typography,
  getStoreAccent, getStoreAccentLight,
} from '../../constants/theme';

const SORT_OPTIONS = [
  { key: 'trending', label: 'Trending' },
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low' },
  { key: 'price_desc', label: 'Price: High' },
  { key: 'rating', label: 'Rating' },
];

export default function ProductListScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { storeType, categoryId, categoryName } = route.params || {};

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('trending');

  const accent = getStoreAccent(storeType || 'ORGANIC');

  const fetchProducts = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      const params: Record<string, any> = {
        storeType: storeType || undefined,
        sort: sortBy,
        limit: 12,
        page: pageNum,
      };
      if (categoryId) params.categoryId = categoryId;

      const res = await customerApi.getProducts(params);
      const data = res.data || res || [];
      if (isRefresh || pageNum === 1) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 12);
    } catch (err) {
      // empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeType, categoryId, sortBy]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts(1, true);
  }, [fetchProducts]);

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
    customerApi.addToCart(product.id, 1)
      .then(() => Alert.alert('Added', `${product.name} added to cart`))
      .catch(() => Alert.alert('Error', 'Please sign in to add items'));
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sort bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>
          {categoryName || 'All Products'}
        </Text>
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
              <Text
                style={[styles.sortChipText, sortBy === item.key && { color: Colors.white }]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={handleProductPress}
              onQuickAdd={handleQuickAdd}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortBar: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  sortLabel: {
    ...Typography.h3,
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
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
  listContent: {
    paddingTop: Spacing.md,
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
