import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../lib/auth';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.footer}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 80,
  },
  title: {
    ...Typography.display,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  form: {
    gap: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Typography.body,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.brass,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.white,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxxl,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  footerLink: {
    color: Colors.brass,
    fontWeight: '600',
  },
});
