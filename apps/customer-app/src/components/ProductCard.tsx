import React, { useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadows, getStoreAccent, getStoreAccentLight, getStoreCardBorder, SPRING_CONFIG } from '../constants/theme';
import { useFlyToCart } from '../lib/flyToCart';
import TrustBadge from './TrustBadge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  cardWidth?: number;
  isNotifying?: boolean;
  onNotifyRestock?: (product: Product) => void;
  onVendorPress?: (vendorId: string, vendorName: string) => void;
}

export default function ProductCard({
  product, onPress, onQuickAdd, isWishlisted, onToggleWishlist, cardWidth, isNotifying, onNotifyRestock, onVendorPress,
}: Props) {
  const isOutOfStock = product.status === 'OUT_OF_STOCK' || product.stock <= 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;
  const accent = getStoreAccent(product.storeType);
  const accentTint = getStoreAccentLight(product.storeType);
  const cardBorder = getStoreCardBorder(product.storeType);
  const categoryLabel = product.category?.name || product.storeType;
  const resolvedWidth = cardWidth ?? CARD_WIDTH;
  const imageRef = useRef<View>(null);
  const { fly } = useFlyToCart();

  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, ...SPRING_CONFIG, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }),
    ]).start();
    onToggleWishlist?.(product);
  }, [product, onToggleWishlist]);

  const handleQuickAddPressIn = () => {
    Animated.spring(addScale, { toValue: 0.85, ...SPRING_CONFIG, useNativeDriver: true }).start();
  };

  const handleQuickAddPressOut = () => {
    Animated.spring(addScale, { toValue: 1, ...SPRING_CONFIG, useNativeDriver: true }).start();
  };

  const handleQuickAdd = () => {
    imageRef.current?.measureInWindow((x, y, w, h) => {
      fly({ x, y, width: w, height: h, imageUri: product.images?.[0] });
    });
    onQuickAdd(product);
  };

  // Map storeType to trust badge type
  const trustBadgeType = product.storeType === 'ORGANIC' ? 'ORGANIC'
    : product.storeType === 'NATURAL' ? 'NATURAL'
    : product.storeType === 'ECO_FRIENDLY' ? 'ECO_FRIENDLY'
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.card, { borderColor: cardBorder, width: resolvedWidth }]}
      onPress={() => onPress(product)}
      activeOpacity={0.92}
    >
      {/* Image */}
      <View ref={imageRef} collapsable={false} style={[styles.imageContainer, { height: resolvedWidth * 0.95 }]}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: accent + '1A' }]}>
            <Text style={styles.placeholderText}>🌿</Text>
          </View>
        )}

        {/* Category pill — overlaid top-left */}
        <View style={[styles.categoryBadge, { backgroundColor: accentTint }]}>
          <Text style={[styles.categoryBadgeText, { color: accent }]} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>

        {/* Trust badge — positioned below the category pill on the left,
            to avoid overlapping with the wishlist heart on the right */}
        {trustBadgeType && (
          <View style={styles.trustBadgeWrap}>
            <TrustBadge type={trustBadgeType} size="sm" />
          </View>
        )}

        {/* Discount badge — bottom-left */}
        {hasDiscount && !isOutOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {isOutOfStock && (
          <View style={[styles.outOfStockOverlay, { pointerEvents: 'none' }]}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Wishlist */}
        {onToggleWishlist && (
          <Animated.View style={{ position: 'absolute', top: Spacing.sm, right: Spacing.sm, transform: [{ scale: heartScale }] }}>
            <TouchableOpacity
              style={styles.wishlistBtn}
              onPress={handleHeartPress}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={15}
                color={isWishlisted ? Colors.error : Colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Floating quick-add / restock-notify */}
      {isOutOfStock ? (
        onNotifyRestock && (
          <TouchableOpacity
            style={[styles.addBtn, Shadows.button(Colors.textSecondary), { backgroundColor: isNotifying ? Colors.textSecondary : Colors.white, top: resolvedWidth * 0.95 - 20, borderWidth: 1.5, borderColor: Colors.textSecondary }]}
            onPress={() => onNotifyRestock(product)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name={isNotifying ? 'notifications' : 'notifications-outline'} size={18} color={isNotifying ? Colors.white : Colors.textSecondary} />
          </TouchableOpacity>
        )
      ) : (
        <Animated.View style={{ position: 'absolute', right: Spacing.md, top: resolvedWidth * 0.95 - 20, transform: [{ scale: addScale }] }}>
          <TouchableOpacity
            style={[styles.addBtnInline, Shadows.button(accent), { backgroundColor: accent }]}
            onPress={handleQuickAdd}
            onPressIn={handleQuickAddPressIn}
            onPressOut={handleQuickAddPressOut}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="add" size={20} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Vendor name — tappable, underlined, more prominent */}
        {product.vendor?.storeName && onVendorPress && (
          <TouchableOpacity
            onPress={() => onVendorPress(product.vendor!.id, product.vendor!.storeName)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={styles.vendorRow}
          >
            <View style={[styles.vendorDot, { backgroundColor: accent }]} />
            <Text style={[styles.vendorName, { color: accent }]} numberOfLines={1}>
              {product.vendor.storeName}
            </Text>
          </TouchableOpacity>
        )}

        {/* Trust badge inline for certification */}
        {product.certification && (
          <View style={styles.certRow}>
            <TrustBadge type={product.certification.toUpperCase().includes('NPOP') ? 'NPOP' : trustBadgeType || 'ORGANIC'} size="sm" variant="inline" compact />
          </View>
        )}

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
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 40 },

  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    maxWidth: '55%',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Trust badge sits below the category pill on the left side so it
  // doesn't collide with the wishlist heart on the top-right.
  trustBadgeWrap: {
    position: 'absolute',
    top: Spacing.sm + 22,
    left: Spacing.sm,
    maxWidth: '55%',
  },

  discountBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error,
  },
  discountText: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.white, letterSpacing: 0.3,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28,27,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.white,
    letterSpacing: 0.4, textTransform: 'uppercase',
  },
  wishlistBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  info: {
    padding: Spacing.md,
    paddingTop: Spacing.md + 6,
  },

  // Vendor name — larger, with a colored dot
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  vendorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  vendorName: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    textDecorationLine: 'underline',
  },

  // Certification inline row
  certRow: {
    marginTop: 2,
  },

  name: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
    minHeight: 34,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  unit: { ...Typography.caption, color: Colors.textSecondary },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { ...Typography.caption, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  price: { ...Typography.h3, color: Colors.brass },
  oldPrice: { ...Typography.bodySmall, color: Colors.textSecondary, textDecorationLine: 'line-through' },

  addBtn: {
    position: 'absolute',
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnInline: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
