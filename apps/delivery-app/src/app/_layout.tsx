import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '../store/authStore';
import { useDeliveryStore } from '../store/deliveryStore';
import { registerForPushNotifications, setupNotificationListeners } from '../lib/notifications';
import { IncomingAssignmentModal } from '../components/IncomingAssignmentModal';

// Initialize Sentry for crash reporting — guard empty DSN (Play/App Store builds without DSN)
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    attachStacktrace: true,
    beforeSend: (event) => {
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
      }
      return event;
    },
  });
} else if (!__DEV__) {
  console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled. Set it in eas.json production.env or EAS Secrets.');
}

function RootLayout() {
  const { loadSession, isAuthenticated, accountStatus } = useAuthStore();
  const { setupRealtime, cleanupRealtime } = useDeliveryStore();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (accountStatus === 'ACTIVE' || accountStatus === 'UNKNOWN') {
        setupRealtime();
      }
      registerForPushNotifications();
      const subscription = setupNotificationListeners();
      return () => {
        cleanupRealtime();
        subscription.remove();
      };
    }
    return () => {
      cleanupRealtime();
    };
  }, [isAuthenticated, accountStatus]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />

        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected
          guard={isAuthenticated && (accountStatus === 'ACTIVE' || accountStatus === 'UNKNOWN')}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="account-status" options={{ headerShown: false }} />
          <Stack.Screen
            name="delivery/[id]"
            options={{
              title: 'Delivery Details',
              headerTintColor: '#10B981',
            }}
          />
          <Stack.Screen name="delivery/complete" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', headerTintColor: '#10B981' }} />
          <Stack.Screen
            name="vehicle-setup"
            options={{ title: 'Vehicle & Zone', headerTintColor: '#10B981' }}
          />
          <Stack.Screen
            name="kyc-documents"
            options={{ title: 'KYC Documents', headerTintColor: '#10B981' }}
          />
        </Stack.Protected>

        {/* Legal screens stay public — they are linked from the unauthenticated
            login screen (login.tsx) and contain no protected account data. */}
        <Stack.Screen
          name="privacy-policy"
          options={{ title: 'Privacy Policy', headerTintColor: '#10B981' }}
        />
        <Stack.Screen
          name="terms-of-service"
          options={{ title: 'Terms of Service', headerTintColor: '#10B981' }}
        />
      </Stack>
      {isAuthenticated && (accountStatus === 'ACTIVE' || accountStatus === 'UNKNOWN') && <IncomingAssignmentModal />}
    </SafeAreaProvider>
  );
}

// Wrap the root layout with Sentry's error boundary for automatic crash capture
export default Sentry.wrap(RootLayout);
