import React, { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreenNative from 'expo-splash-screen';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { AuthProvider } from './src/lib/auth';
import { StoreProvider } from './src/lib/store';
import { ZoneProvider } from './src/lib/zone';
import { ProductSheetProvider } from './src/lib/productSheet';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreenNative.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded) {
      SplashScreenNative.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <NavigationContainer>
          <AuthProvider>
            <ZoneProvider>
              <StoreProvider>
                <ProductSheetProvider>
                  <StatusBar style="dark" />
                  <AppNavigator />
                </ProductSheetProvider>
              </StoreProvider>
            </ZoneProvider>
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
