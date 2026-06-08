import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/Config';
export const chroniclesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1EA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCFAF5',
    borderColor: '#ECE7DD',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
    padding: 0,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  chronicleCard: {
    backgroundColor: '#fff',
    borderColor: '#ECE7DD',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#ECE7DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarWarrior: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amberGlow,
  },
  avatarText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodySemiBold,
  },
  avatarTextWarrior: {
    color: COLORS.amber,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorName: {
    fontSize: 14.5,
    fontFamily: FONTS.displaySemiBold,
    color: COLORS.textPrimary,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  reportTag: {
    backgroundColor: '#F4F1EA',
  },
  correctionTag: {
    backgroundColor: '#FCF4E3',
  },
  tagBadgeText: {
    fontSize: 8.5,
    fontFamily: FONTS.monoMedium,
    textTransform: 'uppercase',
  },
  reportTagText: {
    color: COLORS.textSecondary,
  },
  correctionTagText: {
    color: COLORS.amber,
  },
  cardDate: {
    fontSize: 10.5,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardBody: {
    marginTop: 12,
  },
  cardText: {
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.textPrimary,
    fontFamily: FONTS.body,
  },
  cardFooter: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F4F1EA',
    paddingTop: 12,
  },
  studiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnStudy: {
    backgroundColor: '#F4F1EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btnStudyDone: {
    backgroundColor: '#FCF4E3',
    borderColor: '#F0DFB8',
    borderWidth: 1,
  },
  btnStudyText: {
    fontSize: 11.5,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.textSecondary,
  },
  btnStudyTextDone: {
    color: COLORS.amber,
  },
  studiedStat: {
    fontSize: 11.5,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    marginLeft: 12,
  },
  reactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  reactLabel: {
    fontSize: 10,
    fontFamily: FONTS.mono,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginRight: 10,
  },
  reactChip: {
    backgroundColor: '#F4F1EA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  reactChipActive: {
    backgroundColor: '#FAF1DC',
    borderColor: '#F0DFB8',
    borderWidth: 1,
  },
  reactChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONTS.bodyMedium,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    marginTop: 40,
  },
});
