import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, BorderRadius } from '../constants/theme';

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

  handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.navigation) {
      this.props.navigation.navigate('Main');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We're sorry, but something unexpected happened. Please try again.
          </Text>
          
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={this.handleTryAgain}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={this.handleGoHome}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: 8,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: Colors.organicLight,
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.organic,
    fontFamily: 'JetBrainsMono-Regular',
  },
  button: {
    backgroundColor: Colors.organic,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: BorderRadius.pill,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.button,
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.organic,
  },
  secondaryButtonText: {
    color: Colors.organic,
  },
});
