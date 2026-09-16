import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Easing, Linking, Share, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useOrderTracking, STEPS, STEP_LABELS, currentStepFor } from '../../lib/useOrderTracking';
import {
  TrackingHeader, RiderCard, TimelineStep, DeliveryCountdown, OrderItemsSection, OrderSummarySection, s,
} from './OrderTrackingShared';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

// Demo-mode fallback destination — matches getDemoDeliveryAssignment's fixed
// route so the map has somewhere sensible to center on when the order's own
// address has no lat/lng (SelectLocationScreen only captures city/locality
// text today, not coordinates).
const FALLBACK_DESTINATION = { lat: 17.4483, lng: 78.3915 };
const REGION_STEP_MS = 3600;

function formatEta(iso: string | undefined, t: any): string | undefined {
  if (!iso) return undefined;
  return t('orderTracking.eta', { time: new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) });
}

// Native-only (see the sibling .web.tsx) — react-native-maps has no web
// implementation at all (it throws on import there), so Metro's platform file
// resolution picks this file for iOS/Android and the .web.tsx for web builds.
export default function OrderTrackingScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { orderId } = route.params || {};
  const { order, assignment, loading } = useOrderTracking(orderId);
  const mapRef = useRef<MapView>(null);
  // react-native-maps' Marker.Animated requires its own AnimatedRegion class
  // to actually animate — it has native-side wiring a plain Animated.Value
  // (or Animated.ValueXY) doesn't, so a raw Animated coordinate object would
  // silently fail to move at runtime despite type-checking fine.
  const riderRegion = useRef(new AnimatedRegion({
    latitude: FALLBACK_DESTINATION.lat, longitude: FALLBACK_DESTINATION.lng,
    latitudeDelta: 0.01, longitudeDelta: 0.01,
  })).current;
  const hasFitMap = useRef(false);

  const destination = order?.address?.lat && order?.address?.lng
    ? { latitude: order.address.lat, longitude: order.address.lng }
    : { latitude: FALLBACK_DESTINATION.lat, longitude: FALLBACK_DESTINATION.lng };

  const applyRiderPosition = useCallback((lat: number, lng: number) => {
    if (!hasFitMap.current) {
      riderRegion.setValue({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      hasFitMap.current = true;
      mapRef.current?.fitToCoordinates(
        [{ latitude: lat, longitude: lng }, destination],
        { edgePadding: { top: 40, right: 40, bottom: 120, left: 40 }, animated: true },
      );
    } else {
      riderRegion.timing({
        latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01,
        duration: REGION_STEP_MS,
        easing: Easing.linear,
        useNativeDriver: false,
        // AnimatedRegion.timing ignores toValue (it uses latitude/longitude
        // above as the target) — TimingAnimationConfig's type just requires
        // the field to be present.
        toValue: 0,
      }).start();
    }
  }, [destination.latitude, destination.longitude]);

  useEffect(() => {
    const lat = assignment?.deliveryPartner?.currentLat;
    const lng = assignment?.deliveryPartner?.currentLng;
    if (lat == null || lng == null) return;
    applyRiderPosition(lat, lng);
  }, [assignment?.deliveryPartner?.currentLat, assignment?.deliveryPartner?.currentLng, applyRiderPosition]);

  const handleCallRider = () => {
    if (!assignment?.deliveryPartner?.phone) return;
    Linking.openURL(`tel:${assignment.deliveryPartner.phone}`).catch(() => {});
  };

  const handleShareOtp = () => {
    if (!assignment?.otp) return;
    Share.share({ message: `Your Next360 delivery OTP is ${assignment.otp}` }).catch(() => {});
  };

  // Plain (non-animated) snapshot for the Polyline, which only accepts raw
  // LatLng values — it just redraws on each update rather than animating,
  // which is fine for a dashed reference line.
  const riderLatLng = assignment?.deliveryPartner?.currentLat != null && assignment?.deliveryPartner?.currentLng != null
    ? { latitude: assignment.deliveryPartner.currentLat, longitude: assignment.deliveryPartner.currentLng }
    : destination;

  const currentStep = currentStepFor(assignment);
  const currentIndex = STEPS.indexOf(currentStep);

  if (loading || !order) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><Text style={s.emptyText}>{t('orderTracking.loading')}</Text></View>
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
        <View style={local.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: destination.latitude, longitude: destination.longitude,
              latitudeDelta: 0.05, longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={destination} title={t('orderTracking.map.deliveryAddress')} pinColor={Colors.organic} />
            {assignment?.deliveryPartner?.currentLat != null && (
              <Marker.Animated coordinate={riderRegion as any} title={assignment.deliveryPartner.name}>
                <View style={s.riderMarker}>
                  <Ionicons name="bicycle" size={16} color={Colors.white} />
                </View>
              </Marker.Animated>
            )}
            <Polyline
              coordinates={[riderLatLng, destination]}
              strokeColor={Colors.organic}
              strokeWidth={3}
              lineDashPattern={[6, 6]}
            />
          </MapView>

          {assignment && assignment.status !== 'DELIVERED' && (
            <View style={s.riderCardOverlay}>
              <RiderCard assignment={assignment} onCall={handleCallRider} />
            </View>
          )}
        </View>

        {assignment?.otp && assignment.status !== 'DELIVERED' && (
          <TouchableOpacity style={s.otpCard} onPress={handleShareOtp}>
            <Text style={s.otpLabel}>{t('orderTracking.otp.label')}</Text>
            <Text style={s.otpValue}>{assignment.otp}</Text>
          </TouchableOpacity>
        )}

        <DeliveryCountdown
          estimatedAt={order.estimatedDeliveryAt}
          isDelivered={order.status === 'DELIVERED'}
        />

        <View style={s.timelineSection}>
          <Text style={s.sectionTitle}>{t('orderTracking.section.deliveryStatus')}</Text>
          {STEPS.map((step, i) => (
            <TimelineStep
              key={step}
              label={STEP_LABELS[step]}
              done={i <= currentIndex}
              isLast={i === STEPS.length - 1}
              live={step === currentStep && step !== 'DELIVERED'}
              subtext={step === currentStep && step === 'OUT_FOR_DELIVERY' ? formatEta(order.estimatedDeliveryAt, t) : undefined}
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
  mapWrap: { height: 260, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg },
});
