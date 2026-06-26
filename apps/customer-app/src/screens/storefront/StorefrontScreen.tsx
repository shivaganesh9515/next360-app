import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions, Image,
  Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../lib/store';
import { customerApi } from '../../lib/api';
import { Product, Category, Offer, StoreType } from '../../types';
import StoreToggle from '../../components/StoreToggle';
import CategoryChip from '../../components/CategoryChip';
import ProductCard from '../../components/ProductCard';
import {
  Colors, Spacing, BorderRadius, Typography,
  getStoreAccent, getStoreAccentLight,
} from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function StorefrontScreen({ navigation }: any) {
  const { storeType, setStoreType } = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const accent = getStoreAccent(storeType);
  const accentLight = getStoreAccentLight(storeType);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes, offersRes] = await Promise.all([
        customerApi.getProducts({ storeType, limit: 10, sort: 'trending' }),
        customerApi.getCategories({ storeType }),
        customerApi.getActiveOffers(storeType),
      ]);
      setProducts(productsRes.data || productsRes || []);
      setCategories(categoriesRes || []);
      setOffers(offersRes || []);
    } catch (err) {
      // Silently fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [storeType]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const onStoreChange = async (type: StoreType) => {
    await setStoreType(type);
    setSelectedCategory(null);
  };

  const handleQuickAdd = (product: Product) => {
    customerApi.addToCart(product.id, 1)
      .then(() => Alert.alert('Added', `${product.name} added to cart`))
      .catch(() => Alert.alert('Error', 'Please sign in to add items'));
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const renderHero = () => (
    <View style={styles.heroContainer}>
      <Text style={styles.heroTitle}>
        Fresh & {storeType === 'ORGANIC' ? 'Organic' : storeType === 'NATURAL' ? 'Natural' : 'Eco-friendly'}
      </Text>
      <Text style={styles.heroSubtitle}>Delivered to your doorstep</Text>
      <View style={[styles.heroBadge, { backgroundColor: accent }]}>
        <Text style={styles.heroBadgeText}>Free delivery on first order</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
        ListHeaderComponent={
          <>
            {/* Store Toggle */}
            <View style={styles.toggleWrapper}>
              <StoreToggle selected={storeType} onSelect={onStoreChange} />
            </View>

            {renderHero()}

            {/* Offers strip */}
            {offers.length > 0 && (
              <View style={styles.offersStrip}>
                <Text style={styles.sectionTitle}>Offers</Text>
                <FlatList
                  data={offers}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.offersList}
                  renderItem={({ item }) => (
                    <View style={[styles.offerCard, { backgroundColor: accentLight }]}>
                      <Text style={[styles.offerTitle, { color: accent }]}>{item.title}</Text>
                      <Text style={styles.offerDesc}>
                        {item.discountType === 'PERCENTAGE'
                          ? `${item.discountValue}% OFF`
                          : `₹${item.discountValue} OFF`}
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <View style={styles.categoriesStrip}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                  renderItem={({ item }) => (
                    <CategoryChip
                      label={item.name}
                      isActive={selectedCategory === item.id}
                      onPress={() => {
                        if (selectedCategory === item.id) {
                          setSelectedCategory(null);
                        } else {
                          setSelectedCategory(item.id);
                          navigation.navigate('ProductList', {
                            storeType,
                            categoryId: item.id,
                            categoryName: item.name,
                          });
                        }
                      }}
                    />
                  )}
                />
              </View>
            )}

            {/* Trending */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProductList', { storeType })}>
                <Text style={[styles.seeAll, { color: accent }]}>See All</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>No products yet</Text>
            <Text style={styles.emptySub}>Check back soon for new arrivals</Text>
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
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  toggleWrapper: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  heroContainer: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  heroBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  offersStrip: {
    marginBottom: Spacing.xl,
  },
  offersList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  offerCard: {
    width: width * 0.55,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  offerTitle: {
    ...Typography.h3,
  },
  offerDesc: {
    ...Typography.bodySmall,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  categoriesStrip: {
    marginBottom: Spacing.lg,
  },
  categoriesList: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  seeAll: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.text,
  },
  emptySub: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
