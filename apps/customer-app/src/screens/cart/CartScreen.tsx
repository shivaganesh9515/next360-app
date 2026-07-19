import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Animated,
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

function CartItemRow({ item, onQuantityChange, onRemove }: {
  item: CartItemType;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }).start();
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

  return (
    <Animated.View style={{ opacity: entranceAnim, transform: [{ translateX: entranceAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
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

  useEffect(() => {
    loadCart();
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
  const formatCurrency = (amount: number) => `₹${amount.toFixed(0)}`;

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
          <Ionicons name="bag-handle-outline" size={72} color={Colors.border} />
          <Text style={styles.emptyTitle}>{t('cart.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('cart.empty.subtitle')}</Text>
          <TouchableOpacity
            style={[styles.shopButton, Shadows.button(Colors.organic)]}
            onPress={() => navigation.navigate('Home')}
          >
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
        <Text style={styles.headerTitle}>{t('cart.header.title', { count: cartCount })}</Text>
        <TouchableOpacity onPress={handleClearCart} hitSlop={8}>
          <Text style={styles.clearText}>{t('cart.header.clearAll')}</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.organic]} />
        }
      />

      {/* Bottom Summary */}
      <View style={[styles.summaryBar, Shadows.raised]}>
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
          <Text style={styles.totalValue}>{formatCurrency(subtotal + DELIVERY_FEE)}</Text>
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
  clearText: {
    ...Typography.bodySmall,
    color: Colors.error,
    fontFamily: 'Inter_600SemiBold',
  },
  listContent: {
    padding: Spacing.lg,
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
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  shopButton: {
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
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
    marginTop: Spacing.md,
  },
  checkoutButtonText: {
    ...Typography.button,
    color: Colors.white,
  },
});
