import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './useAuthStore';
import type { WebSocketEvent } from '../types/shared';

// Параметры exponential backoff (1с → 2с → 4с → … → 30с)
const BACKOFF_INITIAL_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

function nextBackoffDelay(attempt: number): number {
  return Math.min(BACKOFF_INITIAL_MS * 2 ** attempt, BACKOFF_MAX_MS);
}

interface WebSocketState {
  isConnected: boolean;
  lastEvent: WebSocketEvent | null;

  // Внутренние, не экспонируются в UI
  _socket: WebSocket | null;
  _reconnectTimeout: ReturnType<typeof setTimeout> | null;
  _attempt: number;

  // Публичные методы
  connect: (token: string) => void;
  disconnect: () => void;
}

// WS_BASE_URL вычисляется один раз при инициализации модуля
function buildWsUrl(accessToken: string): string {
  const { API_URL } = require('../constants/Config') as { API_URL: string };
  const base = API_URL
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace('/api/v1', '');
  return `${base}/ws?token=${accessToken}`;
}

export const useWebSocketStore = create<WebSocketState>()((set, get) => ({
  isConnected: false,
  lastEvent: null,
  _socket: null,
  _reconnectTimeout: null,
  _attempt: 0,

  connect: (token: string): void => {
    // Закрываем предыдущее соединение если есть
    const { _socket, _reconnectTimeout } = get();
    if (_reconnectTimeout) clearTimeout(_reconnectTimeout);
    if (_socket) _socket.close();

    const ws = new WebSocket(buildWsUrl(token));

    ws.onopen = (): void => {
      set({ isConnected: true, _attempt: 0 });
    };

    ws.onmessage = (e: MessageEvent): void => {
      try {
        const event = JSON.parse(e.data as string) as WebSocketEvent;
        set({ lastEvent: event });
      } catch (err) {
        console.error('[WS] Ошибка парсинга события:', err);
      }
    };

    ws.onclose = (e: CloseEvent): void => {
      set({ isConnected: false, _socket: null });

      // Код 4003 — проблема с токеном, пробуем обновить через HTTP
      if (e.code === 4003) {
        api.users.me()
          .then(() => {
            const currentToken = useAuthStore.getState().accessToken;
            if (currentToken) {
              get().connect(currentToken);
            }
          })
          .catch(() => useAuthStore.getState().logout());
        return;
      }

      // Exponential backoff реконнект
      const attempt = get()._attempt;
      const delay = nextBackoffDelay(attempt);
      const timeout = setTimeout(() => {
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken) get().connect(currentToken);
      }, delay);

      set({ _reconnectTimeout: timeout, _attempt: attempt + 1 });
    };

    ws.onerror = (): void => {
      // Ошибки WebSocket всегда сопровождаются onclose — логируем минимально
      console.error('[WS] Ошибка соединения');
    };

    set({ _socket: ws });
  },

  disconnect: (): void => {
    const { _socket, _reconnectTimeout } = get();
    if (_reconnectTimeout) clearTimeout(_reconnectTimeout);
    if (_socket) _socket.close();
    set({ _socket: null, isConnected: false, _attempt: 0, _reconnectTimeout: null });
  },
}));
