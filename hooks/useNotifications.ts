import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Alert, Platform } from 'react-native';
import { api } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        await new Promise<void>((resolve) => {
          Alert.alert(
            "Разрешить уведомления",
            "Для мгновенного получения важных сообщений от Мастера и сигналов сирен о начале встреч, пожалуйста, разрешите отправку уведомлений.",
            [
              {
                text: "Позже",
                style: "cancel",
                onPress: () => resolve(),
              },
              {
                text: "Продолжить",
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
        console.log('Permission not granted for push notifications');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? '2f1240a1-b669-41d1-98b2-647a16cf399f';
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);

      await api.users.registerPushToken(token);

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
      console.error('Error during push notification registration:', error);
    }
  };

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    notification,
    registerForPushNotifications,
  };
}
