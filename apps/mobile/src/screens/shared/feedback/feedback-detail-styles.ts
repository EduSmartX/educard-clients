import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#94a3b8',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  progressDotTextActive: {
    color: '#fff',
  },
  progressLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  progressLabelActive: {
    color: '#334155',
    fontWeight: '600',
  },
  remarksCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 14,
    marginBottom: 12,
  },
  remarksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  remarksMeta: {
    marginTop: 2,
    fontSize: 11,
    color: '#059669',
  },
  remarksText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: '#065f46',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  attachmentSize: {
    fontSize: 11,
    color: '#94a3b8',
  },
});
