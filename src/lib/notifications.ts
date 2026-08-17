import * as Notifications from 'expo-notifications';
import { i18n } from './i18n';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

void Notifications.setAutoServerRegistrationEnabledAsync(false).catch(() => undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissionAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: i18n.t('defaultNotificationChannel'),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  return finalStatus;
}

export async function registerForPushNotificationsAsync() {
  const permission = await requestNotificationPermissionAsync();
  if (!permission) return null;

  try {
    return (await Notifications.getDevicePushTokenAsync()).data?.toString() ?? null;
  } catch {
    return null;
  }
}

export function notifyNewMovementRequest(request: { id: number; passenger_names: string; pickup: { label: string }; dropoff: { label: string } }) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notificationRideAssigned'),
      body: `${request.passenger_names} · ${request.pickup.label} → ${request.dropoff.label}`,
      data: { type: 'movement-request', requestId: request.id },
    },
    trigger: null,
  });
}

export function useNotificationObserver() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refreshRequests = () => void queryClient.invalidateQueries({ queryKey: ['movement-requests'] });
    function redirect(notification: Notifications.Notification) {
      refreshRequests();
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as Href);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
      Notifications.clearLastNotificationResponse();
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(refreshRequests);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [queryClient]);
}
