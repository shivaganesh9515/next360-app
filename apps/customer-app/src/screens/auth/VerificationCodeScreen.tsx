import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Colors, Typography } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

// The primary login/signup action itself, not a secondary verification step —
// success flips isAuthenticated (via AuthProvider), which unmounts the whole
// AuthStack and mounts the main app, so there's no navigation call needed on
// success. Whether this created a new account or logged an existing one in
// happens server-side (or in the demo fallback); this screen doesn't care.
export default function VerificationCodeScreen({ navigation, route }: any) {
  const { sendOtp, verifyOtpAndAuth } = useAuth();
  const phone: string = route.params?.phone || '';
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '');
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < CODE_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const onKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleContinue = async () => {
    const otp = code.join('');
    if (otp.length !== CODE_LENGTH) {
      Alert.alert('Incomplete code', `Enter all ${CODE_LENGTH} digits.`);
      return;
    }
    setLoading(true);
    try {
      await verifyOtpAndAuth(phone, otp);
      // No navigation.goBack() here — AuthProvider's user state flipping to
      // non-null makes AppNavigator swap AuthStack for the main app itself.
    } catch (err: any) {
      Alert.alert('Invalid code', err.message || 'That code did not match. Try again.');
      setCode(Array(CODE_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await sendOtp(phone);
      setCountdown(RESEND_SECONDS);
    } catch (err: any) {
      Alert.alert('Could not resend code', err.message || 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.content}>
        <Text style={s.title}>Verification Code</Text>
        <Text style={s.subtitle}>
          Enter the code we sent to{phone ? ` +91 ${phone}` : ' your number'}.
        </Text>

        <View style={s.codeRow}>
          {Array(CODE_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              style={[s.box, code[i] && s.boxFilled]}
              value={code[i]}
              onChangeText={(t) => onChange(t, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity disabled={countdown > 0 || resending} onPress={handleResend} hitSlop={8}>
          <Text style={countdown > 0 ? s.resendMuted : s.resend}>
            {countdown > 0 ? `Resend code in ${countdown}s` : resending ? 'Resending...' : 'Resend Code'}
          </Text>
        </TouchableOpacity>

        <BigButton label="Continue" onPress={handleContinue} loading={loading} style={{ marginTop: 40 }} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 40 },
  title: { ...Typography.display, color: Colors.text, marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: 36 },

  codeRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 20,
  },
  box: {
    width: 48, height: 56, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
    fontFamily: 'Inter_600SemiBold', fontSize: 22, color: Colors.text,
  },
  boxFilled: { borderColor: Colors.organic, backgroundColor: Colors.organicLight },

  resend: { ...Typography.bodySmall, color: Colors.organic, textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  resendMuted: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center' },
});
