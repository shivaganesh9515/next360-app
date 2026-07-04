import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Colors, Typography, Spacing } from '../../constants/theme';
import AuthTextField from '../../components/AuthTextField';
import BigButton from '../../components/BigButton';

export default function LoginScreen({ navigation }: any) {
  const { signIn, skipAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Could not sign in', err.message || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      {__DEV__ && (
        <TouchableOpacity style={s.skipBtn} onPress={skipAuth} hitSlop={12}>
          <Text style={s.skipTxt}>Dev Skip</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.mark}>
            <Text style={s.markGlyph}>🌿</Text>
          </View>

          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to keep shopping organic, natural, and eco-friendly.</Text>

          <View style={s.form}>
            <AuthTextField
              icon="✉️"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <AuthTextField
              icon="🔒"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
            />
            {!!error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={s.forgotLink}
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={8}
            >
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <BigButton label="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: Spacing.lg }} />
          </View>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} hitSlop={8}>
              <Text style={s.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
  error: { ...Typography.caption, color: Colors.error, marginBottom: 12, marginLeft: 4 },

  forgotLink: { alignSelf: 'flex-end', marginBottom: 4 },
  forgotText: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  footerRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 32,
  },
  footerText: { ...Typography.body, color: Colors.textSecondary },
  footerLink: { ...Typography.body, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
});
