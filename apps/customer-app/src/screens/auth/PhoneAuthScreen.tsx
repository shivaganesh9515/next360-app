import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, ActivityIndicator, Image, Linking as RNLinking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { useAuth } from '../../lib/auth';
import { isSupabaseConfigured, getSupabase } from '../../lib/supabase';
import { handleSupabaseCallback } from '../../lib/supabaseAuthCallback';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import BigButton from '../../components/BigButton';

const GOOGLE_LOGO = require('../../../assets/images/google-logo.png');

// Cost-saving auth: phone OTP (DLT) removed for Customer App to save SMS spend.
// Only Google remains as primary login (Apple removed for now). Phone flow hidden behind
// ENABLE_PHONE_AUTH flag — Delivery App still uses phone OTP.
const ENABLE_PHONE_AUTH = false;
const COUNTRY_CODE = '+91';

// Must match app.json scheme + intentFilter + Supabase redirect whitelist
const OAUTH_REDIRECT = ExpoLinking.createURL('auth/callback', { scheme: 'next360' });

export default function PhoneAuthScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { sendOtp, googleSignIn, skipAuth } = useAuth() as any;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Google Sign-In — Supabase OAuth via system browser (expo-web-browser)
  // isSupabaseConfigured() gate keeps dev/demo (placeholder creds) from opening a broken browser.
  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: OAUTH_REDIRECT,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error('No OAuth URL returned');
        const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);
        if (result.type === 'cancel' || result.type === 'dismiss') {
          return;
        }
        if (result.type === 'success' && result.url) {
          const cb = await handleSupabaseCallback(result.url);
          if (cb?.email) {
            await googleSignIn({
              email: cb.email,
              googleId: cb.email,
              name: cb.name,
              avatarUrl: cb.avatarUrl,
            });
          }
          return;
        }
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

  // Apple login removed for now — keep handler stub for future re-enable
  // const handleAppleSignIn = async () => { ... };

  const openTerms = () => {
    // In Auth stack there's no legal screen; open marketing site or show info
    const url = 'https://next360.com/privacy';
    RNLinking.canOpenURL(url).then((ok) => {
      if (ok) RNLinking.openURL(url);
      else Alert.alert('Terms & Privacy', 'By continuing you agree to our Terms and Privacy Policy.');
    });
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {/* Background Graphic Blobs */}
      <View style={s.bgBlob1} />
      <View style={s.bgBlob2} />

      {__DEV__ && (
        <TouchableOpacity
          style={s.skipBtn}
          onPress={skipAuth}
          hitSlop={12}
          accessibilityLabel="Skip authentication (development only)"
          accessibilityRole="button"
        >
          <Text style={s.skipTxt}>{t('auth.devSkip')}</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.brandSection}>
            <View style={s.mark}>
              <Text style={s.markGlyph}>🌿</Text>
            </View>
            <Text style={s.brandLabel}>NEXT360</Text>
          </View>

          <Text style={s.title} accessibilityRole="header">{ENABLE_PHONE_AUTH ? t('auth.welcome.title') : 'Welcome to Next360'}</Text>
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
                    accessibilityLabel="Phone number input"
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                  />
                </View>
                {!!error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}

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
                  <TouchableOpacity
                    style={[s.socialBtn, googleLoading && s.socialBtnDisabled]}
                    onPress={handleGoogleSignIn}
                    disabled={googleLoading}
                    activeOpacity={0.85}
                    accessibilityLabel="Continue with Google"
                    accessibilityRole="button"
                  >
                    {googleLoading ? <ActivityIndicator size="small" color={Colors.text} /> : <Image source={GOOGLE_LOGO} style={s.socialIcon} />}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!ENABLE_PHONE_AUTH && (
              <>
                <TouchableOpacity
                  style={[s.socialBtnPrimary, googleLoading && s.socialBtnDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading}
                  activeOpacity={0.85}
                  accessibilityLabel="Continue with Google"
                  accessibilityRole="button"
                >
                  {googleLoading ? <ActivityIndicator size="small" color={Colors.text} /> : <Image source={GOOGLE_LOGO} style={s.socialIcon} />}
                  <Text style={s.socialBtnPrimaryText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Helpful hint when Supabase not configured (dev placeholder) */}
                {!isSupabaseConfigured() && __DEV__ && (
                  <Text style={s.hint}>Demo mode — Google will sign in with a test account. Configure Supabase for real OAuth.</Text>
                )}
              </>
            )}
          </View>

          <Text style={s.terms}>
            {t('auth.terms.prefix')}{' '}
            <Text style={s.termsLink} onPress={openTerms}>{t('auth.terms.link')}</Text> and <Text style={s.termsLink} onPress={openTerms}>{t('auth.terms.privacyPolicy')}</Text>
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
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 14,
  },

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
  socialBtnDisabled: {
    opacity: 0.6,
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
