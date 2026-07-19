import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../lib/api';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import ErrorState from '../../components/ErrorState';

// Orders can only be self-service cancelled before they've left the vendor —
// once a rider is assigned/picked up, cancellation has to go through support
// instead (food/goods may already be in transit).
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'];

const STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED_TO_DELIVERY', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function VendorGroupTimeline({
  group, canReturn, onRequestReturn, canReview, onWriteReview,
}: {
  group: any;
  canReturn: boolean;
  onRequestReturn: (itemId: string) => void;
  canReview: boolean;
  onWriteReview: (item: any) => void;
}) {
  const { t } = useTranslation();
  const isTerminalBad = group.status === 'CANCELLED' || group.status === 'REFUNDED';
  const currentIndex = STEPS.indexOf(group.status);

  const stepLabels: Record<string, string> = {
    PLACED: t('orderStatus.placed'),
    CONFIRMED: t('orderStatus.confirmed'),
    PACKED: t('orderStatus.packed'),
    ASSIGNED_TO_DELIVERY: t('orderStatus.assignedForDelivery'),
    PICKED_UP: t('orderStatus.pickedUp'),
    OUT_FOR_DELIVERY: t('orderStatus.outForDelivery'),
    DELIVERED: t('orderStatus.delivered'),
  };

  return (
    <View style={[s.groupCard, Shadows.card]}>
      <View style={s.vendorRow}>
        <View style={s.vendorIconWrap}>
          <Ionicons name="storefront" size={16} color={Colors.organic} />
        </View>
        <Text style={s.vendorName}>{group.vendor?.storeName || t('orderDetail.fallback.vendor')}</Text>
      </View>

      {isTerminalBad ? (
        <View style={s.badBanner}>
          <Ionicons name="close-circle" size={16} color={Colors.error} />
          <Text style={s.badBannerText}>
            {group.status === 'CANCELLED' ? t('orderDetail.status.cancelled') : t('orderDetail.status.refunded')}
          </Text>
        </View>
      ) : (
        <View style={s.timeline}>
          {STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <View key={step} style={s.stepRow}>
                <View style={s.stepMarkerCol}>
                  <View style={[s.stepIconWrap, done && s.stepIconWrapDone, isCurrent && Shadows.button(Colors.organic)]}>
                    <Ionicons
                      name={done ? 'checkmark' : 'ellipse'}
                      size={done ? 12 : 6}
                      color={done ? Colors.white : Colors.border}
                    />
                  </View>
                  {i < STEPS.length - 1 && <View style={[s.stepLine, done && s.stepLineDone]} />}
                </View>
                <Text style={[s.stepLabel, done && s.stepLabelDone]}>{stepLabels[step]}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={s.itemsList}>
        {(group.items || []).map((item: any) => (
          <View key={item.id} style={s.itemRow}>
            <Image
              source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/48' }}
              style={s.itemImage}
            />
            <Text style={s.itemName} numberOfLines={1}>{item.product?.name} × {item.quantity}</Text>
            <View style={s.itemLinks}>
              {canReview && (
                <TouchableOpacity onPress={() => onWriteReview(item)} hitSlop={8}>
                  <Text style={s.reviewLink}>{t('orderDetail.action.writeReview')}</Text>
                </TouchableOpacity>
              )}
              {canReturn && (
                <TouchableOpacity onPress={() => onRequestReturn(item.id)} hitSlop={8}>
                  <Text style={s.returnLink}>{t('orderDetail.action.requestReturn')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function OrderDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [returnTargetItem, setReturnTargetItem] = useState<string | null>(null);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [reviewTargetItem, setReviewTargetItem] = useState<{ productId: string; productName: string } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState(false);

  const cancelReasons = [t('orderDetail.cancelReason.mistake'), t('orderDetail.cancelReason.price'), t('orderDetail.cancelReason.slow'), t('orderDetail.cancelReason.other')];
  const returnReasons = [t('orderDetail.returnReason.damaged'), t('orderDetail.returnReason.wrong'), t('orderDetail.returnReason.expired'), t('orderDetail.returnReason.other')];

  const load = useCallback(async () => {
    try {
      const res: any = await customerApi.getOrder(orderId);
      setOrder(res?.data || res);
      setError(false);
    } catch {
      // Previously indistinguishable from a genuinely nonexistent order —
      // both rendered the same "Order not found," with no retry option for
      // what might just be a transient network failure.
      setOrder(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Previously this screen only ever refreshed on focus — if a user stayed on
  // it while the vendor/admin advanced the order (or a per-vendor group's)
  // status, nothing updated until they navigated away and back. Subscribing
  // directly to both tables means status changes land live while the screen
  // is open, matching how the delivery-tracking map already behaves.
  useEffect(() => {
    if (!orderId || !isSupabaseConfigured()) return;
    const supabase = getSupabase();
    const orderChannel = supabase
      .channel(`order-detail-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'Order', filter: `id=eq.${orderId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (!row?.status) return;
        setOrder((prev: any) => (prev ? { ...prev, status: row.status } : prev));
      })
      .subscribe();

    const groupChannel = supabase
      .channel(`order-detail-groups-${orderId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'OrderVendorGroup', filter: `orderId=eq.${orderId}`,
      }, (payload) => {
        const row = payload.new as any;
        if (!row?.id || !row?.status) return;
        setOrder((prev: any) => (prev ? {
          ...prev,
          vendorGroups: (prev.vendorGroups || []).map((g: any) => (g.id === row.id ? { ...g, status: row.status } : g)),
        } : prev));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(groupChannel);
    };
  }, [orderId]);

  const handleCancelOrder = async (reason: string) => {
    setCancelling(true);
    try {
      await customerApi.cancelOrder(order.id, reason);
      setOrder((prev: any) => (prev ? { ...prev, status: 'CANCELLED' } : prev));
      setCancelModalVisible(false);
    } catch (err: any) {
      Alert.alert(t('orderDetail.alert.cancelError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      // Add all items from the order back to the cart
      for (const group of order.vendorGroups || []) {
        for (const item of group.items || []) {
          await customerApi.addToCart(item.productId || item.product?.id, item.quantity);
        }
      }
      Alert.alert(t('orderDetail.reorderAdded'), t('orderDetail.reorderAddedMessage'));
      navigation.navigate('Main', { screen: 'Cart' });
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message || t('common.pleaseTryAgain'));
    }
  };

  const handleRequestReturn = async (reason: string) => {
    if (!returnTargetItem) return;
    setSubmittingReturn(true);
    try {
      await customerApi.requestReturn({ orderId: order.id, orderItemId: returnTargetItem, reason });
      setReturnTargetItem(null);
      Alert.alert(t('orderDetail.alert.returnRequested.title'), t('orderDetail.alert.returnRequested.message'));
    } catch (err: any) {
      Alert.alert(t('orderDetail.alert.returnError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewTargetItem) return;
    setSubmittingReview(true);
    try {
      await customerApi.createReview({ productId: reviewTargetItem.productId, orderId: order.id, rating, comment: comment || undefined });
      setReviewTargetItem(null);
      Alert.alert(t('orderDetail.alert.reviewThanks.title'), t('orderDetail.alert.reviewThanks.message'));
    } catch (err: any) {
      Alert.alert(t('orderDetail.alert.reviewError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.organic} /></View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={s.container}>
        {error ? (
          <ErrorState message={t('orderDetail.error.load')} onRetry={load} />
        ) : (
          <View style={s.center}><Text style={s.emptyText}>{t('orderDetail.empty.notFound')}</Text></View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {!['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status) && (
          <TouchableOpacity
            style={[s.trackBtn, Shadows.button(Colors.organic)]}
            onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
          >
            <Ionicons name="navigate" size={16} color={Colors.white} />
            <Text style={s.trackBtnText}>{t('orderDetail.trackOrderLive')}</Text>
          </TouchableOpacity>
        )}

        {order.address && (
          <View style={[s.addressCard, Shadows.card]}>
            <Text style={s.sectionTitle}>{t('orderDetail.section.deliveringTo')}</Text>
            <Text style={s.addressText}>{order.address.fullAddress}</Text>
            <Text style={s.addressText}>{order.address.city}, {order.address.state} - {order.address.pincode}</Text>
          </View>
        )}

        {(order.vendorGroups || []).map((group: any) => (
          <VendorGroupTimeline
            key={group.id}
            group={group}
            canReturn={order.status === 'DELIVERED'}
            onRequestReturn={(itemId) => setReturnTargetItem(itemId)}
            canReview={order.status === 'DELIVERED'}
            onWriteReview={(item) => setReviewTargetItem({ productId: item.productId, productName: item.product?.name || item.productName || 'this item' })}
          />
        ))}

        <View style={[s.summaryCard, Shadows.card]}>
          <Text style={s.sectionTitle}>{t('orderDetail.section.payment')}</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{t('orderDetail.summary.method')}</Text>
            <Text style={s.summaryValue}>{order.paymentMethod}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{t('orderDetail.summary.status')}</Text>
            <Text style={s.summaryValue}>{order.paymentStatus}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>{t('orderDetail.summary.total')}</Text>
            <Text style={s.totalValue}>₹{Number(order.totalAmount).toFixed(0)}</Text>
          </View>
        </View>

        {CANCELLABLE_STATUSES.includes(order.status) && (
          <TouchableOpacity style={s.cancelBtn} onPress={() => setCancelModalVisible(true)}>
            <Text style={s.cancelBtnText}>{t('orderDetail.cancelOrder')}</Text>
          </TouchableOpacity>
        )}

        {/* Reorder — 1-tap repeat for delivered orders, per Swiggy/Zomato pattern */}
        {order.status === 'DELIVERED' && (
          <TouchableOpacity style={s.reorderBtn} onPress={() => handleReorder()}>
            <Ionicons name="repeat" size={16} color={Colors.organic} />
            <Text style={s.reorderBtnText}>{t('orderDetail.reorder')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ReasonModal
        visible={cancelModalVisible}
        title={t('orderDetail.cancelModal.title')}
        reasons={cancelReasons}
        submitLabel={t('orderDetail.cancelOrder')}
        submitting={cancelling}
        onClose={() => setCancelModalVisible(false)}
        onSubmit={handleCancelOrder}
      />
      <ReasonModal
        visible={!!returnTargetItem}
        title={t('orderDetail.returnModal.title')}
        reasons={returnReasons}
        submitLabel={t('orderDetail.returnModal.submit')}
        submitting={submittingReturn}
        onClose={() => setReturnTargetItem(null)}
        onSubmit={handleRequestReturn}
      />
      <ReviewModal
        visible={!!reviewTargetItem}
        productName={reviewTargetItem?.productName || ''}
        submitting={submittingReview}
        onClose={() => setReviewTargetItem(null)}
        onSubmit={handleSubmitReview}
      />
    </SafeAreaView>
  );
}

function ReviewModal({
  visible, productName, submitting, onClose, onSubmit,
}: {
  visible: boolean;
  productName: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!visible) { setRating(0); setComment(''); }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <View style={[s.modalCard, Shadows.raised]}>
          <Text style={s.modalTitle}>{t('orderDetail.reviewModal.title', { productName })}</Text>
          <View style={s.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6}>
                <Ionicons
                  name={n <= rating ? 'star' : 'star-outline'}
                  size={32}
                  color={n <= rating ? Colors.brass : Colors.border}
                  style={{ marginRight: Spacing.xs }}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={s.reasonInput}
            placeholder={t('orderDetail.reviewModal.placeholder')}
            placeholderTextColor={Colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={s.modalCancelText}>{t('common.neverMind')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalSubmitBtn, (!rating || submitting) && s.modalSubmitBtnDisabled]}
              onPress={() => rating && onSubmit(rating, comment.trim())}
              disabled={!rating || submitting}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={s.modalSubmitText}>{t('orderDetail.reviewModal.submit')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReasonModal({
  visible, title, reasons, submitLabel, submitting, onClose, onSubmit,
}: {
  visible: boolean;
  title: string;
  reasons: string[];
  submitLabel: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  useEffect(() => {
    if (!visible) { setSelected(null); setCustomText(''); }
  }, [visible]);

  const finalReason = selected === t('orderDetail.cancelReason.other') || selected === t('orderDetail.returnReason.other') ? customText.trim() : selected;
  const canSubmit = !!finalReason && !submitting;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalBackdrop}>
        <View style={[s.modalCard, Shadows.raised]}>
          <Text style={s.modalTitle}>{title}</Text>
          {reasons.map((r) => (
            <TouchableOpacity key={r} style={s.reasonRow} onPress={() => setSelected(r)}>
              <View style={[s.radio, selected === r && s.radioActive]}>
                {selected === r && <View style={s.radioDot} />}
              </View>
              <Text style={s.reasonText}>{r}</Text>
            </TouchableOpacity>
          ))}
          {(selected === t('orderDetail.cancelReason.other') || selected === t('orderDetail.returnReason.other')) && (
            <TextInput
              style={s.reasonInput}
              placeholder={t('orderDetail.reasonModal.otherPlaceholder')}
              placeholderTextColor={Colors.textSecondary}
              value={customText}
              onChangeText={setCustomText}
              multiline
              numberOfLines={2}
            />
          )}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={s.modalCancelText}>{t('common.neverMind')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalSubmitBtn, !canSubmit && s.modalSubmitBtnDisabled]}
              onPress={() => finalReason && onSubmit(finalReason)}
              disabled={!canSubmit}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={s.modalSubmitText}>{submitLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.body, color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  sectionTitle: { ...Typography.bodySmall, color: Colors.text, fontFamily: 'Inter_600SemiBold', marginBottom: Spacing.sm },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.organic, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.md, marginBottom: Spacing.lg,
  },
  trackBtnText: { ...Typography.button, color: Colors.white },
  addressCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  addressText: { ...Typography.bodySmall, color: Colors.textSecondary },

  groupCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  vendorIconWrap: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
  },
  vendorName: { ...Typography.h3, color: Colors.text },

  badBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md,
  },
  badBannerText: { ...Typography.bodySmall, color: Colors.error, flex: 1 },

  timeline: { marginBottom: Spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepMarkerCol: { width: 24, alignItems: 'center' },
  stepIconWrap: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.background,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  stepIconWrapDone: { backgroundColor: Colors.organic, borderColor: Colors.organic },
  stepLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: Colors.border },
  stepLineDone: { backgroundColor: Colors.organic },
  stepLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginLeft: Spacing.sm, marginBottom: Spacing.lg },
  stepLabelDone: { color: Colors.text, fontFamily: 'Inter_600SemiBold' },

  itemsList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemImage: { width: 32, height: 32, borderRadius: BorderRadius.sm, backgroundColor: Colors.border },
  itemName: { ...Typography.bodySmall, color: Colors.text, flex: 1 },
  itemLinks: { alignItems: 'flex-end', gap: 4 },
  returnLink: { ...Typography.caption, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
  reviewLink: { ...Typography.caption, color: Colors.brass, fontFamily: 'Inter_600SemiBold' },
  starRow: { flexDirection: 'row', marginBottom: Spacing.md },

  summaryCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  summaryValue: { ...Typography.bodySmall, color: Colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, marginTop: 4 },
  totalLabel: { ...Typography.h3, color: Colors.text },
  totalValue: { ...Typography.h3, color: Colors.brass },

  cancelBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, marginTop: Spacing.lg,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.error,
  },
  cancelBtnText: { ...Typography.button, color: Colors.error },

  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    marginTop: Spacing.lg, borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.organic,
    paddingVertical: Spacing.md,
  },
  reorderBtnText: { ...Typography.button, color: Colors.organic },

  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(10,10,8,0.4)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.organic },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.organic },
  reasonText: { ...Typography.bodySmall, color: Colors.text, flex: 1 },
  reasonInput: {
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
    ...Typography.bodySmall, color: Colors.text, marginTop: Spacing.sm,
    minHeight: 60, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  modalCancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill, borderWidth: 1.5, borderColor: Colors.border,
  },
  modalCancelText: { ...Typography.button, color: Colors.textSecondary },
  modalSubmitBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.organic,
  },
  modalSubmitBtnDisabled: { opacity: 0.5 },
  modalSubmitText: { ...Typography.button, color: Colors.white },
});
