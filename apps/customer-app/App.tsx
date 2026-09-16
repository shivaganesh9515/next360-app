import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useRef } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Required for Supabase OAuth: completes the auth session when the browser redirects back
WebBrowser.maybeCompleteAuthSession();
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import * as SplashScreenNative from 'expo-splash-screen';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as Sentry from '@sentry/react-native';
import i18n, { loadSavedLanguage } from './src/i18n';
import { AuthProvider } from './src/lib/auth';
import { StoreProvider } from './src/lib/store';
import { ZoneProvider } from './src/lib/zone';
import { ProductSheetProvider } from './src/lib/productSheet';
import { CartSheetProvider } from './src/lib/cartSheet';
import { FlyToCartProvider } from './src/lib/flyToCart';
import { navigationRef } from './src/lib/navigationRef';
import { setupNotificationListeners } from './src/lib/notifications';
import { handleSupabaseCallback, getInitialOAuthUrl } from './src/lib/supabaseAuthCallback';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/constants/theme';

// Initialize Sentry for crash reporting — guard empty DSN (Play builds without DSN)
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

// React Navigation's DefaultTheme background is '#f6f6f6' — swap in the app's
// own white token so it never peeks through at screen edges/transitions.
const NavTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Colors.background },
};

SplashScreenNative.preventAutoHideAsync().catch(() => {});

// Wrap the entire app with Sentry's error boundary
function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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

  // ── Supabase OAuth deep-link handler ─────────────────────────────────────
  // Handles Google/Apple sign-in callbacks that arrive via next360://auth/callback.
  // Two cases:
  //   1. App was CLOSED when the callback arrived → getInitialOAuthUrl() catches it.
  //   2. App was OPEN (backgrounded) → the Linking event listener catches it.
  // In both cases we forward the user data to the backend via googleSignIn().
  // We use a ref for googleSignIn so the listener closure is always fresh.
  const googleSignInRef = useRef<((data: any) => Promise<any>) | null>(null);

  React.useEffect(() => {
    // Process a single OAuth callback URL (covers both next360:// and exp:// schemes)
    async function processOAuthUrl(url: string | null) {
      if (!url) return;
      if (!url.includes('auth/callback') && !url.includes('auth/')) return;
      const result = await handleSupabaseCallback(url);
      if (!result || !result.email) return;
      // Sync the Supabase-authenticated user into the backend's JWT + Prisma table
      if (googleSignInRef.current) {
        googleSignInRef.current({
          email: result.email,
          googleId: result.email, // Used as a stable identifier for social login
          name: result.name,
          avatarUrl: result.avatarUrl,
        }).catch(() => {});
      }
    }

    // Case 1: cold-start OAuth callback
    getInitialOAuthUrl().then(processOAuthUrl);

    // Case 2: warm-start (app was backgrounded)
    const sub = Linking.addEventListener('url', ({ url }) => processOAuthUrl(url));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider onLayout={onLayoutRootView}>
          <NavigationContainer ref={navigationRef} theme={NavTheme}>
            <AuthProvider googleSignInRef={googleSignInRef}>
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

// Wrap the app with Sentry's error boundary for automatic error catching
export default Sentry.wrap(App);
