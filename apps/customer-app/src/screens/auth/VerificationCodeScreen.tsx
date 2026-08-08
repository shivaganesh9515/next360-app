import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerificationCodeScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { sendOtp, verifyOtpAndAuth } = useAuth();
  const phone: string = route.params?.phone || '';
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
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
    if (digit && index < CODE_LENGTH - 1) {
      refs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const onKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleContinue = async () => {
    const otp = code.join('');
    if (otp.length !== CODE_LENGTH) {
      Alert.alert(t('auth.verify.incomplete.title'), t('auth.verify.incomplete.message', { length: CODE_LENGTH }));
      return;
    }
    setLoading(true);
    try {
      await verifyOtpAndAuth(phone, otp);
    } catch (err: any) {
      Alert.alert(t('auth.verify.invalid.title'), err.message || t('auth.verify.invalid.message'));
      setCode(Array(CODE_LENGTH).fill(''));
      setFocusedIndex(0);
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
      Alert.alert(t('auth.verify.resendError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* Background Graphic Blobs */}
      <View style={s.bgBlob1} />
      <View style={s.bgBlob2} />

      {/* Top Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.brandLabel}>OTP VERIFICATION</Text>
      </View>

      <View style={s.content}>
        <Text style={s.title}>{t('auth.verify.title')}</Text>
        <Text style={s.subtitle}>
          {t('auth.verify.subtitle', { phone: phone ? `+91 ${phone}` : 'your number' })}
        </Text>

        <View style={s.codeRow}>
          {Array(CODE_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              style={[
                s.box, 
                code[i] && s.boxFilled,
                focusedIndex === i && { borderColor: Colors.organic }
              ]}
              value={code[i]}
              onChangeText={(t) => onChange(t, i)}
              onKeyPress={(e) => onKeyPress(e, i)}
              onFocus={() => setFocusedIndex(i)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity disabled={countdown > 0 || resending} onPress={handleResend} hitSlop={8} style={s.resendWrap}>
          <Text style={countdown > 0 ? s.resendMuted : s.resend}>
            {countdown > 0 
              ? t('auth.verify.resendCountdown', { countdown }) 
              : resending 
                ? t('auth.verify.resending') 
                : t('auth.verify.resendCode')}
          </Text>
        </TouchableOpacity>

        <BigButton 
          label={t('common.continue')} 
          onPress={handleContinue} 
          loading={loading} 
          style={{ marginTop: 40, height: 52 }} 
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },

  // Background blobs for depth (matching PhoneAuthScreen)
  bgBlob1: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: '#E8F5E9', opacity: 0.6,
  },
  bgBlob2: {
    position: 'absolute', bottom: -100, left: -100,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: '#E0F7FA', opacity: 0.5,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingTop: 20,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 11, color: Colors.textSecondary, letterSpacing: 1.5,
  },

  title: {
    fontFamily: 'Inter_700Bold', fontSize: 26, color: Colors.text,
    lineHeight: 32, letterSpacing: -0.5, marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: 36,
  },

  codeRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24,
  },
  box: {
    width: 44, height: 52, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    fontFamily: 'Inter_600SemiBold', fontSize: 22, color: Colors.text,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  boxFilled: {
    borderColor: '#C8E6C9',
    backgroundColor: '#F1F8E9',
  },

  resendWrap: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  resend: {
    fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.organic,
  },
  resendMuted: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary,
  },
});
