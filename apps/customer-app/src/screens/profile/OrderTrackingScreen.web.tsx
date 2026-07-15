import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrderTracking, STEPS, STEP_LABELS, currentStepFor } from '../../lib/useOrderTracking';
import {
  TrackingHeader, RiderCard, TimelineStep, OrderItemsSection, OrderSummarySection, s,
} from './OrderTrackingShared';
import { Colors, Spacing } from '../../constants/theme';

function formatEta(iso?: string): string | undefined {
  if (!iso) return undefined;
  return `Arriving by ${new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

// Web fallback — react-native-maps has no web implementation at all (it
// throws on import via codegenNativeComponent), so this omits the live map
// entirely instead of crashing the whole bundle. Metro resolves this file
// automatically for web builds; OrderTrackingScreen.tsx (with the real map)
// is used for iOS/Android.
export default function OrderTrackingScreenWeb({ navigation, route }: any) {
  const { orderId } = route.params || {};
  const { order, assignment, loading } = useOrderTracking(orderId);

  const handleShareOtp = () => {
    if (!assignment?.otp) return;
    Share.share({ message: `Your Next360 delivery OTP is ${assignment.otp}` }).catch(() => {});
  };

  const currentStep = currentStepFor(assignment);
  const currentIndex = STEPS.indexOf(currentStep);

  if (loading || !order) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><Text style={s.emptyText}>Loading order...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TrackingHeader
        orderNo={order.orderNo || order.id.slice(0, 8).toUpperCase()}
        onBack={() => navigation.goBack()}
        onHelp={() => navigation.navigate('Profile', { screen: 'Support' })}
      />

      <ScrollView style={local.scroll} contentContainerStyle={local.scrollContent}>
        <View style={[s.mapWrap, local.mapPlaceholderWrap]}>
          <View style={s.mapPlaceholder}>
            <Ionicons name="map-outline" size={32} color={Colors.textSecondary} />
            <Text style={s.mapPlaceholderText}>Live map view is available in the mobile app</Text>
          </View>
        </View>

        {assignment && assignment.status !== 'DELIVERED' && (
          <View style={local.riderCardWrap}>
            <RiderCard assignment={assignment} />
          </View>
        )}

        {assignment?.otp && assignment.status !== 'DELIVERED' && (
          <TouchableOpacity style={s.otpCard} onPress={handleShareOtp}>
            <Text style={s.otpLabel}>Delivery OTP — share with your rider on handoff</Text>
            <Text style={s.otpValue}>{assignment.otp}</Text>
          </TouchableOpacity>
        )}

        <View style={s.timelineSection}>
          <Text style={s.sectionTitle}>Delivery Status</Text>
          {STEPS.map((step, i) => (
            <TimelineStep
              key={step}
              label={STEP_LABELS[step]}
              done={i <= currentIndex}
              isLast={i === STEPS.length - 1}
              live={step === currentStep && step !== 'DELIVERED'}
              subtext={step === currentStep && step === 'OUT_FOR_DELIVERY' ? formatEta(order.estimatedDeliveryAt) : undefined}
            />
          ))}
        </View>

        <OrderItemsSection items={order.items} />
        <OrderSummarySection order={order} />
      </ScrollView>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },
  mapPlaceholderWrap: { marginHorizontal: Spacing.lg, borderRadius: 20, marginBottom: Spacing.md },
  riderCardWrap: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
});
