import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadows, getStoreAccent, getStoreCardBorder } from '../constants/theme';

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
  const cardBorder = getStoreCardBorder(product.storeType);

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.card, { borderColor: cardBorder }]}
      onPress={() => onPress(product)}
      activeOpacity={0.92}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: accent + '1A' }]}>
            <Text style={styles.placeholderText}>🌿</Text>
          </View>
        )}
        {/* Discount badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
        {/* Wishlist */}
        {onToggleWishlist && (
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={() => onToggleWishlist(product)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={15}
              color={isWishlisted ? Colors.error : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Floating quick-add button, overlapping the image/info seam — lives outside
          imageContainer since that clips to rounded corners with overflow:hidden */}
      <TouchableOpacity
        style={[styles.addBtn, Shadows.button(accent), { backgroundColor: accent }]}
        onPress={() => onQuickAdd(product)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="add" size={20} color={Colors.white} />
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.category} numberOfLines={1}>
          {product.category?.name || product.storeType}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.unit}>{product.unit}</Text>
          {!!product.rating && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={10} color={Colors.brass} />
              <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{product.price}</Text>
          {hasDiscount && (
            <Text style={styles.oldPrice}>₹{product.compareAtPrice}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'visible',
    position: 'relative',
  },
  imageContainer: {
    height: CARD_WIDTH * 0.95,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
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
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error,
  },
  discountText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  wishlistBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Spacing.md,
    paddingTop: Spacing.md + 6,
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
    fontFamily: 'Inter_600SemiBold',
    marginTop: 2,
    minHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  unit: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  price: {
    ...Typography.h3,
    color: Colors.brass,
  },
  oldPrice: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    position: 'absolute',
    top: CARD_WIDTH * 0.95 - 18,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
