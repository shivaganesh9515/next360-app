import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal, Linking, Image, Animated, Platform } from 'react-native';
import DeliveryMap, { DeliveryMapMarker } from '../../components/DeliveryMap';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeliveryStore } from '../../store/deliveryStore';
import { formatDeliveryFee } from '../../lib/pricing';
import { deliveryApi } from '../../lib/api';

type DeliveryStatus = 'ASSIGNED' | 'PICKING_UP' | 'IN_TRANSIT' | 'DELIVERED';

// Map whatever status string the API returns onto the screen's status union.
// The backend now emits exactly these four values, but an unknown value must
// degrade to ASSIGNED instead of being force-cast and breaking the UI.
function toDeliveryStatus(status?: string | null): DeliveryStatus {
  switch (status) {
    case 'PICKING_UP':
      return 'PICKING_UP';
    case 'IN_TRANSIT':
      return 'IN_TRANSIT';
    case 'DELIVERED':
      return 'DELIVERED';
    default:
      return 'ASSIGNED';
  }
}

const LOCATION_PUSH_INTERVAL_MS = 15000;
const LOCATION_PUSH_DISTANCE_M = 50;

export default function DeliveryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeDeliveries, fetchActiveDeliveries, updateDeliveryStatus, verifyPickupOTP, startTransit, isLoading } = useDeliveryStore();
  const [order, setOrder] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>('ASSIGNED');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [failureDetails, setFailureDetails] = useState('');

  // Spring animation for each status dot — when the status advances, the
  // newly active dot springs with a scale pulse to signal the transition.
  const activeDotScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(activeDotScale, { toValue: 1.2, friction: 5, tension: 300, useNativeDriver: true }),
      Animated.spring(activeDotScale, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }),
    ]).start();
  }, [currentStatus]);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    fetchActiveDeliveries();
  }, []);

  // Push the courier's position periodically while a delivery is active, per
  // the CLAUDE.md real-time tracking design (partner pushes lat/lng, no
  // polling on the read side). The endpoint may not exist server-side yet —
  // that failure is swallowed so it doesn't interrupt the delivery flow; the
  // client-side push loop itself was previously missing entirely.
  useEffect(() => {
    if (currentStatus === 'DELIVERED') return;

    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_PUSH_INTERVAL_MS,
          distanceInterval: LOCATION_PUSH_DISTANCE_M,
        },
        (position) => {
          const { latitude, longitude } = position.coords;
          setDeviceLocation({ lat: latitude, lng: longitude });
          if (id) {
            deliveryApi.updateLocation(latitude, longitude).catch((err) => {
              // Never interrupt the delivery flow on a tracking push failure,
              // but surface it in logs so a broken location pipe is detectable.
              if (!cancelled) console.warn('Location push failed:', err?.message || err);
            });
          }
        },
      );
    })();

    return () => {
      cancelled = true;
      watchSubscription.current?.remove();
      watchSubscription.current = null;
    };
  }, [currentStatus, id]);

  useEffect(() => {
    if (activeDeliveries.length > 0 && id) {
      const found = activeDeliveries.find(o => o.id === id);
      if (found) {
        setOrder(found);
        setCurrentStatus(toDeliveryStatus(found.status));
      }
    }
  }, [activeDeliveries, id]);

  const handleStatusUpdate = async (newStatus: DeliveryStatus) => {
    if (newStatus === 'PICKING_UP') {
      setShowOTPModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      await updateDeliveryStatus(order?.orderId ?? id!, newStatus);
      setCurrentStatus(newStatus);
      if (newStatus === 'DELIVERED') {
        router.replace(
          order?.deliveryFee != null
            ? `/delivery/complete?earning=${order.deliveryFee}`
            : '/delivery/complete',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update delivery status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the valid 6-digit OTP');
      return;
    }

    setIsProcessing(true);
    try {
      // The verify-pickup / start-transit endpoints resolve assignment through
      // the parent ORDER id — the list key `id` is the group id, not the order
      // id, so pass order.orderId here.
      const orderId = order?.orderId ?? id!;
      await verifyPickupOTP(orderId, otp);
      setShowOTPModal(false);
      setOtp('');
      setCurrentStatus('PICKING_UP');
      // Chained state-machine leg: PICKED_UP -> OUT_FOR_DELIVERY. Do not set
      // IN_TRANSIT locally before the backend confirms it.
      try {
        await startTransit(orderId);
        setCurrentStatus('IN_TRANSIT');
      } catch {
        Alert.alert(
          'OTP Verified',
          'Pickup confirmed. Tap "Start Transit" once you are on the road.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'ASSIGNED', label: 'Assigned', icon: 'checkmark-circle' },
      { key: 'PICKING_UP', label: 'Picking Up', icon: 'location' },
      { key: 'IN_TRANSIT', label: 'In Transit', icon: 'car' },
      { key: 'DELIVERED', label: 'Delivered', icon: 'flag' },
    ];

    const statusOrder: Record<DeliveryStatus, number> = {
      ASSIGNED: 0,
      PICKING_UP: 1,
      IN_TRANSIT: 2,
      DELIVERED: 3,
    };

    const currentIndex = statusOrder[currentStatus] || 0;

    return steps.map((step, index) => ({
      ...step,
      isActive: index <= currentIndex,
      isCurrent: index === currentIndex,
    }));
  };

  const handleCallCustomer = () => {
    if (order?.user?.phone) {
      Linking.openURL(`tel:${order.user.phone}`);
    }
  };

  // Launch turn-by-turn navigation to the pickup or drop point. Uses whatever
  // maps app is installed (Apple Maps on iOS, Google Maps otherwise) via its
  // universal URL scheme. Degrades to a plain alert with the street address
  // when the backend didn't attach coordinates.
  const handleNavigate = (target: 'pickup' | 'drop') => {
    const coords =
      target === 'pickup'
        ? order?.vendorGroups?.[0]?.vendor
        : (order?.address ?? {});

    const lat = coords?.lat;
    const lng = coords?.lng;
    const address = target === 'pickup'
      ? order?.vendorGroups?.[0]?.vendor?.name || 'Pickup point'
      : order?.address?.street || 'Customer location';

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      Alert.alert(
        'Navigation unavailable',
        `${address}\n\nNo coordinates were provided for this location. Use a maps app with the address above.`,
      );
      return;
    }

    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.canOpenURL(url).then((ok) => {
      if (ok) Linking.openURL(url);
      else Alert.alert('Navigation unavailable', 'No maps app found on this device.');
    });
  };

  // Number masking for privacy — show only last 4 digits on screen
  // but still place the real call when tapped (per CLAUDE.md spec)
  const maskedPhone = order?.user?.phone
    ? `${order.user.phone.slice(0, -4).replace(/\d/g, '*')}${order.user.phone.slice(-4)}`
    : null;

  const handleTakeProofPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to capture delivery proof photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProofPhoto(result.assets[0].uri);
    }
  };

  const handleStartTransit = async () => {
    if (!order) return;
    setIsProcessing(true);
    try {
      await startTransit(order.orderId ?? id!);
      setCurrentStatus('IN_TRANSIT');
    } catch {
      Alert.alert('Error', 'Failed to start transit. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteWithPhoto = async (opts?: { skipped?: boolean; reason?: string }) => {
    setUploadError(null);
    setIsProcessing(true);
    try {
      // Upload proof photo if taken. A failed upload BLOCKS completion —
      // it is never swallowed — until retry succeeds or the partner
      // explicitly skips with a recorded reason.
      if (proofPhoto && !opts?.skipped) {
        const formData = new FormData();
        const filename = proofPhoto.split('/').pop() || 'delivery-proof.jpg';
        formData.append('file', { uri: proofPhoto, name: filename, type: 'image/jpeg' } as any);
        try {
          await deliveryApi.upload('/upload', formData);
        } catch (uploadErr: any) {
          setUploadError(uploadErr?.message || 'Photo upload failed. Check your connection and retry.');
          return;
        }
      }
      await updateDeliveryStatus(
        order?.orderId ?? id!,
        'DELIVERED',
        opts?.skipped ? { proofSkipped: true, skipReason: opts.reason } : undefined,
      );
      setCurrentStatus('DELIVERED');
      router.replace(
        order?.deliveryFee != null
          ? `/delivery/complete?earning=${order.deliveryFee}`
          : '/delivery/complete',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to complete delivery');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSkipUpload = async () => {
    const reason = skipReason.trim();
    if (!reason) return;
    setShowSkipModal(false);
    setSkipReason('');
    await handleCompleteWithPhoto({ skipped: true, reason });
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </View>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <View style={styles.container}>
      {/* OTP Modal */}
      <Modal visible={showOTPModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Pickup OTP</Text>
            <Text style={styles.modalSubtitle}>
              Ask the vendor for the 6-digit OTP to confirm pickup
            </Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="••••••"
              placeholderTextColor="#D1D5DB"
              keyboardType="number-pad"
              maxLength={6}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowOTPModal(false);
                  setOtp('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isProcessing && styles.modalConfirmDisabled]}
                onPress={handleVerifyOTP}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Map — the screen's dominant surface, per the "map-first" design
          rule. State changes (pickup/drop, courier position) update markers
          in place; the screen never re-navigates. */}
      <DeliveryMap
        style={styles.map}
        initialRegion={{
          latitude: order.address?.lat || order.vendorGroups?.[0]?.vendor?.lat || 17.385,
          longitude: order.address?.lng || order.vendorGroups?.[0]?.vendor?.lng || 78.4867,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        markers={[
          ...(order.vendorGroups?.[0]?.vendor?.lat && order.vendorGroups?.[0]?.vendor?.lng ? [{
            key: 'pickup',
            latitude: order.vendorGroups[0].vendor.lat,
            longitude: order.vendorGroups[0].vendor.lng,
            title: 'Pickup',
            description: order.vendorGroups[0].vendor.name,
            pinColor: '#10B981',
          }] : []),
          ...(order.address?.lat && order.address?.lng ? [{
            key: 'drop',
            latitude: order.address.lat,
            longitude: order.address.lng,
            title: 'Drop',
            description: order.address.street,
            pinColor: '#EF4444',
          }] : []),
          ...(deviceLocation ? [{
            key: 'you',
            latitude: deviceLocation.lat,
            longitude: deviceLocation.lng,
            title: 'You',
            pinColor: '#3B82F6',
          }] : []),
        ] as DeliveryMapMarker[]}
      />

      {/* Compact status strip overlaid on the map — active dot springs
          with a scale pulse when the status advances, making the state
          transition feel tactile instead of instant. */}
      <View style={styles.statusStrip}>
        {statusSteps.map((step, index) => {
          const lastActiveIdx = statusSteps.reduce((last, s, i) => s.isActive ? i : last, -1);
          const isLastActive = step.isActive && index === lastActiveIdx;
          return (
            <React.Fragment key={step.key}>
              <Animated.View
                style={[
                  styles.stripDot, step.isActive && styles.stripDotActive,
                  isLastActive && { transform: [{ scale: activeDotScale }] },
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={14}
                  color={step.isActive ? '#FFFFFF' : '#9CA3AF'}
                />
              </Animated.View>
              {index < statusSteps.length - 1 && (
                <View style={[styles.stripLine, step.isActive && styles.stripLineActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView style={styles.bottomPanel} contentContainerStyle={styles.content}>
        {/* Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderTime}>
              {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.locationSection}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#10B981' }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP</Text>
                <Text style={styles.locationText}>
                  {order.vendorGroups?.[0]?.vendor?.name || 'Vendor location'}
                </Text>
                <Text style={styles.locationAddress}>
                  {order.vendorGroups?.[0]?.vendor?.address || 'Address not available'}
                </Text>
              </View>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>DROP</Text>
                <Text style={styles.locationText}>
                  {order.user?.name || 'Customer'}
                </Text>
                <Text style={styles.locationAddress}>
                  {order.address?.street || 'Address not available'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Your Earning</Text>
          <Text style={styles.earningsAmount}>{formatDeliveryFee(order.deliveryFee)}</Text>
        </View>

        {/* Customer Info */}
        {order.user && (
          <View style={styles.customerCard}>
            <Text style={styles.customerTitle}>Customer</Text>
            <View style={styles.customerInfo}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
              <Text style={styles.customerName}>{order.user.name}</Text>
            </View>
            {order.user.phone && (
              <View>
                <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                  <Ionicons name="call-outline" size={20} color="#10B981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.callText}>Call Customer</Text>
                    {maskedPhone && (
                      <Text style={styles.maskedPhone}>{maskedPhone}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#059669" />
                </TouchableOpacity>
              </View>
            )}

            {/* Proof of delivery photo — capture before marking delivered */}
{currentStatus === 'PICKING_UP' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleStartTransit}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="car-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Start Transit</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'IN_TRANSIT' && (
              <View style={{ marginTop: 12 }}>
                <TouchableOpacity style={styles.cameraButton} onPress={handleTakeProofPhoto}>
                  {proofPhoto ? (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={{ uri: proofPhoto }} style={styles.proofThumb} />
                      <Text style={[styles.cameraButtonText, { marginLeft: 8 }]}>Photo taken ✓</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={20} color="#10B981" />
                      <Text style={styles.cameraButtonText}>Capture Proof of Delivery</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Failed Delivery Modal */}
      <Modal visible={showFailureModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery Issue</Text>
            <Text style={styles.modalSubtitle}>What's the issue with this delivery?</Text>

            {['CUSTOMER_UNAVAILABLE', 'WRONG_ADDRESS', 'RESCHEDULE', 'RETURNED_TO_STORE', 'OTHER'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.failureOption,
                  failureReason === r && styles.failureOptionSelected,
                ]}
                onPress={() => setFailureReason(r)}
              >
                <Ionicons
                  name={failureReason === r ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={failureReason === r ? '#10B981' : '#9CA3AF'}
                />
                <Text style={styles.failureOptionText}>
                  {r === 'CUSTOMER_UNAVAILABLE' ? 'Customer Not Available' :
                   r === 'WRONG_ADDRESS' ? 'Wrong Address' :
                   r === 'RESCHEDULE' ? 'Reschedule Delivery' :
                   r === 'RETURNED_TO_STORE' ? 'Return to Store' : 'Other Issue'}
                </Text>
              </TouchableOpacity>
            ))}

            <TextInput
              style={styles.failureDetails}
              value={failureDetails}
              onChangeText={setFailureDetails}
              placeholder="Additional details (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowFailureModal(false);
                  setFailureReason('');
                  setFailureDetails('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!failureReason || isProcessing) && styles.modalConfirmDisabled]}
                onPress={async () => {
                  if (!failureReason) return;
                  setIsProcessing(true);
                  try {
                    await deliveryApi.reportDeliveryFailure({
                      orderId: order?.orderId ?? id!,
                      reason: failureReason,
                      details: failureDetails || undefined,
                    });
                    setShowFailureModal(false);
                    Alert.alert('Reported', 'Delivery issue has been reported. You will be assigned to the next available order.');
                    router.replace('/(tabs)');
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to report issue');
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={!failureReason || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Skip-upload modal — completing without proof requires a reason,
          which is sent with the status update for the audit trail. */}
      <Modal visible={showSkipModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skip Photo Upload?</Text>
            <Text style={styles.modalSubtitle}>
              The delivery will be marked complete without proof. Tell us why the photo couldn't upload.
            </Text>
            <TextInput
              style={styles.failureDetails}
              value={skipReason}
              onChangeText={setSkipReason}
              placeholder="Reason (required)"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowSkipModal(false);
                  setSkipReason('');
                }}
              >
                <Text style={styles.modalCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!skipReason.trim() || isProcessing) && styles.modalConfirmDisabled]}
                onPress={handleConfirmSkipUpload}
                disabled={!skipReason.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Complete Anyway</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {currentStatus === 'ASSIGNED' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleNavigate('pickup')}
            >
              <Ionicons name="navigate" size={20} color="#059669" />
              <Text style={styles.secondaryButtonText}>Navigate to Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleStatusUpdate('PICKING_UP')}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>I&apos;m at Pickup</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {currentStatus === 'IN_TRANSIT' && (
          <>
            {/* Upload error banner — completion stays blocked until the
                partner retries (primary action) or skips with a reason. */}
            {uploadError && (
              <View style={styles.uploadErrorBox}>
                <View style={styles.uploadErrorRow}>
                  <Ionicons name="cloud-offline-outline" size={20} color="#DC2626" />
                  <Text style={styles.uploadErrorText}>{uploadError}</Text>
                </View>
                <View style={styles.uploadErrorActions}>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => handleCompleteWithPhoto()}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.retryText}>Retry Upload</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowSkipModal(true)} disabled={isProcessing}>
                    <Text style={styles.skipText}>Skip with reason</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleNavigate('drop')}
            >
              <Ionicons name="navigate" size={20} color="#059669" />
              <Text style={styles.secondaryButtonText}>Navigate to Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleCompleteWithPhoto()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Mark Delivered</Text>
                </>
              )}
            </TouchableOpacity>
            {/* Failed delivery option — report an issue instead of delivering */}
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => setShowFailureModal(true)}
            >
              <Ionicons name="alert-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Report Issue</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Once a delivery is picked up and in transit, the courier must stay
            in this screen — no exit route back to the tab bar/dashboard,
            per the "no nav during an active delivery" design rule. */}
        {currentStatus === 'ASSIGNED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  map: {
    height: '42%',
    width: '100%',
  },
  statusStrip: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  stripDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stripDotActive: {
    backgroundColor: '#10B981',
  },
  stripLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  stripLineActive: {
    backgroundColor: '#10B981',
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  locationSection: {
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginTop: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  earningsCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#059669',
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  customerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  callText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 8,
  },
  maskedPhone: {
    fontSize: 13,
    color: '#6B7280',
    // System monospace — the JetBrainsMono expo-font was never loaded.
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 28,
    marginTop: 2,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 8,
  },
  proofThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  modalConfirmDisabled: {
    backgroundColor: '#9CA3AF',
  },
  failureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
  },
  failureOptionSelected: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  failureOptionText: {
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 12,
  },
  failureDetails: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  uploadErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  uploadErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
  },
  uploadErrorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
