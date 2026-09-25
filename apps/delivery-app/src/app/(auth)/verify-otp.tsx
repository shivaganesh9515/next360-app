import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useSpringEntrance } from '../../hooks/useDeliveryAnimation';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const { phone, sentAt } = useLocalSearchParams<{ phone: string; sentAt?: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { verifyPhoneOtp, sendPhoneOtp, getEntryRoute } = useAuthStore();
  const fadeAnim = useSpringEntrance(0);

  const initialRemaining = useMemo(() => {
    const ts = Number(sentAt);
    if (!Number.isFinite(ts) || ts <= 0) return 0;
    const elapsed = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    return Math.max(0, RESEND_COOLDOWN_SECONDS - elapsed);
  }, [sentAt]);

  const [cooldown, setCooldown] = useState(initialRemaining);

  const startCooldown = useCallback((from: number = RESEND_COOLDOWN_SECONDS) => {
    setCooldown(from);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (initialRemaining > 0) startCooldown(initialRemaining);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [initialRemaining, startCooldown]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert('Incomplete', 'Please enter the full 6-digit code.');
      return;
    }
    setIsLoading(true);
    try {
      await verifyPhoneOtp(phone, otp);
      router.replace(getEntryRoute() as Href);
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('expired')) {
        Alert.alert('Code Expired', 'Your code has expired. Request a new one below.');
      } else if (message.includes('Incorrect')) {
        Alert.alert('Incorrect Code', 'That code is not correct. Check it and try again.');
      } else {
        Alert.alert('Verification Failed', message || 'Invalid or expired code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await sendPhoneOtp(phone);
      startCooldown();
      Alert.alert('Code sent', `A new verification code was sent to ${phone}.`);
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('60 seconds')) {
        Alert.alert('Too Soon', 'Please wait before requesting another code.');
        startCooldown();
      } else {
        Alert.alert('Error', message || 'Could not resend code.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View
        style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
      >
        {/* Header */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneHighlight}>{phone}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                otp.length === i && styles.otpBoxActive,
                otp.length > i && styles.otpBoxFilled,
              ]}
            >
              <Text style={styles.otpDigit}>
                {otp[i] || (otp.length === i ? '|' : '')}
              </Text>
            </View>
          ))}
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.primaryButton, (isLoading || otp.length < 6) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || otp.length < 6}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <TouchableOpacity
          style={styles.resendLink}
          onPress={handleResend}
          disabled={cooldown > 0 || isResending}
        >
          <Text style={styles.resendText}>
            Didn't receive code?{' '}
            {cooldown > 0 ? (
              <Text style={styles.resendCooldown}>Resend in {cooldown}s</Text>
            ) : (
              <Text style={styles.resendAction}>{isResending ? 'Sending…' : 'Resend'}</Text>
            )}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  headerSection: {
    position: 'absolute',
    top: 60,
    left: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  backArrow: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 40,
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '600',
    color: Colors.primary,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    position: 'relative',
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  otpBoxFilled: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primaryLight,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  otpInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  resendLink: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendAction: {
    color: Colors.primary,
    fontWeight: '600',
  },
  resendCooldown: {
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});
