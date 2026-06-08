import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/Config';
import type { UserRole } from '../types/shared';

// Маркер роли — отображается рядом с именем пользователя везде в приложении.
// Воин: «◈ Воин Света», Администратор: «Администратор», Ученик: ничего.
export const WARRIOR_MARKER = '◈';
export const WARRIOR_COLOR = COLORS.amberSoft; // '#B9770C' — янтарный из дизайн-системы

interface WarriorBadgeProps {
  role: UserRole;
}

export function WarriorBadge({ role }: WarriorBadgeProps): React.ReactElement | null {
  if (role === 'STUDENT') return null;

  const label = role === 'WARRIOR' || role === 'MASTER'
    ? `${WARRIOR_MARKER} Воин Света`
    : 'Администратор';

  return <Text style={styles.badge}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 12,
    color: WARRIOR_COLOR,
    fontFamily: FONTS.bodyMedium,
    letterSpacing: 0.2,
  },
});
