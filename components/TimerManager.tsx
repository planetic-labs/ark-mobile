import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import * as Notifications from 'expo-notifications';
import { useTimerStore } from '../stores/useTimerStore';

export function TimerManager(): null {
  const isActive = useTimerStore((state) => state.isActive);
  const tick = useTimerStore((state) => state.tick);
  const syncTimeLeft = useTimerStore((state) => state.syncTimeLeft);
  const isFinished = useTimerStore((state) => state.isFinished);
  const sound = useTimerStore((state) => state.sound);
  const resetFinished = useTimerStore((state) => state.resetFinished);

  const boxingGongPlayer = useVideoPlayer(require('../assets/sounds/boxing_gong.wav'), (player) => {
    player.loop = false;
  });

  const gongGrindingPlayer = useVideoPlayer(require('../assets/sounds/gong_grinding_sound.wav'), (player) => {
    player.loop = false;
  });

  const gongSingleNoisyPlayer = useVideoPlayer(require('../assets/sounds/gong_single_noisy.wav'), (player) => {
    player.loop = false;
  });

  const spaceGongPlayer = useVideoPlayer(require('../assets/sounds/space_gong.wav'), (player) => {
    player.loop = false;
  });

  // Эффект для интервала таймера
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, tick]);

  // Восстановление точного времени при разблокировке/возвращении в приложение
  useEffect(() => {
    let lastState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && lastState !== 'active') {
        syncTimeLeft(true);
      }
      lastState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [syncTimeLeft]);

  // Синхронизация при старте или очистка застрявших в системе уведомлений, если таймер выключен
  useEffect(() => {
    if (isActive) {
      syncTimeLeft(true);
    } else {
      (async () => {
        try {
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          const timerNotificationIds = scheduled
            .filter((n) => n.content.title === 'Практика завершена' || n.content.title === 'Практика продолжается')
            .map((n) => n.identifier);
          
          for (const id of timerNotificationIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        } catch (e) {
          console.log('Failed to clear stuck notifications on startup', e);
        }
      })();
    }
  }, [isActive, syncTimeLeft]);

  // Эффект для воспроизведения звука
  useEffect(() => {
    if (isFinished) {
      if (sound === 'boxing_gong') {
        boxingGongPlayer.currentTime = 0;
        boxingGongPlayer.play();
      } else if (sound === 'gong_grinding_sound') {
        gongGrindingPlayer.currentTime = 0;
        gongGrindingPlayer.play();
      } else if (sound === 'gong_single_noisy') {
        gongSingleNoisyPlayer.currentTime = 0;
        gongSingleNoisyPlayer.play();
      } else if (sound === 'space_gong') {
        spaceGongPlayer.currentTime = 0;
        spaceGongPlayer.play();
      }
      resetFinished();
    }
  }, [
    isFinished,
    sound,
    boxingGongPlayer,
    gongGrindingPlayer,
    gongSingleNoisyPlayer,
    spaceGongPlayer,
    resetFinished,
  ]);

  return null;
}
