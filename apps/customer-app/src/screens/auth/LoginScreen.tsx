import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';

const { width, height } = Dimensions.get('window');

const G = {
  white:      '#FFFFFF',
  green:      '#2A7A4B',
  greenDark:  '#1A5C35',
  greenLight: '#EBF8F0',
  greenMid:   '#D4EDDA',
  textDark:   '#1C1C1E',
  textMid:    '#3C3C43',
  textGray:   '#8E8E93',
  border:     '#E5E5EA',
  inputBg:    '#F5F5F5',
  error:      '#FF3B30',
};

const OTP_LENGTH = 6;

export default function LoginScreen({ navigation }: any) {
  const { sendPhoneOtp, verifyPhoneOtp, skipAuth } = useAuth();

  // Step 1: phone entry — Step 2: OTP verification
  const [step,        setStep]        = useState<'phone' | 'otp'>('phone');
  const [phone,       setPhone]       = useState('');
  const [otp,         setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading,     setLoading]     = useState(false);
  const [countdown,   setCountdown]   = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCountdown = () => {
    setCountdown(30);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // ── Step 1: send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('Invalid number', 'Enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOtp(`+91${cleaned}`);
      setStep('otp');
      startCountdown();
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP box handlers ───────────────────────────────────────────────────────
  const handleOtpChange = (text: string, index: number) => {
    // Handle paste: if text > 1 char, distribute across boxes
    if (text.length > 1) {
      const chars = text.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const next = [...otp];
      chars.forEach((c, i) => { if (index + i < OTP_LENGTH) next[index + i] = c; });
      setOtp(next);
      const jump = Math.min(index + chars.length, OTP_LENGTH - 1);
      otpRefs.current[jump]?.focus();
      return;
    }
    const digit = text.replace(/\D/g, '');
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Incomplete OTP', 'Enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(`+91${phone.replace(/\D/g, '')}`, code);
    } catch (err: any) {
      Alert.alert('Invalid OTP', err.message || 'Wrong OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    await handleSendOtp();
  };

  // ── Phone step ─────────────────────────────────────────────────────────────
  const renderPhoneStep = () => (
    <>
      {/* Illustration */}
      <View style={s.illustration}>
        <View style={s.bgCircleLg} />
        <View style={s.bgCircleSm} />
        <View style={s.logoCircle}>
          <Text style={s.logoEmoji}>🛒</Text>
        </View>
        <Text style={s.appName}>Next360</Text>
        <Text style={s.appTagline}>Fresh. Natural. Delivered.</Text>
      </View>

      {/* Card */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Enter your mobile number</Text>
        <Text style={s.cardSub}>We'll send a 6-digit OTP to verify your number</Text>

        {/* Phone input */}
        <View style={s.phoneRow}>
          <View style={s.countryPill}>
            <Text style={s.flag}>🇮🇳</Text>
            <Text style={s.countryCode}>+91</Text>
          </View>
          <TextInput
            style={s.phoneInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Mobile number"
            placeholderTextColor={G.textGray}
            keyboardType="phone-pad"
            maxLength={10}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[s.ctaBtn, (!phone || loading) && { opacity: 0.6 }]}
          onPress={handleSendOtp}
          disabled={!phone || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={G.white} size="small" />
            : <Text style={s.ctaTxt}>Get OTP →</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Trust strip */}
      <View style={s.trustStrip}>
        <Text style={s.trustItem}>🔒  Secure & private</Text>
        <View style={s.trustDot} />
        <Text style={s.trustItem}>No spam calls</Text>
      </View>
    </>
  );

  // ── OTP step ───────────────────────────────────────────────────────────────
  const renderOtpStep = () => (
    <>
      {/* Back + heading */}
      <View style={s.otpHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => setStep('phone')}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={s.otpHeadText}>
          <Text style={s.cardTitle}>Verify your number</Text>
          <Text style={s.cardSub}>
            OTP sent to <Text style={{ color: G.green, fontFamily: 'Inter_600SemiBold' }}>+91 {phone}</Text>
          </Text>
        </View>
      </View>

      {/* OTP boxes */}
      <View style={s.otpRow}>
        {Array(OTP_LENGTH).fill(null).map((_, i) => (
          <TextInput
            key={i}
            ref={el => { otpRefs.current[i] = el; }}
            style={[s.otpBox, otp[i] ? s.otpBoxFilled : null]}
            value={otp[i]}
            onChangeText={t => handleOtpChange(t, i)}
            onKeyPress={e => handleOtpKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            selectTextOnFocus
            textAlign="center"
          />
        ))}
      </View>

      <TouchableOpacity
        style={[s.ctaBtn, { marginHorizontal: 0 }, loading && { opacity: 0.6 }]}
        onPress={handleVerify}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={G.white} size="small" />
          : <Text style={s.ctaTxt}>Verify & Continue</Text>
        }
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity onPress={handleResend} disabled={countdown > 0} style={s.resendRow}>
        {countdown > 0
          ? <Text style={s.resendGray}>Resend OTP in <Text style={{ color: G.green }}>{countdown}s</Text></Text>
          : <Text style={s.resendActive}>Resend OTP</Text>
        }
      </TouchableOpacity>
    </>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={G.white} />

      {/* Dev skip button */}
      {__DEV__ && (
        <TouchableOpacity style={s.skipBtn} onPress={skipAuth}>
          <Text style={s.skipTxt}>Dev Skip</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SafeAreaView edges={['top']} style={s.flex}>
            <View style={s.content}>
              {step === 'phone' ? renderPhoneStep() : renderOtpStep()}
            </View>

            {/* Footer */}
            <Text style={s.terms}>
              By continuing, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: G.white },
  flex:    { flex: 1 },
  scroll:  { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  // Dev skip
  skipBtn: { position: 'absolute', top: 48, right: 20, zIndex: 10 },
  skipTxt: { fontFamily: 'Inter_400Regular', fontSize: 12, color: G.textGray },

  // Illustration
  illustration: {
    height: height * 0.26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  bgCircleLg: {
    position: 'absolute', width: width * 0.65, height: width * 0.65,
    borderRadius: width * 0.325, backgroundColor: G.greenMid,
    top: -width * 0.18, right: -width * 0.18, opacity: 0.6,
  },
  bgCircleSm: {
    position: 'absolute', width: width * 0.38, height: width * 0.38,
    borderRadius: width * 0.19, backgroundColor: G.greenLight,
    bottom: -width * 0.08, left: -width * 0.04, opacity: 0.8,
  },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: G.green, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: G.green, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoEmoji: { fontSize: 34 },
  appName: {
    fontFamily: 'Fraunces_700Bold', fontSize: 26, color: G.textDark, letterSpacing: -0.5,
  },
  appTagline: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: G.textGray, marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: G.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 20, elevation: 4,
    borderWidth: 1, borderColor: G.border,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold', fontSize: 20, color: G.textDark, marginBottom: 6,
  },
  cardSub: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: G.textGray, marginBottom: 24, lineHeight: 20,
  },

  // Phone input
  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  countryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: G.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: G.border, paddingHorizontal: 14, height: 52,
  },
  flag: { fontSize: 20 },
  countryCode: {
    fontFamily: 'Inter_600SemiBold', fontSize: 15, color: G.textDark,
  },
  phoneInput: {
    flex: 1, height: 52,
    backgroundColor: G.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: G.border, paddingHorizontal: 16,
    fontFamily: 'Inter_400Regular', fontSize: 18, color: G.textDark,
    letterSpacing: 2,
  },

  // CTA button
  ctaBtn: {
    backgroundColor: G.greenDark, borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: G.green, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  ctaTxt: {
    fontFamily: 'Inter_600SemiBold', fontSize: 16, color: G.white, letterSpacing: 0.3,
  },

  // Trust strip
  trustStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  trustItem: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: G.textGray,
  },
  trustDot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: G.border,
  },

  // OTP step
  otpHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 32 },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: G.inputBg, alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  backArrow: { fontSize: 20, color: G.textDark },
  otpHeadText: { flex: 1 },

  otpRow: {
    flexDirection: 'row', gap: 10, marginBottom: 32, justifyContent: 'center',
  },
  otpBox: {
    width: (width - 40 - 50) / OTP_LENGTH,
    height: 56, borderRadius: 14,
    backgroundColor: G.inputBg, borderWidth: 1.5, borderColor: G.border,
    fontFamily: 'Inter_600SemiBold', fontSize: 22, color: G.textDark,
  },
  otpBoxFilled: {
    borderColor: G.green, backgroundColor: G.greenLight,
  },

  resendRow: { alignItems: 'center', marginTop: 20 },
  resendGray: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: G.textGray,
  },
  resendActive: {
    fontFamily: 'Inter_600SemiBold', fontSize: 14, color: G.green,
  },

  // Terms
  terms: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: G.textGray,
    textAlign: 'center', marginVertical: 24, paddingHorizontal: 32, lineHeight: 18,
  },
  termsLink: { color: G.green, fontFamily: 'Inter_600SemiBold' },
});
