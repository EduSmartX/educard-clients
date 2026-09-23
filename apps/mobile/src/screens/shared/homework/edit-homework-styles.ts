import { Colors } from '@educard/shared';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  flex1: { flex: 1 },
  bottomSpacer: { height: 100 },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: Colors.gray[400],
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  goBackBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
  },
  goBackBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  chipTextSelected: {
    color: '#fff',
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
  existingAttachments: {
    gap: 8,
  },
  existingAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  existingAttachmentText: {
    fontSize: 13,
    color: Colors.gray[600],
  },
});
