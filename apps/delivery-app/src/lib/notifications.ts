import * as Device from 'expo-device';
import { router } from 'expo-router';
import { api } from './api';

type NotificationsModule = typeof import('expo-notifications');

export interface NotificationSubscription {
  remove: () => void;
}

// expo-notifications (SDK 53+) throws on import inside Expo Go, and this
// module is imported by the root layout — a static import crashes the app at
// startup there. Load it lazily instead, and only outside Expo Go. Development
// / production builds keep the full push-notification implementation.
let notificationsModule: NotificationsModule | null = null;
let expoGoDetected: boolean | null = null;

function isExpoGo(): boolean {
  if (expoGoDetected === null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const constantsModule = require('expo-constants');
      const Constants = constantsModule?.default ?? constantsModule;
      expoGoDetected = Constants?.executionEnvironment === 'storeClient';
    } catch {
      expoGoDetected = false;
    }
  }
  return expoGoDetected;
}

function getNotifications(): NotificationsModule | null {
  if (isExpoGo()) {
    return null;
  }
  if (notificationsModule) {
    return notificationsModule;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    notificationsModule = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('expo-notifications unavailable, skipping push setup:', error);
    return null;
  }
  return notificationsModule;
}

export async function registerForPushNotifications() {
  const Notifications = getNotifications();
  if (!Notifications) {
    // Expo Go (no remote push support) or module unavailable — skip, never crash.
    console.log('Push notifications skipped (Expo Go or notifications unavailable).');
    return null;
  }

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

    // Register with backend
    await api.registerPushToken(token);

    return token;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

export function setupNotificationListeners(): NotificationSubscription {
  const Notifications = getNotifications();
  if (!Notifications) {
    // No notification module (Expo Go) — return a no-op subscription so the
    // root layout's cleanup still works.
    return { remove: () => {} };
  }

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

  // Handle notification tap — deep-links by the `screen` field the backend
  // stamps on every push payload (NewOrders / ActiveDelivery / History /
  // Earnings / Support). ActiveDelivery carries the OrderVendorGroup id, which
  // is the key this app's /delivery/[id] route matches against — the parent
  // orderId alone would land on the wrong record.
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as
        | { screen?: string; orderId?: string; orderVendorGroupId?: string }
        | undefined;

      switch (data?.screen) {
        case 'NewOrders':
          router.push('/(tabs)/new-orders');
          break;
        case 'ActiveDelivery':
          router.push(data?.orderVendorGroupId
            ? `/delivery/${data.orderVendorGroupId}`
            : '/');
          break;
        case 'History':
          router.push('/(tabs)/history');
          break;
        case 'Earnings':
          router.push('/(tabs)/earnings');
          break;
        case 'Support':
          router.push('/support' as any);
          break;
        default:
          router.push('/');
          break;
      }
    },
  );

  return subscription;
}

export async function unregisterPushToken() {
  try {
    await api.unregisterPushToken();
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}
