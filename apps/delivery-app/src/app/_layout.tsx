import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { useDeliveryStore } from '../store/deliveryStore';
import { registerForPushNotifications, setupNotificationListeners } from '../lib/notifications';

export default function RootLayout() {
  const { loadSession, isAuthenticated } = useAuthStore();
  const { setupRealtime, cleanupRealtime } = useDeliveryStore();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setupRealtime();
      registerForPushNotifications();
    }
    return () => {
      cleanupRealtime();
    };
  }, [isAuthenticated]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="delivery/[id]"
          options={{
            title: 'Delivery Details',
            headerTintColor: '#10B981',
          }}
        />
        <Stack.Screen
          name="kyc-documents"
          options={{
            title: 'KYC Documents',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
