import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS } from '../constants/Config';

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
  paddingBottom: number;
}

// Панель ввода сообщения внизу экрана чата.
// isSending блокирует кнопку отправки и показывает спиннер.
export function MessageComposer({
  value,
  onChangeText,
  onSend,
  isSending,
  paddingBottom,
}: MessageComposerProps): React.ReactElement {
  const hasText = value.trim().length > 0;

  return (
    <View style={[styles.composer, { paddingBottom, paddingTop: 10 }]}>
      <TouchableOpacity style={styles.iconBtn}>
        <Text style={styles.icon}>+</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Сообщение или отчёт…"
        placeholderTextColor={COLORS.textFaint}
        multiline
        maxLength={4000}
      />

      <TouchableOpacity
        style={[styles.iconBtn, hasText && styles.sendBtnActive]}
        onPress={onSend}
        disabled={isSending || !hasText}
      >
        {isSending ? (
          <ActivityIndicator color={COLORS.amber} size="small" />
        ) : hasText ? (
          <Text style={styles.sendIcon}>➔</Text>
        ) : (
          <Text style={styles.icon}>🎤</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECE7DD',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ECE7DD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
    backgroundColor: '#FCFAF5',
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontFamily: FONTS.body,
  },
  sendBtnActive: {
    backgroundColor: COLORS.amber,
  },
  sendIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
});
