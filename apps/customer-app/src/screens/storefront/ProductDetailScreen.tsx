import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { Product } from '../../types';
import {
  Colors, Spacing, BorderRadius, Typography, getStoreAccent,
} from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { productId } = route.params || {};

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showSheet, setShowSheet] = useState(false);

  const accent = product ? getStoreAccent(product.storeType) : Colors.brass;

  useEffect(() => {
    if (productId) {
      customerApi
        .getProduct(productId)
        .then(setProduct)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [productId]);

  const handleAddToCart = async () => {
    try {
      await customerApi.addToCart(productId, quantity);
      setShowSheet(false);
      setQuantity(1);
      Alert.alert('Added to Cart', `${product?.name} × ${quantity}`);
    } catch {
      Alert.alert('Error', 'Please sign in to add items');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brass} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found</Text>
      </SafeAreaView>
    );
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          {product.images?.[0] ? (
            <Image source={{ uri: product.images[0] }} style={styles.image} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: accent + '20' }]}>
              <Text style={styles.placeholderIcon}>🌿</Text>
            </View>
          )}
          {hasDiscount && (
            <View style={[styles.discountBadge, { backgroundColor: Colors.error }]}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.category}>
            {product.category?.name || product.storeType}
          </Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: accent }]}>₹{product.price}</Text>
            {hasDiscount && (
              <Text style={styles.oldPrice}>₹{product.compareAtPrice}</Text>
            )}
          </View>

          {product.rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.rating}>⭐ {product.rating.toFixed(1)}</Text>
              {product.reviewCount && (
                <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
              )}
            </View>
          )}

          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Stock info */}
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Availability:</Text>
            <Text
              style={[
                styles.stockValue,
                { color: product.stock > 0 ? Colors.success : Colors.error },
              ]}
            >
              {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { borderTopColor: accent + '30' }]}>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={[styles.qtyBtn, { borderColor: accent }]}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Text style={[styles.qtyBtnText, { color: accent }]}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, { borderColor: accent }]}
            onPress={() => setQuantity(quantity + 1)}
          >
            <Text style={[styles.qtyBtnText, { color: accent }]}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, { backgroundColor: accent }]}
          onPress={() => setShowSheet(true)}
        >
          <Text style={styles.addToCartText}>Add to Cart • ₹{product.price * quantity}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick-add Bottom Sheet Modal */}
      <Modal
        visible={showSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowSheet(false)}
        >
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {product.name}
            </Text>
            <Text style={[styles.sheetPrice, { color: accent }]}>
              ₹{product.price * quantity} × {quantity} {product.unit}
            </Text>

            {/* Quantity adjustment in sheet */}
            <View style={styles.sheetQuantityRow}>
              <TouchableOpacity
                style={[styles.sheetQtyBtn, { borderColor: accent }]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={[styles.qtyBtnText, { color: accent }]}>−</Text>
              </TouchableOpacity>
              <Text style={styles.sheetQtyText}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.sheetQtyBtn, { borderColor: accent }]}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={[styles.qtyBtnText, { color: accent }]}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: accent }]}
              onPress={handleAddToCart}
            >
              <Text style={styles.sheetButtonText}>
                Add to Cart • ₹{product.price * quantity}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  errorText: {
    ...Typography.h3,
    color: Colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: Colors.white,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 80,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
  infoSection: {
    padding: Spacing.xl,
  },
  category: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    ...Typography.h1,
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  unit: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  price: {
    ...Typography.display,
    fontWeight: '700',
  },
  oldPrice: {
    ...Typography.h3,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  rating: {
    ...Typography.body,
    color: Colors.text,
  },
  reviewCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  descriptionSection: {
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  stockLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  stockValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  qtyText: {
    ...Typography.h3,
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addToCartText: {
    ...Typography.button,
    color: Colors.white,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl + 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  sheetPrice: {
    ...Typography.h3,
    marginTop: Spacing.sm,
  },
  sheetQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.xxl,
  },
  sheetQtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetQtyText: {
    ...Typography.display,
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  sheetButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  sheetButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
