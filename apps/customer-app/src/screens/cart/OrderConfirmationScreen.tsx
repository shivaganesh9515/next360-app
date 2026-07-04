import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

const GREEN = Colors.organic;

export default function OrderConfirmationScreen({ navigation, route }: any) {
  const { orderId } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={GREEN} />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>Your order has been successfully placed</Text>

        {/* Order ID */}
        {orderId && (
          <View style={styles.orderIdCard}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>
          </View>
        )}

        {/* Estimated Delivery */}
        <View style={styles.deliveryInfo}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text style={styles.deliveryText}>Estimated delivery: 30-45 minutes</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={() => navigation.navigate('OrderDetail', { orderId })}
        >
          <Text style={styles.trackButtonText}>Track Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ordersButton}
          onPress={() => navigation.navigate('Main', { screen: 'Orders' })}
        >
          <Text style={styles.ordersButtonText}>View Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderIdCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  deliveryText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  trackButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ordersButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ordersButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  shopButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  shopButtonText: {
    fontSize: 14,
    color: GREEN,
  },
});
