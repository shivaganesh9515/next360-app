import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

export default function OrderConfirmationScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { orderId } = route.params || {};

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

          {/* Estimated Delivery */}
          <View style={s.deliveryInfo}>
            <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
            <Text style={s.deliveryText}>{t('orderConfirm.deliveryEstimate')}</Text>
          </View>

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
          onPress={() => navigation.navigate('Main', { screen: 'Profile', params: { screen: 'OrderHistory' } })}
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
