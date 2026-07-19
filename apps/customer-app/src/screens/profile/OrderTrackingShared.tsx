import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryAssignment, Order, OrderItem } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

// Shared between OrderTrackingScreen.tsx (native, with the live map) and
// OrderTrackingScreen.web.tsx (web, no map — react-native-maps has no web
// implementation). Deliberately its own file with no platform-specific
// counterpart: if either screen imported from the other by their shared base
// name, Metro's platform resolver would resolve that import back to itself
// when bundling for web, causing a circular import.

export function TrackingHeader({ orderNo, onBack, onHelp }: { orderNo: string; onBack: () => void; onHelp: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} hitSlop={8} style={s.headerIconBtn}>
        <Ionicons name="arrow-back" size={20} color={Colors.text} />
      </TouchableOpacity>
      <Text style={s.headerTitle}>{t('orderTracking.header.title', { orderNo })}</Text>
      <TouchableOpacity onPress={onHelp} hitSlop={8} style={s.headerIconBtn}>
        <Ionicons name="help-outline" size={20} color={Colors.text} />
      </TouchableOpacity>
    </View>
  );
}

export function RiderCard({ assignment, onCall }: { assignment: DeliveryAssignment; onCall?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={[s.riderCard, Shadows.raised]}>
      <View style={s.riderAvatarWrap}>
        <View style={s.riderAvatar}>
          <Ionicons name="person" size={22} color={Colors.organic} />
        </View>
        <View style={s.riderBadge}>
          <Ionicons name="star" size={10} color={Colors.white} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.riderName}>{assignment.deliveryPartner?.name}</Text>
        <Text style={s.riderMeta}>★ {assignment.deliveryPartner?.rating?.toFixed(1)} · {assignment.deliveryPartner?.vehicleType}</Text>
      </View>
      {onCall && (
        <TouchableOpacity style={s.callBtn} onPress={onCall}>
          <Ionicons name="call" size={14} color={Colors.white} />
          <Text style={s.callBtnText}>{t('common.call')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Each connector line animates drawing itself in (scaleY 0→1) the moment its
// step becomes "done", instead of every completed step appearing instantly —
// the "status timeline draw-in" primitive from the motion plan. `live` shows
// a small pulsing badge on the currently-active step; `subtext` is real data
// (an ETA derived from order.estimatedDeliveryAt) never a fabricated detail.
export function TimelineStep({
  label, done, isLast, live, subtext,
}: { label: string; done: boolean; isLast: boolean; live?: boolean; subtext?: string }) {
  const { t } = useTranslation();
  const anim = useRef(new Animated.Value(done ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: done ? 1 : 0, duration: 400, useNativeDriver: false }).start();
  }, [done]);

  useEffect(() => {
    if (!live) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live]);

  return (
    <View style={s.stepRow}>
      <View style={s.stepMarkerCol}>
        <Animated.View style={[s.stepIconWrap, { backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.background, Colors.organic] }) }]}>
          {live ? (
            <Animated.View style={[s.liveDot, { opacity: pulse }]} />
          ) : (
            <Ionicons name={done ? 'checkmark' : 'ellipse'} size={done ? 11 : 6} color={done ? Colors.white : Colors.border} />
          )}
        </Animated.View>
        {!isLast && (
          <View style={s.stepLineTrack}>
            <Animated.View style={[s.stepLineFill, { transform: [{ scaleY: anim }] }]} />
          </View>
        )}
      </View>
      <View style={s.stepTextCol}>
        <View style={s.stepLabelRow}>
          <Text style={[s.stepLabel, done && s.stepLabelDone]}>{label}</Text>
          {live && (
            <View style={s.liveBadge}>
              <Text style={s.liveBadgeText}>{t('common.live')}</Text>
            </View>
          )}
        </View>
        {!!subtext && <Text style={[s.stepSubtext, live && s.stepSubtextLive]}>{subtext}</Text>}
      </View>
    </View>
  );
}

