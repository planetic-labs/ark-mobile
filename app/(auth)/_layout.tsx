import React from 'react';
import { Stack } from 'expo-router';

// Layout для группы (auth). Управляет Stack-навигацией между экранами авторизации.
// Жест «назад» отключён на экранах setup и waiting — возврат туда нелогичен.
export default function AuthLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="code" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="setup"
        options={{ animation: 'slide_from_right', gestureEnabled: false }}
      />
      <Stack.Screen
        name="waiting"
        options={{ animation: 'fade', gestureEnabled: false }}
      />
    </Stack>
  );
}
