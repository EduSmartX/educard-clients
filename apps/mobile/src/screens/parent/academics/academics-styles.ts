/**
 * Shared card/state styles for the student Homework and Exams pages.
 * Mirrors the admin/teacher list styling (see screens/shared/timetable).
 */

import { StyleSheet } from 'react-native';

export const academicsStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },

  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateArrow: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  dateValue: { marginTop: 2, fontSize: 11, color: '#64748b' },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  sectionTitleSpaced: { marginTop: 22 },

  card: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardSubtitle: { marginTop: 3, fontSize: 12, color: '#64748b' },
  cardMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: { fontSize: 11, color: '#64748b' },
  cardTitleWrap: { flex: 1, paddingRight: 10 },

  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  pill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { fontSize: 10, fontWeight: '800' },

  priorityRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  priorityText: { fontSize: 10, fontWeight: '700', color: '#dc2626' },

  stateCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 24,
    backgroundColor: '#fff',
  },
  stateIcon: { fontSize: 34 },
  stateTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
  },
  stateMessage: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyInline: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 22,
    backgroundColor: '#fff',
  },
  emptyInlineText: { fontSize: 12, color: '#94a3b8' },
  stateCardSpaced: { marginTop: 16 },
});
