import React from 'react';
import { Redirect, type Href } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  const { isLoading, getEntryRoute } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return <Redirect href={getEntryRoute() as Href} />;
}
