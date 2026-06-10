import { API_URL } from '../constants/Config';
import { useAuthStore } from '../stores/useAuthStore';
import {
  CurrentUser,
  Chat,
  Message,
  IdentifyResponse,
  VerifyCodeResponse,
  TokenResponse,
  MsgResponse,
  CreateUserRequest,
  FastApiValidationErrorItem,
} from '../types/shared';

// Разбирает тело ошибки от FastAPI и возвращает читаемую строку
function parseErrorMessage(status: number, statusText: string, text: string): string {
  const fallback = statusText || `HTTP ${status}`;
  try {
    const json: unknown = JSON.parse(text);
    if (
      json !== null &&
      typeof json === 'object' &&
      'detail' in json
    ) {
      const detail = (json as Record<string, unknown>).detail;
      if (Array.isArray(detail)) {
        return (detail as FastApiValidationErrorItem[])
          .map((err) => `${err.loc.join('.')}: ${err.msg}`)
          .join('\n');
      }
      if (typeof detail === 'string') {
        return detail;
      }
    }
  } catch {
    // Не JSON — вернём текст как есть
    return text || fallback;
  }
  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  manualToken?: string
): Promise<T> {
  const { accessToken: storeToken, refreshToken, setTokens, setCurrentUser, logout } =
    useAuthStore.getState();
  const accessToken = manualToken ?? storeToken;

  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  headers.set('Content-Type', 'application/json');

  let response = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Прозрачное обновление токена при 401 (кроме auth-эндпоинтов и ручных токенов)
  const isAuthPath = path.startsWith('/auth');
  if (response.status === 401 && refreshToken && !manualToken && !isAuthPath) {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const tokens = (await refreshResponse.json()) as TokenResponse;
        const { currentUser } = useAuthStore.getState();
        setTokens(tokens.access_token, tokens.refresh_token);
        if (currentUser) {
          setCurrentUser(currentUser);
        }

        headers.set('Authorization', `Bearer ${tokens.access_token}`);
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseErrorMessage(response.status, response.statusText, text));
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    identify: (email: string): Promise<IdentifyResponse> =>
      request<IdentifyResponse>('/auth/identify', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    verifyCode: (email: string, code: string): Promise<VerifyCodeResponse> =>
      request<VerifyCodeResponse>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      }),

    setup: (
      setupToken: string,
      firstName: string,
      lastName: string,
      avatarUrl?: string
    ): Promise<TokenResponse> =>
      request<TokenResponse>('/auth/setup', {
        method: 'POST',
        body: JSON.stringify({
          setup_token: setupToken,
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
        }),
      }),

    refresh: (refreshToken: string): Promise<TokenResponse> =>
      request<TokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),

    logout: (): Promise<MsgResponse> =>
      request<MsgResponse>('/auth/logout', { method: 'POST' }),
  },

  users: {
    me: (token?: string): Promise<CurrentUser> =>
      request<CurrentUser>('/users/me', {}, token),

    listAll: (): Promise<CurrentUser[]> =>
      request<CurrentUser[]>('/users/'),

    create: (userData: CreateUserRequest): Promise<CurrentUser> =>
      request<CurrentUser>('/users/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    registerPushToken: (pushToken: string): Promise<MsgResponse> =>
      request<MsgResponse>('/users/me/push-token', {
        method: 'POST',
        body: JSON.stringify({ push_token: pushToken }),
      }),

    unregisterPushToken: (pushToken: string): Promise<MsgResponse> =>
      request<MsgResponse>(`/users/me/push-token?push_token=${encodeURIComponent(pushToken)}`, {
        method: 'DELETE',
      }),
  },

  messaging: {
    listChats: (): Promise<Chat[]> =>
      request<Chat[]>('/messaging/chats'),

    getMessages: (chatId: string): Promise<Message[]> =>
      request<Message[]>(`/messaging/chats/${chatId}/messages`),

    sendMessage: (chatId: string, content: string): Promise<Message> =>
      request<Message>('/messaging/messages', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, content }),
      }),

    createChat: (otherUserId: string, name?: string): Promise<Chat> =>
      request<Chat>('/messaging/chats', {
        method: 'POST',
        body: JSON.stringify({
          member_ids: [otherUserId],
          is_group: false,
          name: name,
        }),
      }),
  },
};
