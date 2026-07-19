import React, { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import * as SplashScreenNative from 'expo-splash-screen';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import i18n, { loadSavedLanguage } from './src/i18n';
import { AuthProvider } from './src/lib/auth';
import { StoreProvider } from './src/lib/store';
import { ZoneProvider } from './src/lib/zone';
import { ProductSheetProvider } from './src/lib/productSheet';
import { CartSheetProvider } from './src/lib/cartSheet';
import { FlyToCartProvider } from './src/lib/flyToCart';
import { navigationRef } from './src/lib/navigationRef';
import { setupNotificationListeners } from './src/lib/notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/theme';

// React Navigation's DefaultTheme background is '#f6f6f6' — swap in the app's
// own white token so it never peeks through at screen edges/transitions.
const NavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.background },
};

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

  // Wired once at the root — this was previously dead code (built, never
  // called), so a tapped push notification never navigated anywhere.
  React.useEffect(() => {
    loadSavedLanguage();
    const subscription = setupNotificationListeners(navigationRef);
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <NavigationContainer ref={navigationRef} theme={NavTheme}>
            <AuthProvider>
              <ZoneProvider>
                <StoreProvider>
                  <FlyToCartProvider>
                    <ProductSheetProvider>
                      <CartSheetProvider>
                        <StatusBar style="dark" />
                        <AppNavigator />
                      </CartSheetProvider>
                    </ProductSheetProvider>
                  </FlyToCartProvider>
                </StoreProvider>
              </ZoneProvider>
            </AuthProvider>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </I18nextProvider>
  );
}
