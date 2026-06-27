import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { useUIStore } from '../stores/useUIStore';
import { COLORS, FONTS } from '../constants/Config';

// Баннер появляется снизу при потере сети и скрывается при восстановлении.
export function OfflineBanner(): React.ReactElement | null {
  const isVisible = useUIStore((s) => s.isOfflineBannerVisible);
  const setVisible = useUIStore((s) => s.setOfflineBannerVisible);
  const translateY = useSharedValue(100);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected ?? true);
      setVisible(offline);
    });
    return unsubscribe;
  }, [setVisible]);

  useEffect(() => {
    translateY.value = withTiming(isVisible ? 0 : 100, { duration: 280 });
  }, [isVisible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents={isVisible ? 'auto' : 'none'}>
      <View style={styles.dot} />
      <Text style={styles.text}>Нет соединения · работаем из кэша</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warn,
    marginRight: 10,
  },
  text: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: FONTS.body,
  },
});
