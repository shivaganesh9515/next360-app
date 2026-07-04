import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, LayoutAnimation, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';
import { CartItem as CartItemType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

function CartItemRow({ item, onQuantityChange, onRemove }: {
  item: CartItemType;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (newQty: number) => {
    if (newQty < 1) {
      onRemove(item.id);
      return;
    }
    setUpdating(true);
    await onQuantityChange(item.id, newQty);
    setUpdating(false);
  };

  return (
    <View style={[styles.cartItem, Shadows.card]}>
      <Image
        source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/80' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product?.name || 'Product'}</Text>
        <Text style={styles.itemUnit}>{item.product?.unit || 'per unit'}</Text>
        <Text style={styles.itemPrice}>₹{Number(item.product?.price || 0).toFixed(0)}</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.quantity - 1)}
          disabled={updating}
        >
          <Ionicons name="remove" size={16} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item.quantity + 1)}
          disabled={updating}
        >
          <Ionicons name="add" size={16} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={17} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen({ navigation }: any) {
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
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          await removeCartItem(itemId);
        },
      },
    ]);
  };

  const handleClearCart = async () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: clearCart,
      },
    ]);
  };

  const DELIVERY_FEE = 40;
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
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some items to get started</Text>
          <TouchableOpacity
            style={[styles.shopButton, Shadows.button(Colors.organic)]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart ({cartCount} items)</Text>
        <TouchableOpacity onPress={handleClearCart} hitSlop={8}>
          <Text style={styles.clearText}>Clear All</Text>
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
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValue}>{formatCurrency(DELIVERY_FEE)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal + DELIVERY_FEE)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, Shadows.button(Colors.organic)]}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout ({cartCount} items)
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 2,
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
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
