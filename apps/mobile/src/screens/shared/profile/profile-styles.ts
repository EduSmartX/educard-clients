/**
 * Styles for ProfileScreen (Edit Profile)
 */

import { StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16 },

  spacer: { width: 40 },
  flex1: { flex: 1 },
  bottomSpacer: { height: 40 },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },

  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },

  avatarSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: { fontSize: 40, fontWeight: '700', color: '#fff' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
    marginTop: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formFields: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },

  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },

  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  readOnlyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
  },

  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  addressHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressFields: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
});
