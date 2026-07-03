import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useDeliveryStore } from '../../store/deliveryStore';

type DeliveryStatus = 'ASSIGNED' | 'PICKING_UP' | 'IN_TRANSIT' | 'DELIVERED';

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeDeliveries, fetchActiveDeliveries, updateDeliveryStatus, verifyPickupOTP, isLoading } = useDeliveryStore();
  const [order, setOrder] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>('ASSIGNED');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchActiveDeliveries();
  }, []);

  useEffect(() => {
    if (activeDeliveries.length > 0 && id) {
      const found = activeDeliveries.find(o => o.id === id);
      if (found) {
        setOrder(found);
        setCurrentStatus(found.status as DeliveryStatus);
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
      await updateDeliveryStatus(id!, newStatus);
      setCurrentStatus(newStatus);
      if (newStatus === 'DELIVERED') {
        Alert.alert('Delivery Complete!', 'Great job! The delivery has been completed.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update delivery status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setIsProcessing(true);
    try {
      await verifyPickupOTP(id!, otp);
      setShowOTPModal(false);
      setOtp('');
      setCurrentStatus('IN_TRANSIT');
      Alert.alert('OTP Verified', 'You can now proceed with the delivery');
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

  const formatCurrency = (amount: number) => `₹${(amount / 100).toLocaleString('en-IN')}`;

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
              Ask the vendor for the 4-digit OTP to confirm pickup
            </Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="••••"
              placeholderTextColor="#D1D5DB"
              keyboardType="number-pad"
              maxLength={4}
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressSteps}>
            {statusSteps.map((step, index) => (
              <React.Fragment key={step.key}>
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, step.isActive && styles.stepIconActive, step.isCurrent && styles.stepIconCurrent]}>
                    <Ionicons
                      name={step.icon as any}
                      size={20}
                      color={step.isActive ? '#FFFFFF' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.stepLabel, step.isActive && styles.stepLabelActive]}>
                    {step.label}
                  </Text>
                </View>
                {index < statusSteps.length - 1 && (
                  <View style={[styles.stepLine, step.isActive && styles.stepLineActive]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

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
          <Text style={styles.earningsAmount}>{formatCurrency(order.deliveryFee || 15000)}</Text>
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
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call-outline" size={20} color="#10B981" />
                <Text style={styles.callText}>Call Customer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {currentStatus === 'ASSIGNED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleStatusUpdate('PICKING_UP')}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Start Pickup</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {currentStatus === 'IN_TRANSIT' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => handleStatusUpdate('DELIVERED')}
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
        )}

        {currentStatus !== 'DELIVERED' && (
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
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: {
    backgroundColor: '#10B981',
  },
  stepIconCurrent: {
    backgroundColor: '#059669',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#059669',
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
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
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
