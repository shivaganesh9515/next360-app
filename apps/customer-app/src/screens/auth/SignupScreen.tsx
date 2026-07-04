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

export default function SignupScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Fill in your name, email, and password to continue.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp({ email: email.trim(), password, name: name.trim() });
    } catch (err: any) {
      Alert.alert('Could not create account', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.title}>Sign Up</Text>
          <Text style={s.subtitle}>Please fill out the form below.</Text>

          <View style={s.form}>
            <AuthTextField
              icon="👤"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
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
              placeholder="Password (min. 8 characters)"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
            />
            <AuthTextField
              icon="🔒"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
            />
            {!!error && <Text style={s.error}>{error}</Text>}

            <BigButton label="Sign Up" onPress={handleSignup} loading={loading} style={{ marginTop: Spacing.sm }} />
          </View>

          <Text style={s.terms}>
            By using our services you are agreeing to our{' '}
            <Text style={s.termsLink}>Terms</Text> and <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
              <Text style={s.footerLink}>Sign In</Text>
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
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 },

  title: { ...Typography.display, color: Colors.text, marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: 32 },

  form: {},
  error: { ...Typography.caption, color: Colors.error, marginBottom: 12, marginLeft: 4 },

  terms: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
  termsLink: { color: Colors.organic, fontFamily: 'Inter_600SemiBold' },

  footerRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 24,
  },
  footerText: { ...Typography.body, color: Colors.textSecondary },
  footerLink: { ...Typography.body, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
});
