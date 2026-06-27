import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  getPendingMessages,
  dequeueMessage,
  clearPendingMessages,
  type PendingMessage,
} from '../services/offlineQueue';
import { useAuthStore } from '../stores/useAuthStore';

// Хук запускает фоновую отправку накопленных офлайн-сообщений при восстановлении сети.
// Вызывается один раз на уровне layout (не в каждом экране).
export function useOfflineQueue(): void {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isFlushing = useRef(false);

  const flush = async (): Promise<void> => {
    // Защита от параллельного запуска
    if (isFlushing.current) return;

    const pending = getPendingMessages();
    if (pending.length === 0) return;

    isFlushing.current = true;
    try {
      for (const msg of pending) {
        const success = await sendPendingMessage(msg, queryClient);
        if (!success) {
          break; // Прерываем отправку при первой же ошибке (сеть пропала)
        }
      }
    } finally {
      isFlushing.current = false;
    }
  };

  // Сброс очереди при восстановлении сети
  useEffect(() => {
    if (!accessToken) return;

    // Пробуем сразу при монтировании — вдруг сеть есть
    void flush();

    let previousIsConnected: boolean | null = null;
    const unsubscribe = NetInfo.addEventListener((state) => {
      const nowConnected = state.isConnected ?? false;
      if (nowConnected && previousIsConnected === false) {
        void flush();
      }
      previousIsConnected = nowConnected;
    });

    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // При логауте — очищаем очередь
  useEffect(() => {
    if (!accessToken) {
      clearPendingMessages();
    }
  }, [accessToken]);
}

async function sendPendingMessage(
  msg: PendingMessage,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<boolean> {
  try {
    const sent = await api.messaging.sendMessage(msg.chatId, msg.content);
    dequeueMessage(msg.localId);
    // Инвалидируем кэш чата после успешной отправки
    queryClient.invalidateQueries({ queryKey: ['messages', msg.chatId] });
    queryClient.invalidateQueries({ queryKey: ['pendingMessages', msg.chatId] });
    queryClient.invalidateQueries({ queryKey: ['chats'] });
    console.log(`[OfflineQueue] Отправлено сообщение ${sent.id} из чата ${msg.chatId}`);
    return true;
  } catch (error) {
    // Не удалось отправить — оставляем в очереди, попробуем позже
    console.warn(`[OfflineQueue] Не удалось отправить ${msg.localId}:`, error);
    return false;
  }
}
