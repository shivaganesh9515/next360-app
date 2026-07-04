import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';
import { customerApi } from '../../lib/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const DELIVERY_FEE = 40;

const PAYMENT_OPTIONS = [
  { key: 'COD' as const, label: 'Cash on Delivery', icon: 'cash-outline' as const },
  { key: 'RAZORPAY' as const, label: 'Pay Online (Razorpay)', icon: 'card-outline' as const },
];

export default function CheckoutScreen({ navigation }: any) {
  const { cartItems, subtotal, clearCart } = useStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res: any = await customerApi.getAddresses();
      const list = res?.data || res || [];
      setAddresses(list);
      const defaultAddr = list.find((a: any) => a.isDefault) || list[0];
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please add a delivery address to continue');
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        addressId: selectedAddress.id,
        items: cartItems.map((item: any) => ({
          productId: item.product?.id || item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
        })),
        paymentMethod,
        notes: notes || undefined,
      };

      const result = await customerApi.createOrder(orderData);
      await clearCart();
      navigation.replace('OrderConfirmation', { orderId: result?.id || result?.data?.id });
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {selectedAddress ? (
            <TouchableOpacity
              style={[styles.addressCard, Shadows.card]}
              onPress={() => navigation.navigate('AddressList', { onSelect: setSelectedAddress })}
            >
              <View style={styles.addressIconWrap}>
                <Ionicons name="location" size={18} color={Colors.organic} />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{selectedAddress.label || 'Address'}</Text>
                <Text style={styles.addressText}>
                  {selectedAddress.fullAddress}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={() => navigation.navigate('AddressList')}
            >
              <Ionicons name="add-circle-outline" size={22} color={Colors.organic} />
              <Text style={styles.addAddressText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({cartItems.length})</Text>
          <View style={[styles.card, Shadows.card]}>
            {cartItems.map((item: any, i: number) => (
              <View key={item.id} style={[styles.orderItem, i === cartItems.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.product?.name || 'Product'} × {item.quantity}
                </Text>
                <Text style={styles.orderItemPrice}>
                  {formatCurrency((item.product?.price || 0) * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentMethod === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.paymentOption, Shadows.card, active && styles.paymentOptionActive]}
                onPress={() => setPaymentMethod(opt.key)}
              >
                <Ionicons name={opt.icon} size={20} color={active ? Colors.organic : Colors.textSecondary} />
                <Text style={[styles.paymentText, active && { color: Colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  {opt.label}
                </Text>
                <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                  {active && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Delivery instructions..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={[styles.card, Shadows.card, { padding: Spacing.lg }]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>{formatCurrency(DELIVERY_FEE)}</Text>
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal + DELIVERY_FEE)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.bottomBar, Shadows.raised]}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            Shadows.button(Colors.organic),
            (!selectedAddress || placing) && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || placing}
        >
          {placing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.placeOrderText}>
              Place Order — {formatCurrency(subtotal + DELIVERY_FEE)}
            </Text>
          )}
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
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  addressIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  addressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addAddressText: {
    ...Typography.bodySmall,
    color: Colors.organic,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: Spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemName: {
    ...Typography.bodySmall,
    color: Colors.text,
    flex: 1,
  },
  orderItemPrice: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
    marginLeft: Spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md + 2,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: Colors.organic,
  },
  paymentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: Colors.organic,
    borderColor: Colors.organic,
  },
  notesInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Typography.bodySmall,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  priceLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  priceValue: {
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  placeOrderButton: {
    backgroundColor: Colors.organic,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  placeOrderText: {
    ...Typography.button,
    color: Colors.white,
  },
});
