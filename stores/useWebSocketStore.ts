import { create } from 'zustand';
import { api } from '../services/api';
import { useAuthStore } from './useAuthStore';
import type { WebSocketEvent } from '../types/shared';
import { Observe } from 'expo-observe';

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

      const attempt = get()._attempt;
      const delay = nextBackoffDelay(attempt);

      // Логируем ненормальное закрытие (код 1000 — нормальное закрытие)
      if (e.code !== 1000) {
        Observe.logEvent('websocket.closed_abnormally', {
          severity: 'warn',
          attributes: {
            code: e.code,
            reason: e.reason || 'No reason provided',
            attempt,
            nextDelayMs: delay,
          },
        });
      }

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
      const timeout = setTimeout(() => {
        const currentToken = useAuthStore.getState().accessToken;
        if (currentToken) get().connect(currentToken);
      }, delay);

      set({ _reconnectTimeout: timeout, _attempt: attempt + 1 });
    };

    ws.onerror = (): void => {
      console.error('[WS] Ошибка соединения');
      const attempt = get()._attempt;
      Observe.logEvent('websocket.connection_failed', {
        severity: 'error',
        attributes: {
          attempt,
        },
      });
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
