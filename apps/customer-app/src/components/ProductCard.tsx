import React, { useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { Colors, Spacing, BorderRadius, Typography, Shadows, SPRING_CONFIG } from '../constants/theme';
import { useFlyToCart } from '../lib/flyToCart';
import TrustBadge from './TrustBadge';

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
  // Flat single-brand-green styling — one Next360 green across every
  // product card, regardless of store type (Organic/Natural/Eco-friendly
  // still show their category label, just no longer tint the whole card).
  const accent = Colors.primary;
  const accentTint = Colors.primaryLight;
  const cardBorder = Colors.border;
  const categoryLabel = product.category?.name || product.storeType;
  const { width: screenWidth } = useWindowDimensions();
  // Tablet-safe cap: card-width math is bounded to a phone-like width on
  // large screens so cards don't stretch to oversized dimensions on iPad.
  const cardBasisWidth = Math.min(screenWidth, 768);
  const defaultCardWidth = (cardBasisWidth - Spacing.lg * 3) / 2;
  const resolvedWidth = cardWidth ?? defaultCardWidth;
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

  // Organic only ever shows as verified when the vendor has an admin-approved
  // NPOP certificate on file (vendor.isNpopVerified, from the real API field —
  // never assumed true just because storeType is ORGANIC). Natural/Eco-friendly
  // always render as self-declared per the PRD's non-negotiable UI rule.
  const trustBadgeType = product.storeType === 'ORGANIC'
    ? (product.vendor?.isNpopVerified ? 'NPOP' : 'NPOP_PENDING')
    : product.storeType === 'NATURAL' ? 'NATURAL'
    : product.storeType === 'ECO_FRIENDLY' ? 'ECO_FRIENDLY'
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, Shadows.card, { borderColor: cardBorder, width: resolvedWidth }]}
      onPress={() => onPress(product)}
      activeOpacity={0.92}
    >
      {/* Image Container */}
      <View ref={imageRef} collapsable={false} style={[styles.imageContainer, { height: resolvedWidth * 0.92 }]}>
        {product.images?.[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: accent + '1A' }]}>
            <Ionicons name="leaf-outline" size={40} color={accent} />
          </View>
        )}

        {/* Category pill — overlaid top-left */}
        <View style={[styles.categoryBadge, { backgroundColor: accentTint }]}>
          <Text style={[styles.categoryBadgeText, { color: accent }]} numberOfLines={1}>
            {categoryLabel}
          </Text>
        </View>

        {/* Trust badge — below category badge */}
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

        {/* Dynamic Solid Rating badge — bottom-right */}
        {!!product.rating && (
          <View style={[styles.ratingOverlay, { backgroundColor: accent }]}>
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            <Ionicons name="star" size={9} color={Colors.white} />
          </View>
        )}

        {isOutOfStock && (
          <View style={[styles.outOfStockOverlay, { pointerEvents: 'none' }]}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Wishlist Heart Overlay */}
        {onToggleWishlist && (
          <Animated.View style={{ position: 'absolute', top: Spacing.sm, right: Spacing.sm, transform: [{ scale: heartScale }] }}>
            <TouchableOpacity
              style={styles.wishlistBtn}
              onPress={handleHeartPress}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={14}
                color={isWishlisted ? Colors.error : Colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.info}>
        {/* Product Title */}
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Vendor Detail Row */}
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

        {/* Zomato-style dynamic delivery speed subtitle */}
        <View style={styles.deliveryRow}>
          <Ionicons name="time-outline" size={10} color="#76767A" />
          <Text style={styles.deliveryText}>
            {(() => {
              const min = product.vendor?.deliveryTimeMin;
              const max = product.vendor?.deliveryTimeMax;
              const label = product.vendor?.deliveryLabel;
              if (min != null && max != null) {
                return `${min}-${max} mins` + (label ? ` • ${label}` : '');
              }
              // Fallback for products without vendor delivery data
              return product.storeType === 'ORGANIC' ? '10-15 mins • Farm Direct'
                : product.storeType === 'NATURAL' ? '15-20 mins • Handcrafted'
                : '20-25 mins • Eco-Safe';
            })()}
          </Text>
        </View>

        {/* Hairline Divider */}
        <View style={styles.divider} />

        {/* Price & ADD Action Row */}
        <View style={styles.priceAddRow}>
          <View style={styles.priceCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.price}>₹{product.price}</Text>
              {hasDiscount && (
                <Text style={styles.oldPrice}>₹{product.compareAtPrice}</Text>
              )}
            </View>
            <Text style={styles.unitText}>{product.unit}</Text>
          </View>

          {/* ADD Button or Out of Stock option */}
          {isOutOfStock ? (
            onNotifyRestock && (
              <TouchableOpacity
                style={[styles.notifyBtn, { borderColor: Colors.textSecondary }]}
                onPress={() => onNotifyRestock(product)}
                activeOpacity={0.85}
              >
                <Ionicons name={isNotifying ? 'notifications' : 'notifications-outline'} size={12} color={Colors.textSecondary} />
                <Text style={[styles.notifyText, { color: Colors.textSecondary }]}>Notify</Text>
              </TouchableOpacity>
            )
          ) : (
            <Animated.View style={{ transform: [{ scale: addScale }] }}>
              <TouchableOpacity
                style={[styles.addBtnFilled, { backgroundColor: accent }, Shadows.button(accent)]}
                onPress={handleQuickAdd}
                onPressIn={handleQuickAddPressIn}
                onPressOut={handleQuickAddPressOut}
                activeOpacity={0.85}
              >
                <Text style={styles.addBtnLabel}>Add</Text>
                <Ionicons name="add" size={13} color={Colors.white} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    elevation: 2,
  },
  imageContainer: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F5',
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
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  trustBadgeWrap: {
    position: 'absolute',
    top: Spacing.sm + 20,
    left: Spacing.sm,
    maxWidth: '55%',
  },

  discountBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  discountText: {
    fontSize: 9, fontFamily: 'Inter_700Bold', color: Colors.white, letterSpacing: 0.3,
  },

  ratingOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFFFFF',
  },

  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28,27,23,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.white,
    letterSpacing: 0.4, textTransform: 'uppercase',
  },
  wishlistBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  info: {
    padding: 10,
  },

  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  vendorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  vendorName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    textDecorationLine: 'underline',
  },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  deliveryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#76767A',
  },

  name: {
    color: '#1C1C1E',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13.5,
    lineHeight: 18,
    minHeight: 36,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F3F3',
    marginVertical: 6,
  },

  priceAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  priceCol: {
    flexDirection: 'column',
  },
  price: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 15,
    color: '#1C1C1E',
  },
  oldPrice: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#76767A',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  unitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#76767A',
    marginTop: 1,
  },

  addBtnFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addBtnLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },

  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notifyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
});
