import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV, type MMKV } from 'react-native-mmkv';

const uiStorage: MMKV = createMMKV({ id: 'ui-storage' });

const zustandUIStorage = {
  getItem: (name: string): string | null =>
    uiStorage.getString(name) ?? null,
  setItem: (name: string, value: string): void =>
    uiStorage.set(name, value),
  removeItem: (name: string): void => {
    uiStorage.remove(name);
  },
};

// Тема — только 'light' пока, 'dark' зарезервирован под будущее
type Theme = 'light';

interface UIState {
  theme: Theme;
  // Показывать ли индикатор оффлайн-режима
  isOfflineBannerVisible: boolean;
  tabSettings: string[]; // Порядок и видимость табов

  setTheme: (theme: Theme) => void;
  setOfflineBannerVisible: (visible: boolean) => void;
  setTabSettings: (settings: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      isOfflineBannerVisible: false,
      tabSettings: ['index', 'navigator', 'video', 'materials', 'chronicles', 'settings'],

      setTheme: (theme) => set({ theme }),
      setOfflineBannerVisible: (visible) =>
        set({ isOfflineBannerVisible: visible }),
      setTabSettings: (settings) => set({ tabSettings: settings }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => zustandUIStorage),
      // Персистируем тему и настройки вкладок
      partialize: (state) => ({ 
        theme: state.theme,
        tabSettings: state.tabSettings,
      }),
    }
  )
);
