import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Colors, Typography } from '../../constants/theme';
import AuthTextField from '../../components/AuthTextField';
import BigButton from '../../components/BigButton';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Enter the email address on your account.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Could not send reset email. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.content}>
          <Text style={s.title}>Forgot Password</Text>
          <Text style={s.subtitle}>
            {sent
              ? "Check your inbox — we've sent a link to reset your password."
              : "Enter your email and we'll send you a link to reset your password."}
          </Text>

          {!sent && (
            <>
              <AuthTextField
                icon="✉️"
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {!!error && <Text style={s.error}>{error}</Text>}
              <BigButton label="Send Reset Link" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
            </>
          )}

          {sent && (
            <BigButton label="Back to Log In" onPress={() => navigation.navigate('Login')} />
          )}

          <TouchableOpacity style={s.backLink} onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 64 },

  title: { ...Typography.display, color: Colors.text, marginBottom: 8 },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: 32 },

  error: { ...Typography.caption, color: Colors.error, marginBottom: 12, marginLeft: 4 },

  backLink: { alignSelf: 'center', marginTop: 24 },
  backText: { ...Typography.body, color: Colors.textSecondary },
});
