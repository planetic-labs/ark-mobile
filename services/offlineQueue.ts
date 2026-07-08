import { createMMKV } from 'react-native-mmkv';
import type { MMKV } from 'react-native-mmkv';
import { Observe } from 'expo-observe';

// Отдельное MMKV-хранилище для офлайн-очереди сообщений
const queueStorage: MMKV = createMMKV({ id: 'offline-queue' });

const QUEUE_KEY = 'pending_messages';

export interface PendingMessage {
  // Временный локальный ID до получения реального от сервера
  localId: string;
  chatId: string;
  content: string;
  createdAt: string; // ISO Date
}

function readQueue(): PendingMessage[] {
  const raw = queueStorage.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingMessage[];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingMessage[]): void {
  try {
    queueStorage.set(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    Observe.logEvent('offline_queue.write_failed', {
      severity: 'fatal',
      attributes: {
        error: String(error),
        queueLength: queue.length,
      },
    });
    console.error('[OfflineQueue] Failed to write queue to MMKV:', error);
  }
}

/** Добавляет сообщение в конец очереди */
export function enqueueMessage(chatId: string, content: string): PendingMessage {
  const message: PendingMessage = {
    localId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    chatId,
    content,
    createdAt: new Date().toISOString(),
  };
  const queue = readQueue();
  queue.push(message);
  writeQueue(queue);
  return message;
}

/** Удаляет сообщение из очереди после успешной отправки */
export function dequeueMessage(localId: string): void {
  const queue = readQueue().filter((m) => m.localId !== localId);
  writeQueue(queue);
}

/** Возвращает текущую очередь (только для чтения) */
export function getPendingMessages(): PendingMessage[] {
  return readQueue();
}

/** Возвращает очередь для конкретного чата */
export function getPendingMessagesForChat(chatId: string): PendingMessage[] {
  return readQueue().filter((m) => m.chatId === chatId);
}

/** Очищает всю очередь (например, при логауте) */
export function clearPendingMessages(): void {
  queueStorage.remove(QUEUE_KEY);
}
