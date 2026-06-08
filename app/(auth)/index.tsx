import React, { useState } from 'react';
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

// Первый шаг авторизации: ввод email.
// После успешного запроса кода сохраняет email в store и переходит на /code.
export default function AuthIndexScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setPendingEmail = useAuthStore((state) => state.setPendingEmail);

  const handleRequestCode = async (): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    setIsLoading(true);
    try {
      const response = await api.auth.identify(trimmedEmail);
      if (response.error === 'not_found') {
        throw new Error('Email не зарегистрирован в системе или учётная запись отключена');
      }
      setPendingEmail(trimmedEmail);
      router.push('/(auth)/code');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      Alert.alert('Ошибка', message);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !email.trim();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={authStyles.keyboardAvoidingView}
    >
      <View style={authStyles.container}>
        <View style={authStyles.content}>
          <View style={styles.brandMarkContainer}>
            <Text style={styles.brandMark}>К</Text>
          </View>

          <Text style={authStyles.title}>
            Войти{'\n'}в <Text style={authStyles.italicTitle}>Ковчег</Text>
          </Text>
          <Text style={authStyles.subtitle}>Введите email — отправим код для входа.</Text>

          <Text style={authStyles.label}>Email</Text>
          <TextInput
            style={[authStyles.input, isFocused && authStyles.inputFocused]}
            placeholder="alexey.prusikov@gmail.com"
            placeholderTextColor={COLORS.textFaint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

          <TouchableOpacity
            style={[authStyles.button, isButtonDisabled && styles.buttonDisabled]}
            onPress={handleRequestCode}
            disabled={isButtonDisabled}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={authStyles.buttonText}>Получить код</Text>
            }
          </TouchableOpacity>

          <View style={authStyles.spacer} />

          <Text style={authStyles.footnote}>
            Доступ только по приглашению.{'\n'}
            Если адреса нет в списке — обратитесь к Воину, через которого вы пришли.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brandMarkContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  brandMark: {
    fontSize: 24,
    color: COLORS.amber,
    fontFamily: FONTS.displaySemiBold,
    borderWidth: 1.5,
    borderColor: COLORS.amber,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
