import { useEffect } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useAuthStore } from '../stores/useAuthStore';
import { useWebSocketStore } from '../stores/useWebSocketStore';
import type { WebSocketEvent } from '../types/shared';

interface UseWebSocketResult {
  isConnected: boolean;
  lastEvent: WebSocketEvent | null;
}

// Хук управляет жизненным циклом WebSocket-соединения.
// Соединение — синглтон в useWebSocketStore: одно на всю сессию.
// Подключается при наличии accessToken, отключается при его отсутствии.
// При смене сети (Wi-Fi → 4G и обратно) выполняется немедленный реконнект.
export function useWebSocket(): UseWebSocketResult {
  const accessToken = useAuthStore((state) => state.accessToken);
  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const lastEvent = useWebSocketStore((state) => state.lastEvent);

  // Подключение / отключение при смене токена
  useEffect(() => {
    if (!accessToken) {
      disconnect();
      return;
    }
    connect(accessToken);
    // Соединение живёт в сторе — не закрываем при размонтировании компонента
  }, [accessToken, connect, disconnect]);

  // Немедленный реконнект при смене типа сети (Wi-Fi ↔ 4G, появление сети)
  useEffect(() => {
    if (!accessToken) return;

    let previousIsConnected: boolean | null = null;

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const nowConnected = state.isConnected ?? false;

      // Реконнект только при восстановлении соединения (false → true)
      if (nowConnected && previousIsConnected === false) {
        connect(accessToken);
      }

      previousIsConnected = nowConnected;
    });

    return unsubscribe;
  }, [accessToken, connect]);

  return { isConnected, lastEvent };
}
