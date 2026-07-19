import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!isAuthenticated) {
    // Cast: new file, stale Expo Router typed-routes cache (see phone-login.tsx).
    return <Redirect href={'/(auth)/phone-login' as any} />;
  }

  return <Redirect href="/(tabs)" />;
}
