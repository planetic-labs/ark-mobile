import React from 'react';
import { Stack, useSegments, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { ObserveRoot, useObserve, Observe } from 'expo-observe';
import { useAuthStore } from '../stores/useAuthStore';

Observe.configure({
  integrations: { 'expo-router': true },
  dispatchInDebug: true,
});

import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { OfflineBanner } from '../components/OfflineBanner';
import {
  Spectral_400Regular,
  Spectral_500Medium,
  Spectral_600SemiBold,
  Spectral_700Bold,
} from '@expo-google-fonts/spectral';
import {
  IBMPlexSans_300Light,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются свежими 5 минут — повторных запросов нет
      staleTime: 5 * 60 * 1_000,
      // Кэш хранится 30 минут — приложение работает офлайн из кэша
      gcTime: 30 * 60 * 1_000,
      // Запросы не блокируются при отсутствии сети
      networkMode: 'offlineFirst',
      retry: 1,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

import { TimerManager } from '../components/TimerManager';

// AppContent находится внутри QueryClientProvider — имеет доступ к useQueryClient
function AppContent(): React.ReactElement {
  useOfflineQueue();

  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUser = useAuthStore((state) => state.currentUser);
  const segments = useSegments();

  React.useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!accessToken || !currentUser) {
      if (!inAuthGroup) {
        const timer = setTimeout(() => {
          router.replace('/(auth)');
        }, 1);
        return () => clearTimeout(timer);
      }
    }
  }, [accessToken, currentUser, segments]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, animation: 'fade' }}
      />
      <Stack.Screen
        name="users"
        options={{
          headerShown: true,
          title: 'Участники',
          headerStyle: { backgroundColor: '#FCFAF5' },
          headerTitleStyle: {
            fontFamily: 'Spectral_600SemiBold',
            fontSize: 18,
            color: '#221E17',
          },
          headerTintColor: '#B9770C',
        }}
      />
      </Stack>
      <TimerManager />
      <OfflineBanner />
    </View>
  );
}

function RootLayoutContent(): React.ReactElement | null {
  const { markInteractive } = useObserve();
  const [fontsLoaded] = useFonts({
    Spectral_400Regular,
    Spectral_500Medium,
    Spectral_600SemiBold,
    Spectral_700Bold,
    IBMPlexSans_300Light,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      markInteractive();
    }
  }, [fontsLoaded, markInteractive]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FCFAF5' }}>
        <ActivityIndicator size="large" color="#B9770C" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

export default ObserveRoot.wrap(RootLayoutContent);
