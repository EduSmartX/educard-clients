import { StyleSheet } from 'react-native';

export const st = StyleSheet.create({
  flex1: { flex: 1 },
  saveHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colStudent: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  colMarks: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  list: { paddingBottom: 40 },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  studentInfo: { flex: 1, marginRight: 12 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  studentAdm: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  marksInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marksField: {
    width: 64,
    height: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  marksFieldAbsent: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    color: '#92400e',
  },
  marksFieldDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    color: '#94a3b8',
  },
  absentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  absentBtnActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  absentBtnDisabled: {
    opacity: 0.6,
  },
  absentText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  absentTextActive: { color: '#d97706' },

  viewOnlyBanner: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#93c5fd',
  },
  viewOnlyText: {
    fontSize: 12,
    color: '#1d4ed8',
    textAlign: 'center',
    fontWeight: '500',
  },

  publishRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  publishBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  publishBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  publishBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  unpublishBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  unpublishBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8' },
});
