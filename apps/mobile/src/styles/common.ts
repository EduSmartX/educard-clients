/**
 * Common Styles
 * Reusable style patterns across the app
 */

import { Colors, getRoleThemeColors } from '@educard/shared';
import { StyleSheet } from 'react-native';

const adminTheme = getRoleThemeColors('admin');

// Common Layout Styles
export const layoutStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

// Screen Body — used by nearly every admin screen
export const bodyStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  contentLarge: { padding: 16, paddingBottom: 60 },
});

// Card Styles — the universal white card
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLarge: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
});

// Divider
export const dividerStyles = StyleSheet.create({
  thin: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  spaced: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
});

// Section Title — uppercase label above card groups
export const sectionTitleStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  labelCompact: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
});

// Form Field Styles — label + input used by create/edit/profile screens
export const formFieldStyles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  fieldRow: { flexDirection: 'row', gap: 10 },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  eyeBtn: { paddingHorizontal: 12 },
});

// Chip / Filter Pill Styles
export const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0' },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#7c3aed' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#fff' },
});

// Primary Action Button
export const buttonStyles = StyleSheet.create({
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  primaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  disabled: { opacity: 0.5 },
});

// Tab Navigation Row
export const tabStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#7c3aed' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#7c3aed' },
});

// Empty / Loading / Note States
export const emptyStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#334155' },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 6,
  },
});

export const noteStyles = StyleSheet.create({
  info: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginTop: 12 },
  infoText: { fontSize: 13, color: '#1d4ed8', lineHeight: 18, textAlign: 'center' },
  warning: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginTop: 8 },
  warningText: { fontSize: 13, color: '#92400e', lineHeight: 18, textAlign: 'center' },
  muted: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, marginTop: 20 },
  mutedText: { fontSize: 12, color: '#94a3b8', lineHeight: 18, textAlign: 'center' },
});

// Password Requirement Item
export const reqStyles = StyleSheet.create({
  container: { marginTop: 14, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 12, color: '#94a3b8' },
  textMet: { color: '#16a34a' },
});

// Avatar Styles
export const avatarStyles = StyleSheet.create({
  container: { marginRight: 12 },
  small: { width: 36, height: 36, borderRadius: 18 },
  medium: { width: 50, height: 50, borderRadius: 25 },
  large: { width: 80, height: 80, borderRadius: 40 },
  xlarge: { width: 88, height: 88, borderRadius: 44 },
  placeholder: {
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Header Styles (Gradient Headers)
export const headerStyles = StyleSheet.create({
  header: { paddingTop: 44, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  content: { zIndex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: { flex: 1, marginLeft: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Search Styles
export const searchStyles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  bar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  input: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.gray[900] },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
});

// Action Button Styles
export const actionBtnStyles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 6 },
  btn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  view: { backgroundColor: Colors.info[50] },
  edit: { backgroundColor: Colors.success[50] },
  delete: { backgroundColor: Colors.error[50] },
});

// State Styles (Loading, Error, Empty)
export const stateStyles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  loadingText: { fontSize: 14, color: Colors.gray[500], marginTop: 12 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.gray[500], marginTop: 12 },
  emptySubtext: { fontSize: 13, color: Colors.gray[400], marginTop: 4 },

  error: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  errorText: { fontSize: 16, fontWeight: '600', color: Colors.error[500], marginTop: 12 },
  errorSubtext: { fontSize: 13, color: Colors.gray[400], marginTop: 4 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: adminTheme.accent,
    borderRadius: 8,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

// List Styles
export const listStyles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
});

// Typography Styles
export const textStyles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '600', color: Colors.gray[900] },
  subtitle: { fontSize: 12, color: Colors.gray[500] },
  caption: { fontSize: 11, color: Colors.gray[500] },
  tag: { fontSize: 10, color: Colors.primary[600], fontWeight: '500' },
});
