// Shared types for Ark Messenger

export type UserRole = 'MASTER' | 'WARRIOR' | 'STUDENT' | 'ADMIN';

export interface User {
  id: string; // ULID
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string; // ISO Date
  roles?: string[];
  personal_permissions?: string[];
}

// Алиас для данных текущего аутентифицированного пользователя
export type CurrentUser = User;

export interface ChatMember {
  user_id: string;
  user?: User;
  joined_at: string; // ISO Date
}

export interface Chat {
  id: string; // ULID
  name: string | null;
  is_group: boolean;
  created_at: string; // ISO Date
}

export interface Message {
  id: string; // ULID
  chat_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  parent_id: string | null;
  created_at: string; // ISO Date
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  roles: string[];
  token_type?: string;
}

export interface MsgResponse {
  message: string;
}

// Ответ /auth/identify
export interface IdentifyResponse {
  next?: string;
  status?: string;
  error?: string;
}

// Ответ /auth/verify-code — бэкенд возвращает один из двух вариантов
export interface VerifyCodeResponse {
  next: 'home' | 'setup_profile' | string;
  access_token?: string;
  refresh_token?: string;
  setup_token?: string;
  expires_in?: number;
  roles?: string[];
}

// Ответ /auth/setup — возвращает токены
export type SetupResponse = TokenResponse;

// Ответ /auth/refresh
export type RefreshResponse = TokenResponse;

// Запрос на создание пользователя
export interface CreateUserRequest {
  email: string;
  full_name?: string;
  role: UserRole;
}

// WebSocket входящее событие (базовый тип)
export interface WebSocketEvent {
  type: string;
  data: Record<string, unknown>;
}

// WebSocket — событие нового сообщения
export interface WebSocketNewMessageEvent {
  type: 'message.new';
  data: Message;
}

// FastAPI validation error item
export interface FastApiValidationErrorItem {
  loc: string[];
  msg: string;
  type: string;
}
