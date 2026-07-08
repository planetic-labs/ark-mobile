import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/useAuthStore';
import { COLORS, FONTS } from '../../constants/Config';
import { authStyles } from '../../constants/authStyles';
import { useObserve } from 'expo-observe';

// Третий шаг авторизации: заполнение профиля при первом входе.
// Читает setupToken из store. Если его нет — возвращает на index.
export default function SetupScreen(): React.ReactElement {
  const setupToken = useAuthStore((state) => state.setupToken);
  const setTokens = useAuthStore((state) => state.setTokens);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isFirstFocused, setIsFirstFocused] = useState(false);
  const [isLastFocused, setIsLastFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { markInteractive } = useObserve();

  // Защита: если setupToken пропал (перезапуск приложения) — на index
  useEffect(() => {
    if (!setupToken) router.replace('/(auth)');
    markInteractive();
  }, [setupToken, markInteractive]);

  const handleSubmit = async (): Promise<void> => {
    if (!firstName.trim() || !lastName.trim() || !setupToken) return;

    setIsLoading(true);
    try {
      const tokens = await api.auth.setup(setupToken, firstName.trim(), lastName.trim());
      const user = await api.users.me(tokens.access_token);
      setTokens(tokens.access_token, tokens.refresh_token);
      setCurrentUser(user);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка', message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = !firstName.trim() || !lastName.trim() || isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={authStyles.keyboardAvoidingView}
    >
      <View style={authStyles.container}>
        <View style={authStyles.content}>
          <Text style={authStyles.title}>
            Как вас <Text style={authStyles.italicTitle}>называть?</Text>
          </Text>
          <Text style={authStyles.subtitle}>
            Имя и фото видят другие участники в чатах и отчётах.
          </Text>

          <View style={styles.avatarPickContainer}>
            <View style={styles.avatarPick}>
              <Text style={styles.avatarPickIcon}>📷</Text>
              <View style={styles.avatarPlus}>
                <Text style={styles.avatarPlusText}>+</Text>
              </View>
            </View>
          </View>

          <Text style={authStyles.label}>Имя</Text>
          <TextInput
            style={[authStyles.input, isFirstFocused && authStyles.inputFocused]}
            placeholder="Алексей"
            placeholderTextColor={COLORS.textFaint}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            onFocus={() => setIsFirstFocused(true)}
            onBlur={() => setIsFirstFocused(false)}
          />

          <Text style={authStyles.label}>Фамилия</Text>
          <TextInput
            style={[authStyles.input, isLastFocused && authStyles.inputFocused]}
            placeholder="Прусиков"
            placeholderTextColor={COLORS.textFaint}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            onFocus={() => setIsLastFocused(true)}
            onBlur={() => setIsLastFocused(false)}
          />

          <Text style={styles.fieldFootnote}>
            Имя и фамилию можно изменить позже в профиле. По правилам общины вводите свои настоящие имя и фамилию.
          </Text>

          <TouchableOpacity
            style={[authStyles.button, isSubmitDisabled && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={authStyles.buttonText}>Продолжить</Text>
            }
          </TouchableOpacity>

          <View style={authStyles.spacer} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatarPickContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPick: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarPickIcon: { fontSize: 28 },
  avatarPlus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.amber,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlusText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONTS.bodySemiBold,
    lineHeight: 18,
  },
  fieldFootnote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    fontFamily: FONTS.bodyLight,
    marginBottom: 28,
    marginTop: -14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
