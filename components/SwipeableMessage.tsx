import React from 'react';
import { PanResponder, Animated, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/Config';

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  enabled?: boolean;
}

export function SwipeableMessage({
  children,
  onSwipeLeft,
  enabled = true,
}: SwipeableMessageProps): React.ReactElement {
  const translateX = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Активируем жест, только если движение идет влево и горизонтальное смещение больше вертикального
        const { dx, dy } = gestureState;
        return enabled && dx < -10 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Ограничиваем сдвиг влево (до -80 пикселей) и запрещаем сдвиг вправо (> 0)
        const newX = Math.max(-80, Math.min(0, gestureState.dx));
        translateX.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Если сдвинули влево достаточно сильно (больше -50 пикселей), вызываем колбэк
        if (gestureState.dx < -50) {
          onSwipeLeft();
        }
        // Возвращаем баббл в исходное положение с анимацией spring
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Иконка реплея сзади сообщения */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          {
            opacity: translateX.interpolate({
              inputRange: [-50, 0],
              outputRange: [1, 0],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: translateX.interpolate({
                  inputRange: [-50, 0],
                  outputRange: [1, 0.6],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.replyIcon}>↩</Text>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateX }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  replyIconContainer: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyIcon: {
    fontSize: 22,
    color: COLORS.amber,
  },
});
