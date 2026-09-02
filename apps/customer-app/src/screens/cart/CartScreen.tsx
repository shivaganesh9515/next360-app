import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet, Animated,
  ActivityIndicator, Alert, Image, LayoutAnimation, RefreshControl,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/store';
import { getDeliveryFee } from '../../lib/pricing';
import { CartItem as CartItemType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import QuantityStepper from '../../components/QuantityStepper';

function SwipeDeleteAction() {
  return (
    <View style={styles.swipeAction}>
      <Ionicons name="trash-outline" size={22} color={Colors.white} />
      <Text style={styles.swipeActionText}>Remove</Text>
    </View>
  );
}

function CartItemRow({ item, onQuantityChange, onRemove, index }: {
  item: CartItemType;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1, friction: 8, tension: 80,
      delay: Math.min(index, 8) * 30,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1) {
      swipeableRef.current?.close();
      onRemove(item.id);
      return;
    }
    setUpdating(true);
    await onQuantityChange(item.id, newQty);
    setUpdating(false);
  };

  const handleSwipeDelete = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onRemove(item.id);
  };

  // Derive vendor info from the item's product
  const vendorName = (item as any)?.vendorName || (item.product as any)?.vendor?.storeName || (item.product as any)?.vendorName || '';

  return (
    <Animated.View style={{ opacity: entranceAnim, transform: [{ translateX: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.swipeActionContainer}
            onPress={handleSwipeDelete}
            activeOpacity={0.85}
          >
            <SwipeDeleteAction />
          </TouchableOpacity>
        )}
        overshootRight={false}
        onSwipeableOpen={handleSwipeDelete}
      >
        <View style={[styles.cartItem, Shadows.card]}>
          <Image
            source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/80' }}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || t('cart.fallback.productName')}</Text>
            {vendorName ? (
              <View style={styles.vendorRow}>
                <View style={styles.vendorDot} />
                <Text style={styles.vendorName} numberOfLines={1}>{vendorName}</Text>
              </View>
            ) : null}
            <Text style={styles.itemUnit}>{item.product?.unit || t('cart.fallback.unit')}</Text>
            <Text style={styles.itemPrice}>₹{Number(item.product?.price || 0).toFixed(0)}</Text>
          </View>
          <QuantityStepper
            value={item.quantity}
            onDecrement={() => handleQuantityChange(item.quantity - 1)}
            onIncrement={() => handleQuantityChange(item.quantity + 1)}
            disabled={updating}
          />
        </View>
      </Swipeable>
    </Animated.View>
  );
}

