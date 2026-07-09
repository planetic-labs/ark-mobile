import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import * as Notifications from 'expo-notifications';
import { Observe } from 'expo-observe';

const timerStorage: MMKV = createMMKV({ id: 'timer-storage' });

const zustandTimerStorage = {
  getItem: (name: string): string | null =>
    timerStorage.getString(name) ?? null,
  setItem: (name: string, value: string): void =>
    timerStorage.set(name, value),
  removeItem: (name: string): void => {
    timerStorage.remove(name);
  },
};

export type TimerSound = 'siren_satsang' | 'siren_warrior';

interface TimerState {
  duration: number; // в секундах
  sound: TimerSound;
  isActive: boolean;
  timeLeft: number;
  isFinished: boolean;
  endTime: number | null; // timestamp окончания первого цикла
  notificationIds: string[]; // ID всех запланированных уведомлений

  setDuration: (seconds: number) => void;
  setSound: (sound: TimerSound) => void;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  tick: () => void;
  syncTimeLeft: (wasInBackground?: boolean) => void;
  resetFinished: () => void;
}

const cancelAllNotifications = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.log('Failed to cancel notification', id, e);
    }
  }
};

const scheduleNotificationPack = async (
  startTimeLeft: number,
  duration: number,
  sound: TimerSound
): Promise<string[]> => {
  const ids: string[] = [];
  const soundName = sound === 'siren_satsang' ? 'siren_satsang.wav' : 'siren_warrior.wav';
  
  // Рассчитываем количество циклов на 10 часов вперед (10 * 3600 секунд)
  // Ограничиваем сверху 50 уведомлениями, так как на iOS жесткий лимит составляет 64 уведомления на приложение,
  // а на Android большое количество точных будильников может расцениваться как спам.
  const hoursToSchedule = 10;
  const desiredSeconds = hoursToSchedule * 3600;
  const calculatedCycles = Math.ceil(desiredSeconds / duration);
  const maxCycles = Math.min(50, calculatedCycles);
  
  for (let i = 0; i < maxCycles; i++) {
    const seconds = startTimeLeft + i * duration;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: i === 0 ? 'Практика завершена' : 'Практика продолжается',
          body: i === 0 ? 'Время вашей медитации подошло к концу.' : `Завершился цикл ${i + 1}.`,
          sound: soundName,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          channelId: `timer_${sound}`,
        },
      });
      ids.push(id);
    } catch (error) {
      console.error(`Failed to schedule notification for cycle ${i}:`, error);
    }
  }
  return ids;
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      duration: 300, // 5 минут по умолчанию
      sound: 'siren_satsang',
      isActive: false,
      timeLeft: 300,
      isFinished: false,
      endTime: null,
      notificationIds: [],

      setDuration: (seconds) => {
        set({ duration: seconds });
        if (!get().isActive) {
          set({ timeLeft: seconds });
        }
      },

      setSound: (sound) => set({ sound }),

      startTimer: async () => {
        const { timeLeft, duration, sound, notificationIds } = get();

        // Снимаем старые уведомления, если они были
        if (notificationIds.length > 0) {
          await cancelAllNotifications(notificationIds);
        }

        const nextTimeLeft = timeLeft <= 0 ? duration : timeLeft;
        const endTime = Date.now() + nextTimeLeft * 1000;

        const newNotificationIds = await scheduleNotificationPack(nextTimeLeft, duration, sound);

        Observe.logEvent('timer.started', {
          severity: 'info',
          attributes: {
            duration,
            sound,
            timeLeft: nextTimeLeft,
          },
        });

        set({
          isActive: true,
          timeLeft: nextTimeLeft,
          endTime,
          notificationIds: newNotificationIds,
          isFinished: false,
        });
      },

      stopTimer: async () => {
        const { notificationIds } = get();
        if (notificationIds.length > 0) {
          await cancelAllNotifications(notificationIds);
        }
        set({ isActive: false, notificationIds: [], endTime: null });
      },

      resetTimer: async () => {
        const { duration, notificationIds } = get();
        if (notificationIds.length > 0) {
          await cancelAllNotifications(notificationIds);
        }
        set({
          isActive: false,
          timeLeft: duration,
          endTime: null,
          notificationIds: [],
          isFinished: false,
        });
      },

      syncTimeLeft: (wasInBackground) => {
        const { endTime, duration, isActive, sound, notificationIds } = get();
        if (!isActive || !endTime) return;
        
        const now = Date.now();
        if (now >= endTime) {
          // Время вышло, таймер перезапускается циклично
          const cycleMs = duration * 1000;
          const overdueMs = now - endTime;
          const extraCycles = Math.floor(overdueMs / cycleMs) + 1;
          
          const nextEndTime = endTime + extraCycles * cycleMs;
          const nextTimeLeft = Math.max(0, Math.floor((nextEndTime - now) / 1000));
          
          // Отменяем старые уведомления и планируем новую пачку асинхронно
          (async () => {
            if (notificationIds.length > 0) {
              await cancelAllNotifications(notificationIds);
            }
            const newNotificationIds = await scheduleNotificationPack(
              nextTimeLeft <= 0 ? duration : nextTimeLeft,
              duration,
              sound
            );
            set({ notificationIds: newNotificationIds });
          })();
          
          set({
            timeLeft: nextTimeLeft,
            endTime: nextEndTime,
            isFinished: !wasInBackground,
          });
        } else {
          set({ timeLeft: Math.max(0, Math.floor((endTime - now) / 1000)) });
        }
      },

      tick: () => {
        get().syncTimeLeft();
      },

      resetFinished: () => set({ isFinished: false }),
    }),
    {
      name: 'timer-storage',
      storage: createJSONStorage(() => zustandTimerStorage),
      partialize: (state) => ({
        duration: state.duration,
        sound: state.sound,
        isActive: state.isActive,
        timeLeft: state.timeLeft,
        endTime: state.endTime,
        notificationIds: state.notificationIds,
      }),
    }
  )
);
