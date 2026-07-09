import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  Text,
  Switch,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS } from '../constants/Config';

const DragHandleIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8h16M4 16h16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface DraggableTabItemProps {
  title: string;
  canBeHidden: boolean;
  isVisible: boolean;
  onToggle: () => void;
  actualIndex: number;
  onDragUpdate: (startIndex: number, offset: number, currentDy: number) => void;
  onDragEnd: () => void;
  itemHeight: number;
}

export function DraggableTabItem({
  title,
  canBeHidden,
  isVisible,
  onToggle,
  actualIndex,
  onDragUpdate,
  onDragEnd,
  itemHeight,
}: DraggableTabItemProps): React.ReactElement {
  const pan = useRef(new Animated.ValueXY()).current;
  const [activeDrag, setActiveDrag] = useState(false);
  const startIndexRef = useRef<number | null>(null);

  // Сохраняем свежие ссылки на пропсы, чтобы избежать замыкания устаревших значений в PanResponder
  const actualIndexRef = useRef(actualIndex);
  actualIndexRef.current = actualIndex;

  const onDragUpdateRef = useRef(onDragUpdate);
  onDragUpdateRef.current = onDragUpdate;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveDrag(true);
        startIndexRef.current = actualIndexRef.current;
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gestureState) => {
        if (startIndexRef.current !== null) {
          const offset = Math.round(gestureState.dy / itemHeight);
          onDragUpdateRef.current(startIndexRef.current, offset, gestureState.dy);
          
          // Компенсируем смещение pan.y на разницу индексов в макете, 
          // чтобы элемент не прыгал при изменении его порядка на лету
          const indexDiff = actualIndexRef.current - startIndexRef.current;
          pan.setValue({ x: 0, y: gestureState.dy - itemHeight * indexDiff });
        } else {
          pan.setValue({ x: 0, y: gestureState.dy });
        }
      },
      onPanResponderRelease: () => {
        setActiveDrag(false);
        startIndexRef.current = null;
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        onDragEnd();
      },
      onPanResponderTerminate: () => {
        setActiveDrag(false);
        startIndexRef.current = null;
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        onDragEnd();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        {
          height: itemHeight,
          transform: [{ translateY: pan.y }],
          zIndex: activeDrag ? 999 : 1,
          backgroundColor: activeDrag ? '#F5F0E6' : COLORS.background,
          shadowColor: '#282114',
          shadowOffset: { width: 0, height: activeDrag ? 4 : 0 },
          shadowOpacity: activeDrag ? 0.12 : 0,
          shadowRadius: activeDrag ? 8 : 0,
          elevation: activeDrag ? 4 : 0,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View {...panResponder.panHandlers} style={styles.dragHandle}>
          <DragHandleIcon color={COLORS.textMuted} />
        </View>
        <Text style={styles.titleText}>{title}</Text>
      </View>
      
      {canBeHidden ? (
        <Switch
          value={isVisible}
          onValueChange={onToggle}
          trackColor={{ false: '#ECE7DD', true: COLORS.amberTint }}
          thumbColor={isVisible ? COLORS.amber : '#A69D8F'}
        />
      ) : (
        <Text style={styles.requiredText}>Обязательно</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    paddingVertical: 12,
    paddingRight: 16,
  },
  titleText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  requiredText: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
  },
});
