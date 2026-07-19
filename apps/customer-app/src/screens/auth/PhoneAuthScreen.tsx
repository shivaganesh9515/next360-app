import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { isSupabaseConfigured, getSupabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const COUNTRY_CODE = '+91'; // India-only launch per CLAUDE.md zone gating

// Zomato-style single-field entry point — no password, no separate signup
// screen. One phone number, one OTP screen (VerificationCodeScreen) decides
// login-vs-signup server-side (or in its demo fallback) based on whether the
// number already has an account.
export default function PhoneAuthScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { sendOtp, googleSignIn, skipAuth } = useAuth();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Google Sign-In — checks Supabase configuration first. If a Supabase
  // project is wired up (real credentials in .env), it uses Supabase's own
  // OAuth flow (signInWithOAuth), which opens the system browser and
  // redirects back via deep link — no inline return, so we return early and
  // let the deep-link callback handle the auth flow. In dev/demo mode
  // (Supabase not configured or placeholder credentials), it falls back to a
  // simulated Google login with a demo profile, same pattern as the OTP flow.
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Real OAuth flow — Supabase opens the browser, no inline return
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: 'next360://auth/callback' },
        });
        if (error) throw error;
        // OAuth handles the redirect — user returns via deep link;
        // no demo fallback after this point.
        return;
      }

      // Dev/demo: simulate Google login with a consistent demo profile
      // Using a stable googleId per email so the same demo user is reused
      // within a session, matching the phone OTP demo pattern.
      await googleSignIn({
        email: 'demo@googleuser.com',
        googleId: 'demo-google-user',
        name: 'Demo User',
        avatarUrl: undefined,
      });
    } catch (err: any) {
      Alert.alert('Google Sign-In Failed', err.message || 'Could not sign in with Google');
    } finally {
      setGoogleLoading(false);
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
              <View style={s.prefixDivider} />
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

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              style={s.googleBtn}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Ionicons name="logo-google" size={20} color={Colors.text} />
              )}
              <Text style={s.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
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
  prefixDivider: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 12 },
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

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.pill,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: 10,
  },
  googleBtnText: {
    ...Typography.body,
    color: Colors.text,
    fontFamily: 'Inter_600SemiBold',
  },
});
