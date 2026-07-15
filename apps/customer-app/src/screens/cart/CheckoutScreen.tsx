import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Animated, PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../lib/store';
import { customerApi } from '../../lib/api';
import { getDeliveryFee } from '../../lib/pricing';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

const SLIDE_THRESHOLD = 0.85;
// Per CLAUDE.md: COD is capped at ₹2,000/order — nothing enforced this before,
// so a user could COD an order of any size even though online payment (the
// only alternative) isn't live yet.
const COD_CAP = 2000;

// RAZORPAY is shown but disabled — there's no real payment collection wired
// up yet (no SDK, no live order/webhook endpoint). Selecting it silently
// created a "paid" order that collected zero money, so it's marked
// Coming Soon here rather than left selectable and misleading.
const PAYMENT_OPTIONS = [
  { key: 'COD' as const, label: 'Cash on Delivery', icon: 'cash-outline' as const, comingSoon: false },
  { key: 'RAZORPAY' as const, label: 'Pay Online (Razorpay)', icon: 'card-outline' as const, comingSoon: true },
];

export default function CheckoutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { cartItems, subtotal, clearCart } = useStore();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod] = useState<'COD'>('COD');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discount = appliedCoupon?.discount || 0;
  const deliveryFee = getDeliveryFee(subtotal);
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const overCodCap = paymentMethod === 'COD' && total > COD_CAP;

  // Slide-to-confirm
  const slideX = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef(0);
  const thumbSize = 52;
  const startPos = useRef(0);

  // PanResponder.create(...) only runs once (useRef's initializer is ignored on
  // later renders), so every callback inside it permanently closes over that
  // very first render's values — selectedAddress was still null then, addresses
  // hadn't loaded yet. That's why the thumb never appeared to move: every
  // onPanResponderMove call was silently bailing out on a frozen `!selectedAddress`.
  // Routing through a ref that's updated every render fixes it without
  // recreating the PanResponder (which would drop an in-progress gesture).
  const liveRef = useRef({ selectedAddress, placing, overCodCap, handlePlaceOrder: null as null | (() => Promise<boolean>) });
  liveRef.current.selectedAddress = selectedAddress;
  liveRef.current.placing = placing;
  liveRef.current.overCodCap = overCodCap;

  // Shared by the drag gesture and the accessibility tap fallback below — it
  // only ever reads through refs (slideX/trackWidth are refs, liveRef.current
  // is read fresh), so it stays correct regardless of which render's closure
  // captured it, including the one PanResponder.create froze on mount.
  const triggerPlaceOrder = () => {
    const maxSlide = trackWidth.current - thumbSize - 8;
    Animated.spring(slideX, { toValue: maxSlide, useNativeDriver: false, friction: 8 }).start(async () => {
      // Reset only on failure — on success the screen is being replaced,
      // so there's nothing to reset back into view. Previously this used
      // a blind 600ms timeout that fired regardless of whether the real
      // network request had finished, snapping the fill back to empty
      // while "Placing order..." was still showing.
      const placed = await liveRef.current.handlePlaceOrder!();
      if (!placed) {
        Animated.spring(slideX, { toValue: 0, useNativeDriver: false, friction: 10 }).start();
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderGrant: () => {
        startPos.current = (slideX as any).__getValue();
      },
      onPanResponderMove: (_, g) => {
        if (!liveRef.current.selectedAddress || liveRef.current.placing || liveRef.current.overCodCap) return;
        const maxSlide = trackWidth.current - thumbSize - 8;
        const next = Math.max(0, Math.min(startPos.current + g.dx, maxSlide));
        slideX.setValue(next);
      },
      onPanResponderRelease: () => {
        const maxSlide = trackWidth.current - thumbSize - 8;
        const currentVal = (slideX as any).__getValue();
        if (currentVal >= maxSlide * SLIDE_THRESHOLD) {
          triggerPlaceOrder();
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: false, friction: 10 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res: any = await customerApi.getAddresses();
      const list = res?.data || res || [];
      const defaultAddr = list.find((a: any) => a.isDefault) || list[0];
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res: any = await customerApi.validateCoupon(couponInput.trim(), subtotal);
      const data = res?.data || res;
      setAppliedCoupon({ code: data.code || couponInput.trim().toUpperCase(), discount: Number(data.discount) || 0 });
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Invalid or expired coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePlaceOrder = async (): Promise<boolean> => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please add a delivery address to continue');
      return false;
    }
    if (overCodCap) {
      Alert.alert(
        'COD limit exceeded',
        `Cash on Delivery is available up to ₹${COD_CAP.toLocaleString('en-IN')} per order. Online payment isn't live yet — please reduce your cart total to continue.`,
      );
      return false;
    }

    setPlacing(true);
    try {
      // Re-checks stock at the moment of placing, not just when it was added
      // to the cart — an item can sell out (or drop below the cart quantity)
      // in the time between add-to-cart and checkout with no warning
      // otherwise. A lookup failure isn't treated as a stock problem — that's
      // a network/demo-mode issue, not the user's fault, so it doesn't block.
      const stockChecks = await Promise.all(cartItems.map(async (item: any) => {
        try {
          const res: any = await customerApi.getProduct(item.product?.id || item.productId);
          const product = res?.data || res;
          if (product && typeof product.stock === 'number' && product.stock < item.quantity) {
            return `${product.name} — only ${product.stock} left (you have ${item.quantity} in cart)`;
          }
        } catch {
          // can't verify right now; don't block the order over it
        }
        return null;
      }));
      const stockIssues = stockChecks.filter((issue): issue is string => !!issue);
      if (stockIssues.length > 0) {
        Alert.alert('Some items changed', `${stockIssues.join('\n')}\n\nPlease update your cart before continuing.`);
        return false;
      }

      const orderData = {
        addressId: selectedAddress.id,
        items: cartItems.map((item: any) => ({
          productId: item.product?.id || item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
        })),
        paymentMethod,
        notes: notes || undefined,
        couponCode: appliedCoupon?.code,
        discount: discount || undefined,
      };

      const result = await customerApi.createOrder(orderData);
      await clearCart();
      navigation.replace('OrderConfirmation', { orderId: result?.id || result?.data?.id });
      return true;
    } catch (error: any) {
      Alert.alert('Order Failed', error.message || 'Failed to place order. Please try again.');
      return false;
    } finally {
      setPlacing(false);
    }
  };
  // Same reasoning as the other liveRef assignments above — the PanResponder's
  // onPanResponderRelease was calling the very first render's handlePlaceOrder,
  // which itself closed over that render's stale selectedAddress/paymentMethod/
  // notes. Keeping the ref pointed at the latest function fixes both.
  liveRef.current.handlePlaceOrder = handlePlaceOrder;

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
                style={[
                  styles.paymentOption, Shadows.card,
                  active && styles.paymentOptionActive,
                  opt.comingSoon && styles.paymentOptionDisabled,
                ]}
                disabled={opt.comingSoon}
                activeOpacity={opt.comingSoon ? 1 : 0.7}
              >
                <Ionicons name={opt.icon} size={20} color={active ? Colors.organic : Colors.textSecondary} />
                <Text style={[styles.paymentText, active && { color: Colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  {opt.label}
                </Text>
                {opt.comingSoon ? (
                  <View style={styles.comingSoonPill}>
                    <Text style={styles.comingSoonText}>Coming soon</Text>
                  </View>
                ) : (
                  <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                    {active && <Ionicons name="checkmark" size={13} color={Colors.white} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coupon</Text>
          {appliedCoupon ? (
            <View style={[styles.couponAppliedCard, Shadows.card]}>
              <Ionicons name="pricetag" size={18} color={Colors.organic} />
              <View style={{ flex: 1 }}>
                <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponAppliedSavings}>You saved {formatCurrency(appliedCoupon.discount)}</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} hitSlop={8}>
                <Text style={styles.couponRemove}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t); setCouponError(null); }}
                  placeholder="Enter coupon code"
                  placeholderTextColor={Colors.textSecondary}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.couponApplyBtn, !couponInput.trim() && { opacity: 0.5 }]}
                  onPress={handleApplyCoupon}
                  disabled={!couponInput.trim() || applyingCoupon}
                >
                  {applyingCoupon
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={styles.couponApplyText}>Apply</Text>}
                </TouchableOpacity>
              </View>
              {couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
            </>
          )}
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
            {appliedCoupon && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Coupon ({appliedCoupon.code})</Text>
                <Text style={styles.discountValue}>-{formatCurrency(discount)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              {deliveryFee === 0 ? (
                <Text style={styles.discountValue}>FREE</Text>
              ) : (
                <Text style={styles.priceValue}>{formatCurrency(deliveryFee)}</Text>
              )}
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
          {overCodCap && (
            <View style={styles.codWarning}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.codWarningText}>
                Cash on Delivery is available up to {formatCurrency(COD_CAP)} per order. Online payment isn't live yet — please remove some items to continue.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Slide-to-Confirm — positioned above the floating pill nav */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 74 }]}>
        <View
          style={[styles.slideTrack, overCodCap && styles.slideTrackDisabled]}
          // Measured here (the actual pill the thumb travels in), not the
          // outer bottomBar — that container has Spacing.lg padding on both
          // sides, so it overestimates the track's real width, letting the
          // drag/maxSlide value run further than the visible pill, which
          // clips the thumb (slideTrack has overflow:hidden) before the
          // "complete" threshold was actually reached.
          onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
          // The drag gesture has no non-gesture equivalent otherwise — a
          // screen-reader user could never place an order. This doesn't
          // conflict with the drag (PanResponder's handlers are only on the
          // thumb below, not this outer track), so it's safe to make the
          // whole track double-tap-activatable for VoiceOver/TalkBack.
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            placing
              ? 'Placing order'
              : !selectedAddress
              ? 'Add a delivery address to continue'
              : overCodCap
              ? `Cash on delivery is limited to ${formatCurrency(COD_CAP)} per order`
              : `Place order, total ${formatCurrency(total)}`
          }
          accessibilityState={{ disabled: !selectedAddress || overCodCap || placing, busy: placing }}
          accessibilityActions={[{ name: 'activate', label: 'Place order' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'activate' && selectedAddress && !overCodCap && !placing) {
              triggerPlaceOrder();
            }
          }}
        >
          {/* Green fill that grows as the thumb is dragged */}
          <Animated.View
            style={[
              styles.slideFill,
              { width: Animated.add(slideX, thumbSize + 8) },
            ]}
          />
          {/* Static text behind the thumb */}
          <View style={styles.slideTextWrap} pointerEvents="none">
            <Ionicons name="arrow-forward" size={16} color={Colors.white} style={{ opacity: 0.5 }} />
            <Text style={styles.slideText}>
              {placing
                ? 'Placing order...'
                : !selectedAddress
                ? 'Add address to continue'
                : overCodCap
                ? `COD limit is ${formatCurrency(COD_CAP)}`
                : 'Slide to confirm'}
            </Text>
          </View>
          {/* Draggable thumb */}
          {!placing && (
            <Animated.View
              {...(selectedAddress && !overCodCap ? panResponder.panHandlers : {})}
              style={[
                styles.slideThumb,
                Shadows.raised,
                { transform: [{ translateX: slideX }] },
              ]}
            >
              <Ionicons name="arrow-forward" size={20} color={Colors.success} />
            </Animated.View>
          )}
        </View>
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
    paddingBottom: 180,
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
  paymentOptionDisabled: {
    opacity: 0.55,
  },
  comingSoonPill: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  comingSoonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
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
  couponRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  couponInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Typography.bodySmall,
    color: Colors.text,
  },
  couponApplyBtn: {
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.organic,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyText: {
    ...Typography.button,
    color: Colors.white,
  },
  couponErrorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  couponAppliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.organic,
  },
  couponAppliedCode: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  couponAppliedSavings: {
    ...Typography.caption,
    color: Colors.organic,
    marginTop: 2,
  },
  couponRemove: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
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
  discountValue: {
    ...Typography.bodySmall,
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
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  slideTrack: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    position: 'relative',
    overflow: 'hidden',
  },
  slideTrackDisabled: {
    backgroundColor: Colors.textSecondary,
  },
  codWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FDECEC',
  },
  codWarningText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
  },
  slideFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#1E8C3A',
    borderRadius: 28,
  },
  slideTextWrap: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  slideText: {
    ...Typography.button,
    color: Colors.white,
    opacity: 0.9,
  },
  slideThumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
