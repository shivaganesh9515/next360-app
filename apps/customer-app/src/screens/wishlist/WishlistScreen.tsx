import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { Product, WishlistItem } from '../../types';
import { Colors, Typography, Spacing } from '../../constants/theme';
import ProductCard from '../../components/ProductCard';

export default function WishlistScreen() {
  const { addToCart, incrementCart } = useStore();
  const { open: openProduct } = useProductSheet();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await customerApi.getWishlist();
      setItems(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRemove = async (product: Product) => {
    setItems((prev) => prev.filter((i) => i.productId !== product.id));
    await customerApi.removeFromWishlist(product.id).catch(() => load());
  };

  const handleQuickAdd = async (product: Product) => {
    incrementCart();
    await addToCart(product.id, 1).catch(() => {});
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.organic} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Favourites</Text>
      </View>

      {items.length === 0 ? (
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
          renderItem={({ item }) => (
            <ProductCard
              product={item.product}
              onPress={(p) => openProduct(p.id)}
              onQuickAdd={handleQuickAdd}
              isWishlisted
              onToggleWishlist={handleRemove}
            />
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
});
