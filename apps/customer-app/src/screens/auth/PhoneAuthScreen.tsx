import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { isSupabaseConfigured, getSupabase } from '../../lib/supabase';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const GOOGLE_LOGO = require('../../../assets/images/google-logo.png');

// Cost-saving auth: phone OTP (DLT) removed for Customer App to save SMS spend.
// Only Google + Apple remain as primary login. Phone flow code is hidden behind
// ENABLE_PHONE_AUTH flag — Delivery App still uses phone OTP (its own screen).
// To re-enable phone for customers later, set ENABLE_PHONE_AUTH=true and DLT envs.
const ENABLE_PHONE_AUTH = false;
const COUNTRY_CODE = '+91';

export default function PhoneAuthScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { sendOtp, googleSignIn, appleSignIn, skipAuth } = useAuth() as any;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

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
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: 'next360://auth/callback' },
        });
        if (error) throw error;
        return;
      }

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

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      // 1) Try native Apple Sign In on iOS device
      try {
        const AppleAuth: any = require('expo-apple-authentication');
        if (AppleAuth?.isAvailableAsync) {
          const avail = await AppleAuth.isAvailableAsync();
          if (avail) {
            const cred = await AppleAuth.signInAsync({
              requestedScopes: [AppleAuth.AppleAuthenticationScope.FULL_NAME, AppleAuth.AppleAuthenticationScope.EMAIL],
            });
            const email = cred.email || `${cred.user}@privaterelay.appleid.com`;
            const fullName = cred.fullName ? `${cred.fullName.givenName || ''} ${cred.fullName.familyName || ''}`.trim() : undefined;
            await appleSignIn({ email, appleId: cred.user, identityToken: cred.identityToken || undefined, name: fullName || undefined });
            return;
          }
        }
      } catch (_) { /* fall through */ }

      // 2) Supabase OAuth (web / Android)
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: 'next360://auth/callback' } });
        if (error) throw error;
        return;
      }

      // 3) Demo fallback (no backend)
      await appleSignIn({ email: 'demo@appleuser.com', appleId: 'demo-apple-user', name: 'Apple Demo User' });
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple Sign-In Failed', err.message || 'Could not sign in with Apple');
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* Background Graphic Blobs */}
      <View style={s.bgBlob1} />
      <View style={s.bgBlob2} />

      {__DEV__ && (
        <TouchableOpacity style={s.skipBtn} onPress={skipAuth} hitSlop={12}>
          <Text style={s.skipTxt}>{t('auth.devSkip')}</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.brandSection}>
            <View style={s.mark}>
              <Text style={s.markGlyph}>🌿</Text>
            </View>
            <Text style={s.brandLabel}>NEXT360</Text>
          </View>

          <Text style={s.title}>{ENABLE_PHONE_AUTH ? t('auth.welcome.title') : 'Welcome to Next360'}</Text>
          <Text style={s.subtitle}>{ENABLE_PHONE_AUTH ? t('auth.welcome.subtitle') : 'Sign in to shop organic, natural & eco-friendly products'}</Text>

          <View style={s.form}>
            {ENABLE_PHONE_AUTH && (
              <>
                <View style={[
                  s.field, 
                  focused && [s.fieldFocused, { borderColor: Colors.organic }],
                  !!error && s.fieldError
                ]}>
                  <Text style={s.prefix}>{COUNTRY_CODE}</Text>
                  <View style={s.prefixDivider} />
                  <TextInput
                    style={s.input}
                    value={phone}
                    onChangeText={handleChangePhone}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
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
                  style={{ marginTop: Spacing.md, height: 52 }}
                />

                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>or continue with</Text>
                  <View style={s.dividerLine} />
                </View>

                <View style={s.socialRow}>
                  <TouchableOpacity style={s.socialBtn} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.85}>
                    {googleLoading ? <ActivityIndicator size="small" color={Colors.text} /> : <Image source={GOOGLE_LOGO} style={s.socialIcon} />}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.socialBtn} onPress={handleAppleSignIn} disabled={appleLoading} activeOpacity={0.85}>
                    {appleLoading ? <ActivityIndicator size="small" color={Colors.text} /> : <Ionicons name="logo-apple" size={26} color="#000000" />}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!ENABLE_PHONE_AUTH && (
              <>
                <TouchableOpacity style={s.socialBtnPrimary} onPress={handleGoogleSignIn} disabled={googleLoading} activeOpacity={0.85}>
                  {googleLoading ? <ActivityIndicator size="small" color={Colors.text} /> : <Image source={GOOGLE_LOGO} style={s.socialIcon} />}
                  <Text style={s.socialBtnPrimaryText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.socialBtnPrimary, s.socialBtnPrimaryApple]} onPress={handleAppleSignIn} disabled={appleLoading} activeOpacity={0.85}>
                  {appleLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="logo-apple" size={22} color="#FFFFFF" />}
                  <Text style={s.socialBtnPrimaryTextApple}>Continue with Apple</Text>
                </TouchableOpacity>
              </>
            )}
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
  root: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative', overflow: 'hidden' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },

  // Background blobs for premium depth
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

  skipBtn: {
    position: 'absolute', top: 56, right: 20, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  skipTxt: {
    fontFamily: 'Inter_600SemiBold', fontSize: 11, color: Colors.textSecondary,
  },

  brandSection: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32,
  },
  mark: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(46, 125, 50, 0.1)',
  },
  markGlyph: { fontSize: 22 },
  brandLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.organic, letterSpacing: 1.5,
  },

  title: {
    fontFamily: 'Inter_700Bold', fontSize: 26, color: Colors.text,
    lineHeight: 32, letterSpacing: -0.5, marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary,
    lineHeight: 20, marginBottom: 32,
  },

  form: {},
  field: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
  },
  fieldFocused: {
    shadowColor: Colors.organic,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8,
    elevation: 2,
  },
  fieldError: { borderColor: Colors.error },
  prefix: { ...Typography.body, color: Colors.text, fontFamily: 'Inter_600SemiBold' },
  prefixDivider: { width: 1, height: 20, backgroundColor: '#E2E8F0', marginHorizontal: 12 },
  input: { flex: 1, ...Typography.body, color: Colors.text, padding: 0 },
  error: { ...Typography.caption, color: Colors.error, marginTop: 8, marginLeft: 4 },

  terms: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 18,
  },
  termsLink: { color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
  },
  socialBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4,
    elevation: 2,
  },
  socialIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  socialBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  socialBtnPrimaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  socialBtnPrimaryApple: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  socialBtnPrimaryTextApple: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  saveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F8E9',
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  saveBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
