import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { Product, WishlistItem } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import ProductCard from '../../components/ProductCard';
import Shimmer from '../../components/Shimmer';
import StaggerFadeIn from '../../components/StaggerFadeIn';
import ErrorState from '../../components/ErrorState';

function SkeletonCard() {
  return (
    <View style={s.skeletonCard}>
      <Shimmer style={s.skeletonImg} />
      <Shimmer style={s.skeletonLine} />
      <Shimmer style={[s.skeletonLine, { width: '55%' }]} />
    </View>
  );
}

export default function WishlistScreen() {
  const { addToCart, incrementCart } = useStore();
  const { open: openProduct } = useProductSheet();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifyingIds, setNotifyingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await customerApi.getWishlist();
      const list = Array.isArray(res) ? res : (res as any)?.data || [];
      setItems(list);
      setNotifyingIds(new Set(list
        .map((i: WishlistItem) => i.productId)
        .filter((id: string) => customerApi.isSubscribedToRestock(id))));
      setError(false);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNotifyRestock = async (product: Product) => {
    const alreadyNotifying = notifyingIds.has(product.id);
    setNotifyingIds((prev) => {
      const next = new Set(prev);
      if (alreadyNotifying) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
    try {
      if (alreadyNotifying) await customerApi.unsubscribeRestock(product.id);
      else await customerApi.subscribeRestock(product.id);
    } catch {
      // revert on failure
      setNotifyingIds((prev) => {
        const next = new Set(prev);
        if (alreadyNotifying) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRemove = async (product: Product) => {
    setItems((prev) => prev.filter((i) => i.productId !== product.id));
    await customerApi.removeFromWishlist(product.id).catch(() => load());
  };

  const handleQuickAdd = async (product: Product) => {
    incrementCart();
    await addToCart(product.id, 1).catch(() => {});
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Favourites</Text>
      </View>

      {loading ? (
        <View style={s.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <ErrorState message="Couldn't load your favourites" onRetry={load} />
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>🤍</Text>
          <Text style={s.emptyTitle}>No favourites yet</Text>
          <Text style={s.emptySubtitle}>Tap the heart on any product to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          renderItem={({ item, index }) => (
            <StaggerFadeIn index={index}>
              <ProductCard
                product={item.product}
                onPress={(p) => openProduct(p.id)}
                onQuickAdd={handleQuickAdd}
                isWishlisted
                onToggleWishlist={handleRemove}
                isNotifying={notifyingIds.has(item.productId)}
                onNotifyRestock={handleNotifyRestock}
              />
            </StaggerFadeIn>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, color: Colors.text },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  grid: { padding: Spacing.lg },
  row: { justifyContent: 'space-between' },

  skeletonGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  skeletonCard: { width: '48%', marginBottom: Spacing.lg },
  skeletonImg: { height: 140, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  skeletonLine: { height: 12, borderRadius: 6, width: '90%', marginBottom: 6 },
});
