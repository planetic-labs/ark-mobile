import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from '../constants/Config';

interface ChatHeaderTitleProps {
  name: string;
  memberCount: number;
  warriorCount: number;
}

interface ChatHeaderActionsProps {
  onSearch?: () => void;
  onMore?: () => void;
}

export function ChatHeaderTitle({
  name,
  memberCount,
  warriorCount,
}: ChatHeaderTitleProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.subtitle}>
        {memberCount} участника ·{' '}
        <Text style={{ color: COLORS.amber }}>◈ {warriorCount} Воина</Text>
      </Text>
    </View>
  );
}

export function ChatHeaderActions({
  onSearch,
  onMore,
}: ChatHeaderActionsProps): React.ReactElement {
  return (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.actionBtn} onPress={onSearch}>
        <Text style={styles.actionIcon}>🔍</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={onMore}>
        <Text style={styles.actionIcon}>⋮</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: Platform.OS === 'ios' ? 0 : 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: FONTS.displaySemiBold,
  },
  subtitle: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    marginTop: 1.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
