import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/lib/auth';
import { StoreProvider } from './src/lib/store';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <StoreProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </StoreProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