export function OrderItemsSection({ items }: { items: OrderItem[] }) {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t('orderTracking.section.items')}</Text>
      {items.map((item) => (
        <View key={item.id} style={[s.itemCard, Shadows.card]}>
          <View style={s.itemImageWrap}>
            {item.productImage ? (
              <Animated.Image source={{ uri: item.productImage }} style={s.itemImage} />
            ) : (
              <Ionicons name="leaf" size={24} color={Colors.organic} />
            )}
          </View>
          <View style={s.itemInfo}>
            <Text style={s.itemName} numberOfLines={2}>{item.productName}</Text>
            <Text style={s.itemVendor}>{item.vendorName}</Text>
            <View style={s.itemFooterRow}>
              <Text style={s.itemQty}>{t('orderTracking.item.qty', { qty: item.quantity })}</Text>
              <Text style={s.itemPrice}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function OrderSummarySection({ order }: { order: Order }) {
  const { t } = useTranslation();
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = Math.max(0, Number(order.totalAmount) - subtotal);
  return (
    <View style={[s.section, s.summaryCard]}>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>{t('orderTracking.summary.subtotal')}</Text>
        <Text style={s.summaryValue}>₹{subtotal.toFixed(0)}</Text>
      </View>
      <View style={s.summaryRow}>
        <Text style={s.summaryLabel}>{t('orderTracking.summary.deliveryFee')}</Text>
        <Text style={[s.summaryValue, deliveryFee === 0 && s.summaryFree]}>
          {deliveryFee === 0 ? t('common.free') : `₹${deliveryFee.toFixed(0)}`}
        </Text>
      </View>
      <View style={s.summaryTotalRow}>
        <Text style={s.summaryTotalLabel}>{t('orderTracking.summary.totalAmount')}</Text>
        <Text style={s.summaryTotalValue}>₹{Number(order.totalAmount).toFixed(0)}</Text>
      </View>
      <Text style={s.summaryFootnote}>
        {t('orderTracking.summary.paidVia', { method: order.paymentMethod?.toUpperCase() })} · #{order.id.slice(0, 8).toUpperCase()}
      </Text>
    </View>
  );
}

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },

  mapWrap: { height: 260, backgroundColor: Colors.border, position: 'relative' },
  riderMarker: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white,
    ...Shadows.card,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  mapPlaceholderText: { ...Typography.bodySmall, color: Colors.textSecondary },

  riderCardOverlay: { position: 'absolute', left: Spacing.md, right: Spacing.md, bottom: Spacing.md },
  riderCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },
  riderAvatarWrap: { position: 'relative' },
  riderAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
  },
  riderBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.brass, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.white,
  },
  riderName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  riderMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.organic, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, height: 40,
  },
  callBtnText: { ...Typography.caption, color: Colors.white, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },

  section: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },

  timelineSection: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.lg,
    ...Shadows.card,
  },

  otpCard: {
    backgroundColor: Colors.organicLight, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg, marginHorizontal: Spacing.lg, alignItems: 'center',
  },
  otpLabel: { ...Typography.caption, color: Colors.organicDark, marginBottom: 4, textAlign: 'center' },
  otpValue: { ...Typography.h1, color: Colors.organicDark, letterSpacing: 4 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepMarkerCol: { width: 24, alignItems: 'center' },
  stepIconWrap: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
  stepLineTrack: { width: 2, flex: 1, minHeight: 28, backgroundColor: Colors.border, overflow: 'hidden' },
  stepLineFill: { flex: 1, width: '100%', backgroundColor: Colors.organic, transformOrigin: 'top' } as any,
  stepTextCol: { flex: 1, marginLeft: Spacing.sm, marginBottom: Spacing.lg },
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepLabel: { ...Typography.bodySmall, color: Colors.textSecondary, fontFamily: 'Inter_600SemiBold' },
  stepLabelDone: { color: Colors.text },
  stepSubtext: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  stepSubtextLive: { color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
  liveBadge: {
    backgroundColor: Colors.brassLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: BorderRadius.sm,
  },
  liveBadgeText: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.organicDark, letterSpacing: 0.5 },

  itemCard: {
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm,
  },
  itemImageWrap: {
    width: 64, height: 64, borderRadius: BorderRadius.md, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  itemImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, justifyContent: 'center' },
  itemName: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  itemVendor: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  itemFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  itemQty: { ...Typography.caption, color: Colors.organic, fontFamily: 'JetBrainsMono_400Regular' },
  itemPrice: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold' },

  summaryCard: { backgroundColor: Colors.background, ...Shadows.card },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { ...Typography.body, color: Colors.textSecondary },
  summaryValue: { ...Typography.body, color: Colors.text },
  summaryFree: { color: Colors.success, fontFamily: 'Inter_600SemiBold' },
  summaryTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.xs,
  },
  summaryTotalLabel: { ...Typography.h3, color: Colors.text },
  summaryTotalValue: { ...Typography.h3, color: Colors.text },
  summaryFootnote: {
    ...Typography.mono, fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 1, textAlign: 'center', marginTop: Spacing.md,
  },
});
