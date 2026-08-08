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
    // Set iOS badge to 0 at registration so the badge never shows a stale
    // unread count from a previous session. The backend sends a badge count
    // with each push (see NotificationsService) that updates it live.
    Notifications.setBadgeCountAsync(0).catch(() => {});

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Register with backend
    await customerApi.registerPushToken(token);

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

// Notification data payload shape — mirrors the backend's Notification model
// `data` field so type-safe access works in the tap handler below.
// Backend sends: { screen?: string; orderId?: string; status?: string }
interface NotificationData {
  screen?: string;
  orderId?: string;
  status?: string;
  tab?: string;
}

/**
 * Map a notification's screen hint to a route that works from the root navigator.
 * Notification-target screens live nested inside HomeStack (OrderTracking,
 * OrderDetail, Chat, etc.) — a bare top-level `navigate(screen, params)` 
 * doesn't bubble into a tab's nested stack, so this always routes through 
 * the Home tab explicitly.
 */
function resolveNotificationDestination(data: NotificationData):
  { screenName: string; params?: Record<string, any> } | null {
  if (!data?.screen) return null;

  // Screens that live inside HomeStack
  const homeStackScreens = ['OrderDetail', 'OrderTracking', 'AiAssistant', 'Cart', 'Notifications', 'Search'];
  if (homeStackScreens.includes(data.screen)) {
    return {
      screenName: 'Home',
      params: {
        screen: data.screen,
        params: data.orderId ? { orderId: data.orderId } : undefined,
      },
    };
  }

  // Screens that live inside ProfileStack
  if (data.screen === 'Support') {
    return {
      screenName: 'Profile',
      params: { screen: 'Support' },
    };
  }

  // For tab-level screens (Home, AllProducts, Favorites)
  if (['Home', 'AllProducts', 'Favorites'].includes(data.screen)) {
    return { screenName: data.screen };
  }

  // Fallback: just navigate to the screen name at root level
  return { screenName: data.screen };
}

// Takes the global navigationRef rather than a screen-local `navigation` prop,
// since this is wired up once at the app root (App.tsx), outside any single
// screen's tree. Works across all nested stacks.
export function setupNotificationListeners(navigationRef: { isReady: () => boolean; navigate: (...args: any[]) => void }) {
  // Handle notification received while app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async (notification: Notifications.Notification) => {
      const data = notification.request.content.data as NotificationData | undefined;
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: data?.status !== 'DELIVERED', // No sound for delivery confirmations
      };
    },
  });

  // Handle notification tap — deep-link into the correct screen
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData | undefined;
      if (!data || !navigationRef.isReady()) return;

      const dest = resolveNotificationDestination(data);
      if (dest) {
        navigationRef.navigate(dest.screenName, dest.params);
      }
    },
  );

  return subscription;
}

export async function unregisterPushToken() {
  try {
    Notifications.setBadgeCountAsync(0).catch(() => {});
    await customerApi.unregisterPushToken();
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}
