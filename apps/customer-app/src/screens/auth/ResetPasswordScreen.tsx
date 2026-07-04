import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { Colors, Typography } from '../../constants/theme';
import AuthTextField from '../../components/AuthTextField';
import BigButton from '../../components/BigButton';

// Reached via the deep link in the "reset password" email (next360://reset-password?token=...).
// NOTE: the API's POST /auth/reset-password currently expects the Supabase user id as `token`,
// not a real single-use reset token — this only works end-to-end once that's fixed server-side.
export default function ResetPasswordScreen({ navigation, route }: any) {
  const { resetPassword } = useAuth();
  const token: string = route.params?.token || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('This reset link is invalid or has expired.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      Alert.alert('Could not reset password', err.message || 'Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.content}>
          {done ? (
            <>
              <Text style={s.title}>Password Reset</Text>
              <Text style={s.subtitle}>Your password has been updated. You can now log in.</Text>
              <BigButton label="Back to Log In" onPress={() => navigation.navigate('Login')} />
            </>
          ) : (
            <>
              <Text style={s.title}>New Password</Text>
              <Text style={s.subtitle}>Choose a new password for your account.</Text>

              <AuthTextField
                icon="🔒"
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoCapitalize="none"
              />
              <AuthTextField
                icon="🔒"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                autoCapitalize="none"
              />
              {!!error && <Text style={s.error}>{error}</Text>}

              <BigButton label="Reset Password" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
            </>
          )}
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
});
