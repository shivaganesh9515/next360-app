import React, { useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadows, getStoreAccent, getStoreAccentLight, getStoreCardBorder, SPRING_CONFIG } from '../constants/theme';
import { useFlyToCart } from '../lib/flyToCart';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  // Overrides the default full-width-grid sizing — needed when the card sits
  // in a narrower pane (e.g. the products page's category rail layout) instead
  // of a full-width 2-column grid.
  cardWidth?: number;
  // Shown in place of the quick-add button when the product is out of stock —
  // previously there was no out-of-stock handling anywhere in this card at
  // all, so an out-of-stock item could be quick-added to the cart exactly
  // like an in-stock one, with no visual indication it was unavailable.
  isNotifying?: boolean;
  onNotifyRestock?: (product: Product) => void;
  // Navigates to the Vendor Storefront screen for this product's vendor —
  // shown as a tap-able vendor name below the product name.
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

  // Spring micro-interactions — heart button pops on wishlist toggle,
  // quick-add button scales down on press and springs back on release.
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
        {/* Category pill — overlaid on the photo, not a separate text line below it */}
        <View style={[styles.categoryBadge, { backgroundColor: accentTint }]}>
          <Text style={[styles.categoryBadgeText, { color: accent }]} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>
        {/* Discount badge — bottom-left, mirrors the quick-add button on the
            bottom-right so the two floating corners stay symmetric */}
        {hasDiscount && !isOutOfStock && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay} pointerEvents="none">
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        {/* Organic certification badge — shown when the product has a
            certification label attached (USDA Organic, India Organic, etc.)
            differentiating it from uncertified products. */}
        {product.certification && (
          <View style={styles.certBadge}>
            <Ionicons name="leaf" size={10} color="#FFFFFF" />
            <Text style={styles.certBadgeText}>{product.certification}</Text>
          </View>
        )}
        {/* Wishlist — springs 1→1.3→1 on tap for tactile heart-pulse
            feedback that makes the toggle feel responsive even before the
            network round-trip resolves. */}
        {onToggleWishlist && (
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
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

      {/* Floating quick-add button, overlapping the image/info seam — lives outside
          imageContainer since that clips to rounded corners with overflow:hidden.
          Swapped for a restock-notify bell when out of stock, since quick-add
          would otherwise silently add an unavailable item to the cart. */}
      {isOutOfStock ? (
        onNotifyRestock && (
          <TouchableOpacity
            style={[
              styles.addBtn,
              Shadows.button(Colors.textSecondary),
              { backgroundColor: isNotifying ? Colors.textSecondary : Colors.white, top: resolvedWidth * 0.95 - 20, borderWidth: 1.5, borderColor: Colors.textSecondary },
            ]}
            onPress={() => onNotifyRestock(product)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name={isNotifying ? 'notifications' : 'notifications-outline'} size={18} color={isNotifying ? Colors.white : Colors.textSecondary} />
          </TouchableOpacity>
        )
      ) : (
        <Animated.View style={{ transform: [{ scale: addScale }] }}>
          <TouchableOpacity
            style={[
              styles.addBtn,
              Shadows.button(accent),
              { backgroundColor: accent, top: resolvedWidth * 0.95 - 20 },
            ]}
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
        {/* Vendor name — tappable, navigates to the vendor storefront.
            Previously there was no way to see or find the vendor of a
            product from the card at all — this is the missing connection
            between a product and the store that sells it. */}
        {product.vendor?.storeName && onVendorPress && (
          <TouchableOpacity
            onPress={() => onVendorPress(product.vendor!.id, product.vendor!.storeName)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={styles.vendorRow}
          >
            <Ionicons name="storefront-outline" size={11} color={accent} />
            <Text style={[styles.vendorName, { color: accent }]} numberOfLines={1}>
              {product.vendor.storeName}
            </Text>
          </TouchableOpacity>
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
  // Category pill overlaid directly on the photo (top-left) — adapted from the
  // Stitch-generated reference — instead of a separate gray text line below it.
  categoryBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    maxWidth: '70%',
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
  // Bottom-left, mirroring the quick-add squircle on the bottom-right, since
  // the category pill now occupies the top-left corner.
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
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28,27,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.white,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  certBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#5C6B4D',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  certBadgeText: {
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
  // Vendor name link — sits between the product name and the meta row,
  // giving users a way to explore a store's full catalog from any card.
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  vendorName: {
    ...Typography.caption,
    fontFamily: 'Inter_600SemiBold',
    textDecorationLine: 'underline',
  },
  name: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
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
  // Bold squircle instead of a plain circle — a sharper, more graphic accent
  // shape (adapted from the Behance reference's squared "+" buttons) that
  // reads as more confident than a soft circle against the rounded card.
  addBtn: {
    position: 'absolute',
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
