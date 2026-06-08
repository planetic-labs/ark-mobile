import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { COLORS, FONTS } from '../../constants/Config';
import { authStyles } from '../../constants/authStyles';

const CODE_LENGTH = 6;
const RESEND_DELAY_SEC = 43;

// Второй шаг авторизации: ввод 6-значного кода из письма.
// Читает pendingEmail из store. Если его нет — возвращает на index.
export default function CodeScreen(): React.ReactElement {
  const pendingEmail = useAuthStore((state) => state.pendingEmail);
  const setSetupToken = useAuthStore((state) => state.setSetupToken);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY_SEC);
  const codeInputRef = useRef<TextInput>(null);

  // Фокус на скрытый инпут после монтирования
  useEffect(() => {
    const timeout = setTimeout(() => codeInputRef.current?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  // Обратный отсчёт для повторной отправки
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Защита: если pendingEmail пропал (перезапуск приложения) — на index
  useEffect(() => {
    if (!pendingEmail) router.replace('/(auth)');
  }, [pendingEmail]);

  const handleVerifyCode = async (currentCode: string): Promise<void> => {
    if (currentCode.length !== CODE_LENGTH || isLoading || !pendingEmail) return;

    setIsLoading(true);
    try {
      const response = await api.auth.verifyCode(pendingEmail, currentCode);
      if (response.next === 'setup_profile') {
        setSetupToken(response.setup_token ?? null);
        router.push('/(auth)/setup');
      } else {
        // next === 'home': токены уже в ответе, загружаем профиль
        const user = await api.users.me(response.access_token);
        setTokens(response.access_token!, response.refresh_token!);
        setCurrentUser(user);
        router.replace('/(tabs)');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка', message);
      setCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string): void => {
    const clean = text.replace(/[^0-9]/g, '');
    setCode(clean);
    if (clean.length === CODE_LENGTH) {
      handleVerifyCode(clean);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (!pendingEmail) return;
    try {
      await api.auth.identify(pendingEmail);
      setResendTimer(RESEND_DELAY_SEC);
      setCode('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка', message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={authStyles.keyboardAvoidingView}
    >
      <View style={authStyles.container}>
        <View style={authStyles.content}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={authStyles.title}>
            Код <Text style={authStyles.italicTitle}>подтверждения</Text>
          </Text>
          <Text style={authStyles.subtitle}>
            Письмо ушло на{'\n'}
            <Text style={authStyles.boldSubtitle}>{pendingEmail}</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => codeInputRef.current?.focus()}
            style={styles.cellsContainer}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, index) => {
              const digit = code[index];
              const isCurrent = index === code.length;
              return (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    digit !== undefined && styles.cellFilled,
                    isCurrent && isInputFocused && styles.cellActive,
                  ]}
                >
                  {digit !== undefined
                    ? <Text style={styles.cellText}>{digit}</Text>
                    : isCurrent && isInputFocused
                      ? <View style={styles.cursor} />
                      : null
                  }
                </View>
              );
            })}
          </TouchableOpacity>

          <TextInput
            ref={codeInputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />

          <View style={styles.resendRow}>
            <TouchableOpacity disabled={resendTimer > 0 || isLoading} onPress={handleResend}>
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                Отправить заново
              </Text>
            </TouchableOpacity>
            {resendTimer > 0 && (
              <Text style={styles.timer}>
                0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
              </Text>
            )}
          </View>

          <View style={authStyles.spacer} />

          <Text style={authStyles.footnote}>
            Письмо не пришло? Проверьте папку «Спам»{'\n'}или попробуйте другой адрес.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    marginVertical: 12,
  },
  backArrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  cellsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  cell: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  cellFilled: { borderColor: COLORS.borderStrong },
  cellActive: { borderColor: COLORS.amber },
  cellText: {
    fontSize: 22,
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.amber,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  resendText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  resendTextDisabled: {
    color: COLORS.textMuted,
  },
  timer: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
  },
});
