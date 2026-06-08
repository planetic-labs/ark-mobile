import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { API_URL } from '../constants/Config';
import { api } from '../services/api';
import { WebSocketEvent } from '../types/shared';

// http(s) → ws(s), убираем /api/v1
const WS_BASE_URL = API_URL
  .replace('http://', 'ws://')
  .replace('https://', 'wss://')
  .replace('/api/v1', '');

// Параметры exponential backoff согласно GEMINI.md
const BACKOFF_INITIAL_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

function nextBackoffDelay(attempt: number): number {
  const delay = BACKOFF_INITIAL_MS * 2 ** attempt;
  return Math.min(delay, BACKOFF_MAX_MS);
}

interface UseWebSocketResult {
  isConnected: boolean;
  lastEvent: WebSocketEvent | null;
}

export function useWebSocket(): UseWebSocketResult {
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef<number>(0);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    let isMounted = true;

    const connect = (): void => {
      if (!isMounted) return;

      const ws = new WebSocket(`${WS_BASE_URL}/ws?token=${accessToken}`);
      socketRef.current = ws;

      ws.onopen = (): void => {
        if (!isMounted) return;
        attemptRef.current = 0; // сброс счётчика при успешном подключении
        setIsConnected(true);
      };

      ws.onmessage = (e: MessageEvent): void => {
        if (!isMounted) return;
        try {
          const event = JSON.parse(e.data as string) as WebSocketEvent;
          setLastEvent(event);
        } catch (err) {
          console.error('[WS] Ошибка парсинга события:', err);
        }
      };

      ws.onclose = (e: CloseEvent): void => {
        if (!isMounted) return;
        setIsConnected(false);

        // Код 4003 — ошибка авторизации, пробуем обновить токен
        if (e.code === 4003) {
          api.users.me().catch(() => logout());
        }

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        const delay = nextBackoffDelay(attemptRef.current);
        attemptRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = (): void => {
        // Ошибки WebSocket всегда сопровождаются onclose — логируем здесь минимально
        console.error('[WS] Ошибка соединения');
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
    };
  }, [accessToken, logout]);

  return { isConnected, lastEvent };
}
