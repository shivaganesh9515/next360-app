import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDeliveryFee } from '../../lib/pricing';

const AUTO_RETURN_MS = 3000;

// Dedicated "brief confirmation, auto-returns to Home" screen per the
// CLAUDE.md spec — previously this was collapsed into a plain Alert.alert
// with no auto-return, requiring a manual tap to leave.
export default function DeliveryCompleteScreen() {
  const { earning } = useLocalSearchParams<{ earning?: string }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, AUTO_RETURN_MS);
    return () => clearTimeout(timer);
  }, []);

  const earningValue = earning ? Number(earning) : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={56} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>Delivery Complete!</Text>
      <Text style={styles.subtitle}>Great job getting this order there safely.</Text>

      {earningValue !== undefined && (
        <View style={styles.earningCard}>
          <Text style={styles.earningLabel}>You earned</Text>
          <Text style={styles.earningValue}>{formatDeliveryFee(earningValue)}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.doneText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  earningCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 32,
  },
  earningLabel: {
    fontSize: 13,
    color: '#059669',
  },
  earningValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#059669',
    marginTop: 4,
  },
  doneButton: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  doneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
});
