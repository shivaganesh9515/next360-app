import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Typography, getStoreAccent } from '../constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
}

export default function ProductCard({ product, onPress, onQuickAdd, isWishlisted, onToggleWishlist }: Props) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;
  const accent = getStoreAccent(product.storeType);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(product)} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: accent + '20' }]}>
            <Text style={styles.placeholderText}>🌿</Text>
          </View>
        )}
        {/* Discount badge */}
        {hasDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: Colors.error }]}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
        {/* Wishlist */}
        {onToggleWishlist && (
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={() => onToggleWishlist(product)}
          >
            <Text style={{ fontSize: 18 }}>{isWishlisted ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.category} numberOfLines={1}>
          {product.category?.name || product.storeType}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.unit}>{product.unit}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: accent }]}>₹{product.price}</Text>
          {hasDiscount && (
            <Text style={styles.oldPrice}>₹{product.compareAtPrice}</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          {product.rating ? (
            <Text style={styles.rating}>⭐ {product.rating.toFixed(1)}</Text>
          ) : null}
        </View>
      </View>

      {/* Quick add button */}
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: accent }]}
        onPress={() => onQuickAdd(product)}
      >
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'visible',
    position: 'relative',
  },
  imageContainer: {
    height: CARD_WIDTH * 0.9,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
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
  placeholderText: {
    fontSize: 40,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  discountText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
  },
  wishlistBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.md,
  },
  category: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  unit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  price: {
    ...Typography.h3,
    fontWeight: '700',
  },
  oldPrice: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  addBtn: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  addBtnText: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 22,
  },
});
