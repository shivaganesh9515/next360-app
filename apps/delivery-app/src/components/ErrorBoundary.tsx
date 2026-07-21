import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  navigation?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.navigation) {
      this.props.navigation.navigate('(tabs)');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          {/* Branded error illustration */}
          <View style={styles.iconRing}>
            <View style={styles.iconBg}>
              <Ionicons name="alert-circle" size={48} color={Colors.white} />
            </View>
          </View>

          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry, but something unexpected happened. Please try again.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorLabel}>Error Details</Text>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryBtn} onPress={this.handleRetry} activeOpacity={0.85}>
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={this.handleGoHome} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: Spacing.xxl, backgroundColor: Colors.background,
  },
  iconRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.dangerLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl, ...Shadow.md,
  },
  iconBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  message: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginBottom: Spacing.xxl, lineHeight: 22, paddingHorizontal: Spacing.lg,
  },
  errorBox: {
    width: '100%', backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md,
    padding: Spacing.lg, marginBottom: Spacing.xxl,
  },
  errorLabel: { fontSize: 11, fontWeight: '700', color: Colors.danger, letterSpacing: 0.5, marginBottom: 4 },
  errorText: { fontSize: 12, color: Colors.danger, fontFamily: 'monospace' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    paddingVertical: 15, paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.md, width: '100%', gap: 8,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.primary,
    paddingVertical: 15, paddingHorizontal: Spacing.xxxl,
    width: '100%',
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
});
