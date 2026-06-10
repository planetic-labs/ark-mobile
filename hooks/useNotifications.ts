import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { api } from '../services/api';
import { useAuthStore } from '../stores/useAuthStore';

// Expo SDK 56: shouldShowBanner и shouldShowList обязательны в NotificationBehavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface UseNotificationsResult {
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  // useRef для Subscription требует начальное значение в React 19
  const notificationListenerRef = useRef<Notifications.Subscription | null>(null);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  const registerForPushNotifications = async (): Promise<void> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        // Объясняем пользователю зачем нужны уведомления — до запроса разрешения
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Разрешить уведомления',
            'Для мгновенного получения важных сообщений от Мастера и сигналов сирен о начале встреч, пожалуйста, разрешите отправку уведомлений.',
            [
              {
                text: 'Позже',
                style: 'cancel',
                onPress: () => resolve(),
              },
              {
                text: 'Продолжить',
                onPress: async () => {
                  const { status } = await Notifications.requestPermissionsAsync();
                  finalStatus = status;
                  resolve();
                },
              },
            ],
            { cancelable: false }
          );
        });
      }

      if (finalStatus !== 'granted') {
        console.log('[Notifications] Разрешение не получено');
        return;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        '2f1240a1-b669-41d1-98b2-647a16cf399f';
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      await api.users.registerPushToken(token);
      useAuthStore.getState().setPushToken(token);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#b78845',
        });

        await Notifications.setNotificationChannelAsync('siren_warrior', {
          name: 'Сирена Воина',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'siren_warrior.wav',
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#b78845',
        });

        await Notifications.setNotificationChannelAsync('siren_satsang', {
          name: 'Сирена Сатсанга',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'siren_satsang.wav',
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#b78845',
        });
      }
    } catch (error) {
      console.error('[Notifications] Ошибка регистрации push-токена:', error);
    }
  };

  useEffect(() => {
    notificationListenerRef.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[Notifications] Пользователь нажал на уведомление:', response.notification.request.identifier);
    });

    return () => {
      // В Expo SDK 56 подписка имеет метод .remove() вместо static removeNotificationSubscription
      notificationListenerRef.current?.remove();
      responseListenerRef.current?.remove();
    };
  }, []);

  return {
    notification,
    registerForPushNotifications,
  };
}
