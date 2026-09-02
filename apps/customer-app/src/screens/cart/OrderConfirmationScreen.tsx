import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../lib/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function OrderConfirmationScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { orderId } = route.params || {};
  const [vendorGroups, setVendorGroups] = useState<any[]>([]);

  useEffect(() => {
    if (!orderId) return;
    customerApi.getOrder(orderId)
      .then((res: any) => {
        const order = res?.data || res;
        setVendorGroups(order?.vendorGroups || []);
      })
      .catch(() => {});
  }, [orderId]);

  // Spring entrance animations
  const iconScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      Animated.spring(contentFade, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        {/* Success Icon — springs in from 0 */}
        <Animated.View style={[s.iconRing, { transform: [{ scale: iconScale }] }]}>
          <View style={s.iconBg}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.organic} />
          </View>
        </Animated.View>

        {/* Success Message — fades in */}
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentFade.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], alignItems: 'center' }}>
          <Text style={s.title}>{t('orderConfirm.title')}</Text>
          <Text style={s.subtitle}>{t('orderConfirm.subtitle')}</Text>

          {/* Order ID */}
          {orderId && (
            <View style={[s.orderIdCard, Shadows.card]}>
              <Text style={s.orderIdLabel}>{t('orderConfirm.orderId')}</Text>
              <Text style={s.orderIdValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
            </View>
          )}

          {/* Per-vendor delivery + subtotal */}
          {vendorGroups.length > 0 ? (
            <View style={s.deliveryCard}>
              {vendorGroups.map((group: any) => {
                const v = group.vendor;
                const min = v?.deliveryTimeMin;
                const max = v?.deliveryTimeMax;
                const label = v?.deliveryLabel;
                const itemCount = group.items?.length || 0;
                const vendorSubtotal = (group.items || []).reduce(
                  (sum: number, item: any) => sum + Number(item.product?.price || 0) * (item.quantity || 1),
                  0,
                );
                return (
                  <View key={group.id} style={s.deliveryRow}>
                    <View style={s.deliveryVendorInfo}>
                      <View style={[s.deliveryDot, { backgroundColor: Colors.organic }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.deliveryVendorName} numberOfLines={1}>{v?.storeName || 'Vendor'}</Text>
                        <Text style={s.deliveryVendorMeta}>
                          {itemCount} item{itemCount !== 1 ? 's' : ''} • ₹{vendorSubtotal.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                    {min != null && max != null ? (
                      <View style={s.deliveryTimePill}>
                        <Ionicons name="time-outline" size={11} color={Colors.organic} />
                        <Text style={s.deliveryTimeText}>
                          {min}-{max} min{label ? ` • ${label}` : ''}
                        </Text>
                      </View>
                    ) : (
                      <Text style={s.deliveryTimeFallback}>Estimating...</Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={s.deliveryInfo}>
              <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
              <Text style={s.deliveryText}>{t('orderConfirm.deliveryEstimate')}</Text>
            </View>
          )}

          {/* Eco note */}
          <View style={s.ecoNote}>
            <Ionicons name="leaf" size={14} color={Colors.organic} />
            <Text style={s.ecoText}>This order supports organic farmers</Text>
          </View>
        </Animated.View>
      </View>

      {/* Actions */}
      <Animated.View style={{ opacity: contentFade, padding: Spacing.lg, paddingBottom: Spacing.xxxl }}>
        <TouchableOpacity
          style={[s.trackButton, Shadows.button(Colors.organic)]}
          onPress={() => navigation.navigate('OrderTracking', { orderId })}
          activeOpacity={0.85}
        >
          <Text style={s.trackButtonText}>{t('orderConfirm.trackOrder')}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.ordersButton}
          onPress={() => navigation.navigate('Orders')}
          activeOpacity={0.7}
        >
          <Text style={s.ordersButtonText}>{t('orderConfirm.viewOrders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.shopButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={s.shopButtonText}>{t('orderConfirm.continueShopping')}</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl },
  iconRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  iconBg: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 12px rgba(92, 107, 77, 0.15)',
      },
      default: {
        shadowColor: Colors.organic,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  title: { ...Typography.display, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  orderIdCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderIdLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 4 },
  orderIdValue: { ...Typography.h2, color: Colors.organic },
  deliveryInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  deliveryText: { ...Typography.bodySmall, color: Colors.textSecondary, marginLeft: Spacing.sm },
  deliveryCard: {
    backgroundColor: Colors.organicLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.12)',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  deliveryVendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  deliveryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deliveryVendorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
  },
  deliveryVendorMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  deliveryTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  deliveryTimeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.organic,
  },
  deliveryTimeFallback: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  ecoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.organicLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
  },
  ecoText: { ...Typography.caption, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  trackButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.organic,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  trackButtonText: { ...Typography.button, color: Colors.white },
  ordersButton: {
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.organicLight,
  },
  ordersButtonText: { ...Typography.button, color: Colors.organic },
  shopButton: { paddingVertical: Spacing.md, alignItems: 'center' },
  shopButtonText: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
});
