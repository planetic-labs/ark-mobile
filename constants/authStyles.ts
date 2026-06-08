import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS } from './Config';

// Стили, общие для всех экранов auth-флоу.
// Экраноспецифические стили определяются локально в каждом файле.
export const authStyles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.3,
    color: COLORS.textPrimary,
    fontFamily: FONTS.display,
    marginBottom: 14,
  },
  italicTitle: {
    fontStyle: 'italic',
    color: COLORS.amber,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: 36,
    fontFamily: FONTS.bodyLight,
  },
  boldSubtitle: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodySemiBold,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontFamily: FONTS.mono,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    width: '100%',
    marginBottom: 28,
  },
  inputFocused: {
    borderColor: COLORS.amber,
  },
  button: {
    backgroundColor: COLORS.amber,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
  },
  buttonTextGhost: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
  },
  spacer: {
    flex: 1,
  },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontFamily: FONTS.bodyLight,
    marginBottom: 12,
  },
});
