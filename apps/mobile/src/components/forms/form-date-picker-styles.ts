/**
 * FormDatePicker styles (extracted to keep the component under the size limit).
 */

import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  required: { color: '#ef4444' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    borderWidth: 2,
  },
  inputDisabled: { opacity: 0.5 },
  inputText: { flex: 1, fontSize: 15, color: '#1e293b' },
  placeholder: { color: '#94a3b8' },
  labelError: { color: '#dc2626' },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4, marginLeft: 4 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 4 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },

  previewRow: {
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
  },
  previewText: { fontSize: 16, fontWeight: '600', color: '#0d9488' },

  // Nav
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: { padding: 8 },
  navCenter: { flexDirection: 'row', gap: 6 },
  navLabelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  navLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },

  // Weekday
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  weekDay: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // Days
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: { backgroundColor: '#0d9488' },
  dayCellToday: { borderWidth: 1.5, borderColor: '#0d9488' },
  dayCellDisabled: { opacity: 0.3 },
  dayText: { fontSize: 14, color: '#334155' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextToday: { color: '#0d9488', fontWeight: '600' },
  dayTextDisabled: { color: '#cbd5e1' },

  // Year list
  yearList: { maxHeight: 300, paddingHorizontal: 20 },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 10,
  },
  yearItemActive: { backgroundColor: '#f0fdfa' },
  yearText: { fontSize: 16, color: '#334155' },
  yearTextActive: { color: '#0d9488', fontWeight: '700' },

  // Month grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  monthItem: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  monthItemActive: { backgroundColor: '#0d9488' },
  monthText: { fontSize: 15, fontWeight: '500', color: '#334155' },
  monthTextActive: { color: '#fff', fontWeight: '700' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  clearBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
