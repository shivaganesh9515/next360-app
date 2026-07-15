import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { customerApi } from './api';

export async function registerForPushNotifications() {
  // This app ships to iOS/Android only (per CLAUDE.md — Expo React Native
  // mobile app); web is used here purely for quick dev-time checks in a
  // browser. getExpoPushTokenAsync() on web additionally requires a VAPID
  // key configured in app.json, which there's no reason to set up for a
  // platform this app doesn't actually target — so skip registration
  // entirely on web rather than surface a scary (harmless) error every time.
  if (Platform.OS === 'web') return null;

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo push token:', token);

    // Register with backend
    await customerApi.registerPushToken(token);

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

// Takes the global navigationRef rather than a screen-local `navigation` prop,
// since this is wired up once at the app root (App.tsx), outside any single
// screen's tree. Notification-target screens (OrderTracking, OrderDetail) live
// nested inside HomeStack — a bare top-level `navigate(screen, params)` does
// not bubble into a tab's nested stack, the same class of bug fixed earlier
// for Support/Profile navigation — so this always routes through the Home tab
// explicitly.
export function setupNotificationListeners(navigationRef: { isReady: () => boolean; navigate: (...args: any[]) => void }) {
  // Handle notification received while app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Handle notification tap
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { screen?: string; orderId?: string } | undefined;
      if (data?.screen && data?.orderId && navigationRef.isReady()) {
        navigationRef.navigate('Home', { screen: data.screen, params: { orderId: data.orderId } });
      }
    },
  );

  return subscription;
}

export async function unregisterPushToken() {
  try {
    await customerApi.unregisterPushToken();
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}
