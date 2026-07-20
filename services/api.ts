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
  AppRole,
  AppPermission,
} from '../types/shared';
import { Observe } from 'expo-observe';
import * as FileSystem from 'expo-file-system/legacy';

function safeLogEvent(name: string, options?: { severity?: 'info' | 'warn' | 'error'; attributes?: Record<string, string | number | boolean | null> }): void {
  try {
    if (typeof Observe !== 'undefined' && Observe && typeof Observe.logEvent === 'function') {
      Observe.logEvent(name, options as any);
    } else {
      console.warn(`[Observe stub] Event: ${name}`, options);
    }
  } catch (e) {
    console.warn('Failed to log event via Observe:', e);
  }
}

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

let refreshPromise: Promise<string> | null = null;

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

  const startTime = Date.now();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (netError) {
    safeLogEvent('api.request_failed', {
      severity: 'error',
      attributes: {
        endpoint: path,
        method: options.method || 'GET',
        error: String(netError),
        durationMs: Date.now() - startTime,
      },
    });
    throw netError;
  }

  // Прозрачное обновление токена при 401 (кроме auth-эндпоинтов и ручных токенов)
  const isAuthPath = path.startsWith('/auth');
  if (response.status === 401 && !manualToken && !isAuthPath) {
    if (refreshToken) {
      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!refreshResponse.ok) {
              throw new Error('Refresh failed');
            }

            const tokens = (await refreshResponse.json()) as TokenResponse;
            const { currentUser } = useAuthStore.getState();
            setTokens(tokens.access_token, tokens.refresh_token);
            if (currentUser) {
              setCurrentUser(currentUser);
            }
            return tokens.access_token;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        response = await fetch(`${API_URL}${path}`, { ...options, headers });
      } catch (refreshError) {
        safeLogEvent('auth.token_refresh_failed', {
          severity: 'error',
          attributes: {
            error: String(refreshError),
          },
        });
        logout();
      }
    } else {
      logout();
    }
  }

  if (!response.ok) {
    const text = await response.text();
    const errorMessage = parseErrorMessage(response.status, response.statusText, text);

    safeLogEvent('api.request_failed', {
      severity: 'error',
      attributes: {
        endpoint: path,
        method: options.method || 'GET',
        statusCode: response.status,
        statusText: response.statusText,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      },
    });

    throw new Error(errorMessage);
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
      request<CurrentUser[]>('/users'),

    create: (userData: CreateUserRequest): Promise<CurrentUser> =>
      request<CurrentUser>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    update: (userId: string, userData: Partial<CreateUserRequest> & { is_approved?: boolean; is_active?: boolean }): Promise<CurrentUser> =>
      request<CurrentUser>(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(userData),
      }),

    delete: (userId: string): Promise<CurrentUser> =>
      request<CurrentUser>(`/users/${userId}`, {
        method: 'DELETE',
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

    sendMessage: (
      chatId: string,
      content: string | null,
      payload?: {
        message_type?: string;
        file_url?: string | null;
        duration?: number | null;
        sticker_id?: string | null;
      }
    ): Promise<Message> =>
      request<Message>('/messaging/messages', {
        method: 'POST',
        body: JSON.stringify({ chat_id: chatId, content: content || '', ...payload }),
      }),

    uploadAttachment: async (fileUri: string, mimeType: string, filename: string): Promise<{ file_url: string }> => {
      const { accessToken } = useAuthStore.getState();
      
      const response = await FileSystem.uploadAsync(
        `${API_URL}/messaging/attachments/upload`,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType,
        }
      );

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Failed to upload file: Server returned status ${response.status}. Response: ${response.body}`);
      }

      return JSON.parse(response.body);
    },

    updateReceipts: (messageIds: string[], status: 'delivered' | 'read'): Promise<MsgResponse> =>
      request<MsgResponse>('/messaging/messages/receipts', {
        method: 'POST',
        body: JSON.stringify({ message_ids: messageIds, status }),
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

    createGroupChat: (name: string, memberIds: string[]): Promise<Chat> =>
      request<Chat>('/messaging/chats', {
        method: 'POST',
        body: JSON.stringify({
          member_ids: memberIds,
          is_group: true,
          name: name,
        }),
      }),
  },

  roles: {
    list: (): Promise<AppRole[]> =>
      request<AppRole[]>('/roles/list'),

    create: (name: string, permissions: string[]): Promise<AppRole> =>
      request<AppRole>('/roles/create', {
        method: 'POST',
        body: JSON.stringify({ name, permissions }),
      }),

    update: (roleId: string, name: string, permissions: string[]): Promise<AppRole> =>
      request<AppRole>(`/roles/${roleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, permissions }),
      }),

    makeDefault: (roleId: string): Promise<AppRole> =>
      request<AppRole>(`/roles/${roleId}/default`, {
        method: 'POST',
      }),

    listPermissions: (): Promise<AppPermission[]> =>
      request<AppPermission[]>('/permissions/list'),
  },
};
