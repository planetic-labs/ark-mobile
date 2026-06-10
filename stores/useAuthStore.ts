import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { CurrentUser } from '../types/shared';

// Синхронное хранилище на базе MMKV (~30x быстрее AsyncStorage)
const mmkvInstance: MMKV = createMMKV({ id: 'auth-storage' });

const zustandMMKVStorage = {
  getItem: (name: string): string | null => {
    return mmkvInstance.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkvInstance.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkvInstance.remove(name);
  },
};

interface AuthState {
  // Персистентные (MMKV)
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: CurrentUser | null;
  pushToken: string | null;

  // Только в памяти — не персистировать
  authStep: 'idle' | 'code' | 'setup';
  pendingEmail: string | null;
  setupToken: string | null;

  // Действия
  setTokens: (accessToken: string, refreshToken: string) => void;
  setCurrentUser: (user: CurrentUser) => void;
  setPushToken: (token: string | null) => void;
  setAuthStep: (step: AuthState['authStep']) => void;
  setPendingEmail: (email: string | null) => void;
  setSetupToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Начальные значения персистентных полей
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      pushToken: null,

      // Начальные значения in-memory полей
      authStep: 'idle',
      pendingEmail: null,
      setupToken: null,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setCurrentUser: (user) =>
        set({ currentUser: user }),

      setPushToken: (token) =>
        set({ pushToken: token }),

      setAuthStep: (step) =>
        set({ authStep: step }),

      setPendingEmail: (email) =>
        set({ pendingEmail: email }),

      setSetupToken: (token) =>
        set({ setupToken: token }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          currentUser: null,
          pushToken: null,
          authStep: 'idle',
          pendingEmail: null,
          setupToken: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      // Персистировать только токены и профиль — не ephemeral auth flow
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentUser: state.currentUser,
        pushToken: state.pushToken,
      }),
    }
  )
);
