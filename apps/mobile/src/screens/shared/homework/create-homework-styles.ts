import { Colors } from '@educard/shared';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  flex1: { flex: 1 },
  bottomSpacer: { height: 100 },

  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 10,
  },
  sectionTitleError: {
    color: '#dc2626',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: Colors.primary[500],
  },
  chipError: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  chipTextSelected: {
    color: '#fff',
  },
  ctBadge: {
    marginLeft: 6,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ctText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350f',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 10,
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    borderWidth: 2,
    backgroundColor: '#fef2f2',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: Colors.gray[800],
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: Colors.gray[800],
    borderWidth: 1,
    borderColor: Colors.gray[200],
    minHeight: 80,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeRow: {
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[600],
    marginBottom: 6,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  priorityChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  readonlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 10,
  },
  readonlyText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  errorField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 10,
  },
  errorFieldText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
  },
});
