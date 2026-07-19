import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Animated, PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/store';
import { customerApi } from '../../lib/api';
import { getDeliveryFee } from '../../lib/pricing';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import DeliverySlotPicker from '../../components/DeliverySlotPicker';

const SLIDE_THRESHOLD = 0.85;
const COD_CAP = 2000;

const PAYMENT_OPTIONS = [
  { key: 'COD' as const, labelKey: 'checkout.payment.cod', icon: 'cash-outline' as const, comingSoon: false },
  { key: 'RAZORPAY' as const, labelKey: 'checkout.payment.razorpay', icon: 'card-outline' as const, comingSoon: false },
];

const CHECKOUT_STEPS = ['Address', 'Payment', 'Confirm'];

export default function CheckoutScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { cartItems, subtotal, clearCart } = useStore();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ slotConfigId: string; date: string; timeRange: string } | null>(null);
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

  // Step tracking
  const currentStep = !selectedAddress ? 0 : paymentMethod ? 1 : 1;

  // Slide-to-confirm
  const slideX = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef(0);
  const thumbSize = 52;
  const startPos = useRef(0);

  const liveRef = useRef({ selectedAddress, placing, overCodCap, handlePlaceOrder: null as null | (() => Promise<boolean>) });
  liveRef.current.selectedAddress = selectedAddress;
  liveRef.current.placing = placing;
  liveRef.current.overCodCap = overCodCap;

  const triggerPlaceOrder = () => {
    const maxSlide = trackWidth.current - thumbSize - 8;
    Animated.spring(slideX, { toValue: maxSlide, useNativeDriver: false, friction: 8 }).start(async () => {
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
      setCouponError(err?.message || t('checkout.coupon.error'));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handlePlaceOrder = async (): Promise<boolean> => {
    if (!cartItems || cartItems.length === 0) {
      Alert.alert('Cart is empty', 'Add items to your cart before placing an order.');
      return false;
    }
    if (!selectedAddress) {
      Alert.alert(t('checkout.alert.selectAddress.title'), t('checkout.alert.selectAddress.message'));
      return false;
    }
    if (overCodCap) {
      Alert.alert(
        t('checkout.alert.codLimit.title'),
        t('checkout.alert.codLimit.message', { cap: COD_CAP.toLocaleString('en-IN') }),
      );
      return false;
    }

    setPlacing(true);
    try {
      const stockChecks = await Promise.all(cartItems.map(async (item: any) => {
        try {
          const res: any = await customerApi.getProduct(item.product?.id || item.productId);
          const product = res?.data || res;
          if (product && typeof product.stock === 'number' && product.stock < item.quantity) {
            return `${product.name} — only ${product.stock} left (you have ${item.quantity} in cart)`;
          }
        } catch {
          // can't verify right now; don't block the order
        }
        return null;
      }));
      const stockIssues = stockChecks.filter((issue): issue is string => !!issue);
      if (stockIssues.length > 0) {
        Alert.alert(t('checkout.alert.stockChanged.title'), `${stockIssues.join('\n')}\n\n${t('checkout.alert.stockChanged.message')}`);
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
        deliverySlotId: selectedSlot?.slotConfigId,
      };

      const result = await customerApi.createOrder(orderData);
      const orderId = result?.id || result?.data?.id;

      if (paymentMethod === 'RAZORPAY') {
        try {
          const razorpayOrder = await customerApi.createRazorpayOrder(orderId);
          const RazorpayCheckout = require('react-native-razorpay');
          const paymentResult = await RazorpayCheckout.open({
            key: razorpayOrder.key,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order_id: razorpayOrder.order_id,
            name: 'Next360',
            description: `Order ${razorpayOrder.receipt || orderId.slice(0, 8).toUpperCase()}`,
            prefill: {},
            theme: { color: '#5C6B4D' },
          });
          await customerApi.verifyPayment({
            razorpayOrderId: razorpayOrder.order_id,
            razorpayPaymentId: paymentResult.razorpay_payment_id,
            razorpaySignature: paymentResult.razorpay_signature,
          });
        } catch (razorpayError: any) {
          const msg = razorpayError?.message || 'Payment was cancelled or failed';
          Alert.alert('Payment Failed', msg);
          return false;
        }
      }

      await clearCart();
      navigation.replace('OrderConfirmation', { orderId });
      return true;
    } catch (error: any) {
      Alert.alert(t('checkout.alert.orderFailed.title'), error.message || t('checkout.alert.orderFailed.message'));
      return false;
    } finally {
      setPlacing(false);
    }
  };
  liveRef.current.handlePlaceOrder = handlePlaceOrder;

  // Staggered entrance animations for sections
  const SECTION_KEYS = ['address', 'slot', 'items', 'payment', 'coupon', 'notes', 'summary'];
  const sectionAnims = useRef(SECTION_KEYS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(50, sectionAnims.map((anim, i) =>
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      })
    )).start();
  }, []);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  // Shared staggered section style helper
  const sectionStyle = (index: number) => ({
    opacity: sectionAnims[index],
    transform: [{ translateY: sectionAnims[index].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

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
      {/* Header with step indicators */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkout.title')}</Text>
        <View style={styles.stepDots}>
          {CHECKOUT_STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.stepDot, i <= currentStep && { backgroundColor: Colors.organic }]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <Animated.View style={[styles.section, sectionStyle(0)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.deliveryAddress')}
          </Text>
          {selectedAddress ? (
            <TouchableOpacity
              style={[styles.addressCard, Shadows.card]}
              onPress={() => navigation.navigate('AddressList', { onSelect: setSelectedAddress })}
            >
              <View style={styles.addressIconWrap}>
                <Ionicons name="location" size={18} color={Colors.white} />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{selectedAddress.label || t('checkout.fallback.address')}</Text>
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
              <View style={[styles.addAddressIcon, { backgroundColor: Colors.organicLight }]}>
                <Ionicons name="add" size={22} color={Colors.organic} />
              </View>
              <Text style={styles.addAddressText}>{t('checkout.addAddress')}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Delivery Slot */}
        <Animated.View style={[styles.section, sectionStyle(1)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.deliverySlot')}
          </Text>
          <View style={[styles.card, Shadows.card, { padding: Spacing.md }]}>
            <DeliverySlotPicker
              zoneId={selectedAddress?.zoneId || selectedAddress?.id}
              selectedSlotId={selectedSlot?.slotConfigId}
              onSelect={setSelectedSlot}
            />
          </View>
        </Animated.View>

        {/* Order Items */}
        <Animated.View style={[styles.section, sectionStyle(2)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bag-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.orderItems', { count: cartItems.length })}
          </Text>
          <View style={[styles.card, Shadows.card]}>
            {cartItems.map((item: any, i: number) => (
              <View key={item.id} style={[styles.orderItem, i === cartItems.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.product?.name || t('checkout.fallback.product')} × {item.quantity}
                </Text>
                <Text style={styles.orderItemPrice}>
                  {formatCurrency((item.product?.price || 0) * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View style={[styles.section, sectionStyle(3)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="card-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.paymentMethod')}
          </Text>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = paymentMethod === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.paymentOption,
                  active && styles.paymentOptionActive,
                  opt.comingSoon && styles.paymentOptionDisabled,
                ]}
                onPress={() => !opt.comingSoon && setPaymentMethod(opt.key)}
                disabled={opt.comingSoon}
                activeOpacity={opt.comingSoon ? 1 : 0.7}
              >
                <View style={[styles.paymentIconWrap, active && { backgroundColor: Colors.organicLight }]}>
                  <Ionicons name={opt.icon} size={18} color={active ? Colors.organic : Colors.textSecondary} />
                </View>
                <Text style={[styles.paymentText, active && { color: Colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                  {t(opt.labelKey)}
                </Text>
                {opt.comingSoon ? (
                  <View style={styles.comingSoonPill}>
                    <Text style={styles.comingSoonText}>{t('common.comingSoon')}</Text>
                  </View>
                ) : (
                  <View style={[styles.paymentRadio, active && styles.paymentRadioActive]}>
                    {active && <View style={styles.paymentRadioDot} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Coupon */}
        <Animated.View style={[styles.section, sectionStyle(4)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pricetag-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.coupon')}
          </Text>
          {appliedCoupon ? (
            <View style={[styles.couponAppliedCard, Shadows.card]}>
              <View style={styles.couponAppliedLeft}>
                <Ionicons name="pricetag" size={18} color={Colors.organic} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.couponAppliedCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.couponAppliedSavings}>{t('checkout.coupon.saved', { amount: formatCurrency(appliedCoupon.discount) })}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} hitSlop={8} style={styles.couponRemoveBtn}>
                <Text style={styles.couponRemove}>{t('common.remove')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t); setCouponError(null); }}
                  placeholder={t('checkout.coupon.placeholder')}
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
                    : <Text style={styles.couponApplyText}>{t('checkout.coupon.apply')}</Text>}
                </TouchableOpacity>
              </View>
              {couponError && (
                <View style={styles.couponErrorRow}>
                  <Ionicons name="alert-circle" size={14} color={Colors.error} />
                  <Text style={styles.couponErrorText}>{couponError}</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Order Notes */}
        <Animated.View style={[styles.section, sectionStyle(5)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="create-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.orderNotes')}
          </Text>
          <View style={[styles.notesCard, Shadows.card]}>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('checkout.notes.placeholder')}
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        {/* Price Summary */}
        <Animated.View style={[styles.section, sectionStyle(6)]}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="calculator-outline" size={14} color={Colors.organic} />
            {' '}{t('checkout.section.priceSummary')}
          </Text>
          <View style={[styles.cardPrice, Shadows.card]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('checkout.price.subtotal')}</Text>
              <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
            </View>
            {appliedCoupon && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('checkout.price.coupon', { code: appliedCoupon.code })}</Text>
                <Text style={styles.discountValue}>-{formatCurrency(discount)}</Text>
              </View>
            )}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('checkout.price.deliveryFee')}</Text>
              {deliveryFee === 0 ? (
                <Text style={styles.discountValue}>{t('common.free')}</Text>
              ) : (
                <Text style={styles.priceValue}>{formatCurrency(deliveryFee)}</Text>
              )}
            </View>
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('checkout.price.total')}</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
          {overCodCap && (
            <View style={styles.codWarning}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.codWarningText}>
                {t('checkout.codWarning', { cap: COD_CAP.toLocaleString('en-IN') })}
              </Text>
            </View>
          )}

          {/* Trust Badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustPill}>
              <Ionicons name="lock-closed" size={11} color={Colors.organic} />
              <Text style={styles.trustPillText}>Secure Payment</Text>
            </View>
            <View style={styles.trustPill}>
              <Ionicons name="leaf" size={11} color={Colors.organic} />
              <Text style={styles.trustPillText}>Fresh Guarantee</Text>
            </View>
            <View style={styles.trustPill}>
              <Ionicons name="time" size={11} color={Colors.organic} />
              <Text style={styles.trustPillText}>On-Time Delivery</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Slide-to-Confirm */}
      <View style={[styles.bottomBar, { bottom: insets.bottom + 74 }]}>
        <View
          style={[styles.slideTrack, overCodCap && styles.slideTrackDisabled]}
          onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
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
          {/* Static label behind the thumb */}
          <View style={[styles.slideTextWrap, { pointerEvents: 'none' }]}>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} style={{ opacity: 0.5 }} />
            <Text style={styles.slideText}>
              {placing
                ? t('checkout.slide.placing')
                : !selectedAddress
                ? t('checkout.slide.noAddress')
                : overCodCap
                ? t('checkout.slide.codLimit', { cap: COD_CAP.toLocaleString('en-IN') })
                : t('checkout.slide.confirm')}
            </Text>
          </View>
          {/* Draggable thumb with gradient */}
          {!placing && (
            <Animated.View
              {...(selectedAddress && !overCodCap ? panResponder.panHandlers : {})}
              style={[
                styles.slideThumb,
                Shadows.raised,
                { transform: [{ translateX: slideX }] },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.slideThumbGradient}
              >
                <Ionicons name="arrow-forward" size={20} color={Colors.white} />
              </LinearGradient>
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
  stepDots: {
    flexDirection: 'row',
    gap: 5,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
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
  cardPrice: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
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
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.organic,
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
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  addAddressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAddressText: {
    ...Typography.bodySmall,
    color: Colors.organic,
    fontFamily: 'Inter_600SemiBold',
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
    backgroundColor: Colors.white,
  },
  paymentOptionDisabled: {
    opacity: 0.55,
  },
  paymentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  paymentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRadioActive: {
    borderColor: Colors.organic,
  },
  paymentRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.organic,
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
  notesCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  notesInput: {
    ...Typography.bodySmall,
    color: Colors.text,
    minHeight: 60,
    padding: 0,
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
  couponErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  couponErrorText: {
    ...Typography.caption,
    color: Colors.error,
  },
  couponAppliedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.organic,
  },
  couponAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
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
  couponRemoveBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
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
  trustRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.organicLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  trustPillText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.organic,
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
    backgroundColor: Colors.organicLight,
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
    backgroundColor: Colors.success,
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
  slideThumbGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
