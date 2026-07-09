import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { useTimerStore } from '../stores/useTimerStore';

export function TimerManager(): null {
  const isActive = useTimerStore((state) => state.isActive);
  const tick = useTimerStore((state) => state.tick);
  const syncTimeLeft = useTimerStore((state) => state.syncTimeLeft);
  const isFinished = useTimerStore((state) => state.isFinished);
  const sound = useTimerStore((state) => state.sound);
  const resetFinished = useTimerStore((state) => state.resetFinished);

  const satsangPlayer = useVideoPlayer(require('../assets/sounds/siren_satsang.wav'), (player) => {
    player.loop = false;
  });

  const warriorPlayer = useVideoPlayer(require('../assets/sounds/siren_warrior.wav'), (player) => {
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

  // Эффект для воспроизведения звука
  useEffect(() => {
    if (isFinished) {
      if (sound === 'siren_satsang') {
        satsangPlayer.play();
      } else if (sound === 'siren_warrior') {
        warriorPlayer.play();
      }
      resetFinished();
    }
  }, [isFinished, sound, satsangPlayer, warriorPlayer, resetFinished]);

  return null;
}