export default function CartScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { cartItems, fetchCart, updateCartItem, removeCartItem, clearCart, cartCount, subtotal } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Staggered entrance for summary sections
  const summaryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCart();
    Animated.spring(summaryAnim, { toValue: 1, friction: 7, tension: 80, delay: 200, useNativeDriver: true }).start();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    await fetchCart();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await updateCartItem(itemId, newQty);
  };

  const handleRemove = async (itemId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await removeCartItem(itemId);
  };

  const handleClearCart = async () => {
    Alert.alert(t('cart.alert.clearCart.title'), t('cart.alert.clearCart.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
        style: 'destructive',
        onPress: clearCart,
      },
    ]);
  };

  const DELIVERY_FEE = getDeliveryFee(subtotal);
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const total = subtotal + DELIVERY_FEE;

  // Group items by vendor for section headers with delivery info
  const sections = useMemo(() => {
    const groups: Record<string, { data: CartItemType[]; vendor?: any }> = {};
    cartItems.forEach((item: any) => {
      const vendor = item?.product?.vendor;
      const name = item?.vendorName || vendor?.storeName || item?.product?.vendorName || 'Other';
      if (!groups[name]) groups[name] = { data: [], vendor };
      groups[name].data.push(item);
    });
    return Object.entries(groups).map(([vendorName, { data, vendor }]) => ({
      title: vendorName,
      vendor,
      subtotal: data.reduce((sum: number, item: any) => {
        const price = Number(item.product?.price || 0);
        return sum + price * item.quantity;
      }, 0),
      data,
    }));
  }, [cartItems]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.organic} />
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconRing}>
            <Ionicons name="bag-handle-outline" size={48} color={Colors.organic} />
          </View>
          <Text style={styles.emptyTitle}>{t('cart.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('cart.empty.subtitle')}</Text>
          <TouchableOpacity
            style={[styles.shopButton, Shadows.button(Colors.organic)]}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="storefront-outline" size={16} color={Colors.white} />
            <Text style={styles.shopButtonText}>{t('cart.empty.startShopping')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('cart.header.title', { count: cartCount })}</Text>
          <Text style={styles.headerSubtitle}>{sections.length} vendor{sections.length > 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity onPress={handleClearCart} hitSlop={8}>
          <Text style={styles.clearText}>{t('cart.header.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items grouped by vendor */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => {
          const min = section.vendor?.deliveryTimeMin;
          const max = section.vendor?.deliveryTimeMax;
          const label = section.vendor?.deliveryLabel;
          const vendorId = section.vendor?.id;
          return (
            <TouchableOpacity
              style={styles.vendorSectionHeader}
              activeOpacity={0.7}
              onPress={() => {
                if (vendorId) {
                  navigation.navigate('VendorStorefront', { vendorId, vendorName: section.title });
                }
              }}
            >
              <View style={styles.vendorSectionLeft}>
                <View style={[styles.vendorSectionDot, { backgroundColor: Colors.organic }]} />
                <Text style={styles.vendorSectionName}>{section.title}</Text>
                <Text style={styles.vendorSectionCount}>{section.data.length} item{section.data.length > 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.vendorSectionRight}>
                <Text style={styles.vendorSectionSubtotal}>₹{section.subtotal.toLocaleString('en-IN')}</Text>
                {min != null && max != null && (
                  <View style={styles.vendorSectionDelivery}>
                    <Ionicons name="time-outline" size={11} color={Colors.organic} />
                    <Text style={styles.vendorSectionDeliveryText}>
                      {min}-{max} min{label ? ` • ${label}` : ''}
                    </Text>
                  </View>
                )}
                {vendorId && (
                  <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} style={{ marginLeft: 2 }} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        renderItem={({ item, index }) => (
          <CartItemRow
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            index={index}
          />
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.organic]} />
        }
      />

      {/* Bottom Summary Card */}
      <Animated.View style={[styles.summaryBar, Shadows.raised, { opacity: summaryAnim, transform: [{ translateY: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
        <View style={styles.summaryInner}>
          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.summary.subtotal')}</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('cart.summary.delivery')}</Text>
              <Text style={[styles.summaryValue, DELIVERY_FEE === 0 && styles.summaryValueFree]}>
                {DELIVERY_FEE === 0 ? t('common.free') : formatCurrency(DELIVERY_FEE)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('cart.summary.total')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.checkoutButton, Shadows.button(Colors.organic)]}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Text style={styles.checkoutButtonText}>
              {t('cart.checkout.proceed', { count: cartCount })}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 220,
  },
  vendorSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: 4,
  },
  vendorSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  vendorSectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vendorSectionName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  vendorSectionCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  vendorSectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorSectionSubtotal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.brass,
  },
  vendorSectionDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.organicLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  vendorSectionDeliveryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.organic,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  itemName: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  vendorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.organic,
  },
  vendorName: {
    ...Typography.caption,
    color: Colors.organic,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  itemUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    ...Typography.h3,
    color: Colors.brass,
    marginTop: 4,
  },
  swipeActionContainer: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  swipeAction: {
    width: 80,
    height: '100%',
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeActionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.organicLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.organic,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xl,
  },
  shopButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
  summaryBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  summaryInner: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  summaryRows: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  summaryValue: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  summaryValueFree: {
    color: Colors.organic,
    fontFamily: 'Inter_600SemiBold',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: 4,
  },
  totalLabel: {
    ...Typography.h3,
    color: Colors.text,
  },
  totalValue: {
    ...Typography.h2,
    color: Colors.brass,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.organic,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md + 2,
  },
  checkoutButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
