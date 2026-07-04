import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { customerApi } from './api';

export async function registerForPushNotifications() {
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

export function setupNotificationListeners(navigation: any) {
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
      if (data?.screen && data?.orderId) {
        navigation.navigate(data.screen, { orderId: data.orderId });
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
