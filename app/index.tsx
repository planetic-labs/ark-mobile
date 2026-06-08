import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';

// Точка входа в приложение — выбирает нужный маршрут на основе состояния аутентификации.
export default function IndexRedirect(): React.ReactElement {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);

  if (!accessToken || !currentUser) {
    return <Redirect href="/(auth)" />;
  }

  // Пользователь авторизован, но ещё не одобрен администратором
  if (!currentUser.is_approved) {
    return <Redirect href="/(auth)/waiting" />;
  }

  return <Redirect href="/(tabs)" />;
}