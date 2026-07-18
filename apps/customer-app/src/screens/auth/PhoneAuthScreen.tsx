import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const COUNTRY_CODE = '+91'; // India-only launch per CLAUDE.md zone gating

// Zomato-style single-field entry point — no password, no separate signup
// screen. One phone number, one OTP screen (VerificationCodeScreen) decides
// login-vs-signup server-side (or in its demo fallback) based on whether the
// number already has an account.
export default function PhoneAuthScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { sendOtp, skipAuth } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = /^[6-9]\d{9}$/.test(phone);

  const handleChangePhone = (text: string) => {
    setPhone(text.replace(/\D/g, '').slice(0, 10));
    setError('');
  };

  const handleContinue = async () => {
    if (!isValid) {
      setError(t('auth.phone.invalid'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp(phone);
      navigation.navigate('VerificationCode', { phone });
    } catch (err: any) {
      Alert.alert(t('auth.otp.sendError.title'), err.message || t('common.pleaseTryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {__DEV__ && (
        <TouchableOpacity style={s.skipBtn} onPress={skipAuth} hitSlop={12}>
          <Text style={s.skipTxt}>{t('auth.devSkip')}</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.mark}>
            <Text style={s.markGlyph}>🌿</Text>
          </View>

          <Text style={s.title}>{t('auth.welcome.title')}</Text>
          <Text style={s.subtitle}>{t('auth.welcome.subtitle')}</Text>

          <View style={s.form}>
            <View style={[s.field, !!error && s.fieldError]}>
              <Text style={s.prefix}>{COUNTRY_CODE}</Text>
              <View style={s.divider} />
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={handleChangePhone}
                placeholder={t('auth.phone.placeholder')}
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
            </View>
            {!!error && <Text style={s.error}>{error}</Text>}

            <BigButton
              label={t('common.continue')}
              onPress={handleContinue}
              loading={loading}
              disabled={!isValid}
              style={{ marginTop: Spacing.lg }}
            />
          </View>

          <Text style={s.terms}>
            {t('auth.terms.prefix')}{' '}
            <Text style={s.termsLink}>{t('auth.terms.link')}</Text> and <Text style={s.termsLink}>{t('auth.terms.privacyPolicy')}</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 32 },

  skipBtn: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  skipTxt: { ...Typography.caption, color: Colors.textSecondary },

  mark: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  markGlyph: { fontSize: 28 },

  title: { ...Typography.display, color: Colors.text, marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: 32 },

  form: {},
  field: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderRadius: BorderRadius.pill,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
  },
  fieldError: { borderColor: Colors.error },
  prefix: { ...Typography.body, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  divider: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 12 },
  input: { flex: 1, ...Typography.body, color: Colors.text, padding: 0 },
  error: { ...Typography.caption, color: Colors.error, marginTop: 8, marginLeft: 4 },

  terms: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
  termsLink: { color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
});
