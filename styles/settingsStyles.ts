import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/Config';

export const settingsStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#282114',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCD5C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarWarrior: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amberGlow,
  },
  avatarText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 22,
    color: '#5F5848',
  },
  avatarTextWarrior: {
    color: COLORS.amber,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  roleText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.amberSoft,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: 10,
    paddingLeft: 4,
  },
  menuGroup: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  menuItemTextDanger: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.warn,
    marginLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  versionText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
