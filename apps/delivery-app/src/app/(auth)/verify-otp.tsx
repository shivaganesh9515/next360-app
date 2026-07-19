import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyPhoneOtp, sendPhoneOtp } = useAuthStore();

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Enter the 6-digit code sent to your phone');
      return;
    }
    setIsLoading(true);
    try {
      await verifyPhoneOtp(phone, otp);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await sendPhoneOtp(phone);
      Alert.alert('Code sent', `A new code was sent to ${phone}.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not resend code');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {phone}</Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          placeholder="••••••"
          placeholderTextColor="#D1D5DB"
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resend} onPress={handleResend}>
          <Text style={styles.resendText}>Resend code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  otpInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 12,
    paddingVertical: 18,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resend: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#10B981',
  },
});
