import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { COLORS, FONTS } from '../../constants/Config';
import { authStyles } from '../../constants/authStyles';

// Экран ожидания одобрения администратором.
// Показывается когда accessToken есть, но currentUser.is_approved === false.
// Единственное действие — выйти (logout вернёт на /index через root redirect).
export default function WaitingScreen(): React.ReactElement {
  const logout = useAuthStore((state) => state.logout);

  return (
    <View style={authStyles.container}>
      <View style={authStyles.content}>
        <View style={styles.waitMarkContainer}>
          <View style={styles.waitMarkDot} />
        </View>

        <Text style={[authStyles.title, styles.centeredText]}>
          Заявка <Text style={authStyles.italicTitle}>принята</Text>
        </Text>
        <Text style={[authStyles.subtitle, styles.centeredText, styles.subtitleSpaced]}>
          Воины уже одобрили вас. Осталось подтверждение от Администратора.
        </Text>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={[styles.marker, styles.markerDone]}>
              <Text style={styles.markerCheck}>✓</Text>
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepText, styles.stepTextMuted]}>Заявка отправлена</Text>
              <Text style={styles.stepWhen}>9:43, 21 мая</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.marker, styles.markerNow]} />
            <View style={styles.stepBody}>
              <Text style={styles.stepText}>
                Алексей свяжется с вами по email и подскажет, как оплатить
              </Text>
              <Text style={styles.stepWhen}>обычно — в течение суток</Text>
            </View>
          </View>

          <View style={[styles.step, styles.stepLast]}>
            <View style={[styles.marker, styles.markerNext]} />
            <View style={styles.stepBody}>
              <Text style={[styles.stepText, styles.stepTextMuted]}>
                После оплаты — доступ ко всем чатам и материалам
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[authStyles.button, authStyles.buttonGhost]}
          onPress={logout}
        >
          <Text style={authStyles.buttonTextGhost}>Написать Алексею</Text>
        </TouchableOpacity>

        <View style={authStyles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredText: { textAlign: 'center' },
  subtitleSpaced: { marginBottom: 32 },
  waitMarkContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  waitMarkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.amber,
  },
  steps: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.bgSurface,
    paddingVertical: 14,
    marginBottom: 28,
  },
  step: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    alignItems: 'flex-start',
  },
  stepLast: { borderBottomWidth: 0 },
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 14,
    marginTop: 2,
  },
  markerDone: {
    backgroundColor: COLORS.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
  },
  markerNow: {
    borderWidth: 4.5,
    borderColor: COLORS.amber,
    backgroundColor: '#ffffff',
  },
  markerNext: {
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    backgroundColor: 'transparent',
  },
  stepBody: { flex: 1 },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  stepTextMuted: { color: COLORS.textMuted },
  stepWhen: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: FONTS.mono,
    marginTop: 4,
  },
});
