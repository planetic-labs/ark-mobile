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
  endTime: number | null; // timestamp окончания
  notificationId: string | null;

  setDuration: (seconds: number) => void;
  setSound: (sound: TimerSound) => void;
  startTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  tick: () => void;
  syncTimeLeft: (wasInBackground?: boolean) => void;
  resetFinished: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      duration: 300, // 5 минут по умолчанию
      sound: 'siren_satsang',
      isActive: false,
      timeLeft: 300,
      isFinished: false,
      endTime: null,
      notificationId: null,

      setDuration: (seconds) => {
        set({ duration: seconds });
        if (!get().isActive) {
          set({ timeLeft: seconds });
        }
      },

      setSound: (sound) => set({ sound }),

      startTimer: async () => {
        const { timeLeft, duration, sound, notificationId } = get();

        // Снимаем старое уведомление, если оно было
        if (notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
          } catch (e) {
            console.log('Failed to cancel old notification', e);
          }
        }

        const nextTimeLeft = timeLeft <= 0 ? duration : timeLeft;
        const endTime = Date.now() + nextTimeLeft * 1000;

        let newNotificationId: string | null = null;
        try {
          const soundName = sound === 'siren_satsang' ? 'siren_satsang.wav' : 'siren_warrior.wav';
          newNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Практика завершена',
              body: 'Время вашей медитации подошло к концу.',
              sound: soundName,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: nextTimeLeft,
              channelId: `timer_${sound}`,
            },
          });
        } catch (error) {
          console.error('Failed to schedule local notification for timer:', error);
          Observe.logEvent('timer.notification_failed', {
            severity: 'error',
            attributes: {
              duration: nextTimeLeft,
              sound,
              error: String(error),
            },
          });
        }

        set({
          isActive: true,
          timeLeft: nextTimeLeft,
          endTime,
          notificationId: newNotificationId,
          isFinished: false,
        });
      },

      stopTimer: async () => {
        const { notificationId } = get();
        if (notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
          } catch (e) {
            console.log('Failed to cancel notification on stop', e);
          }
        }
        set({ isActive: false, notificationId: null, endTime: null });
      },

      resetTimer: async () => {
        const { duration, notificationId } = get();
        if (notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
          } catch (e) {
            console.log('Failed to cancel notification on reset', e);
          }
        }
        set({
          isActive: false,
          timeLeft: duration,
          endTime: null,
          notificationId: null,
          isFinished: false,
        });
      },

      syncTimeLeft: (wasInBackground) => {
        const { endTime, duration, isActive, sound, notificationId } = get();
        if (!isActive || !endTime) return;
        
        const now = Date.now();
        if (now >= endTime) {
          // Время вышло, таймер перезапускается циклично
          const cycleMs = duration * 1000;
          const overdueMs = now - endTime;
          const extraCycles = Math.floor(overdueMs / cycleMs) + 1;
          
          const nextEndTime = endTime + extraCycles * cycleMs;
          const nextTimeLeft = Math.max(0, Math.floor((nextEndTime - now) / 1000));
          
          // Отменяем старое уведомление и планируем новое асинхронно
          (async () => {
            if (notificationId) {
              try {
                await Notifications.cancelScheduledNotificationAsync(notificationId);
              } catch (e) {
                console.log('Failed to cancel finished notification', e);
              }
            }
            
            let newNotificationId: string | null = null;
            try {
              const soundName = sound === 'siren_satsang' ? 'siren_satsang.wav' : 'siren_warrior.wav';
              newNotificationId = await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'Практика продолжается',
                  body: 'Начался новый цикл таймера.',
                  sound: soundName,
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                  seconds: nextTimeLeft <= 0 ? duration : nextTimeLeft,
                  channelId: `timer_${sound}`,
                },
              });
            } catch (error) {
              console.error('Failed to reschedule local notification for timer:', error);
            }
            
            set({ notificationId: newNotificationId });
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
      }),
    }
  )
);
