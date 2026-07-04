import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Colors, Typography } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const CODE_LENGTH = 6;

export default function VerificationCodeScreen({ navigation, route }: any) {
  const { verifyOtp } = useAuth();
  const email: string = route.params?.email || '';
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
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
      await verifyOtp(email, otp);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Invalid code', err.message || 'That code did not match. Try again.');
      setCode(Array(CODE_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.content}>
        <Text style={s.title}>Verification Code</Text>
        <Text style={s.subtitle}>
          Enter the code we sent to{email ? ` ${email}` : ' your email'}.
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

        <TouchableOpacity disabled={countdown > 0} onPress={() => setCountdown(30)} hitSlop={8}>
          <Text style={countdown > 0 ? s.resendMuted : s.resend}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
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
