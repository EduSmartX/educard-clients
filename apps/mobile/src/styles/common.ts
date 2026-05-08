/**
 * Common Styles
 * Reusable style patterns across the app
 */

import { Colors, getRoleThemeColors } from '@educard/shared';
import { StyleSheet } from 'react-native';

import { Theme } from '@/constants/theme';

const adminTheme = getRoleThemeColors('admin');

// Common Layout Styles
export const layoutStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background.primary },
  centered: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

// Card Styles
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface.card,
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    ...Theme.shadows.md,
  },
});

// Avatar Styles
export const avatarStyles = StyleSheet.create({
  container: { marginRight: Theme.spacing.md },
  small: {
    width: Theme.componentSize.avatar.sm.width,
    height: Theme.componentSize.avatar.sm.height,
    borderRadius: Theme.borderRadius.avatar.sm,
  },
  medium: {
    width: Theme.componentSize.avatar.md.width,
    height: Theme.componentSize.avatar.md.height,
    borderRadius: Theme.borderRadius.avatar.md,
  },
  large: {
    width: Theme.componentSize.avatar.lg.width,
    height: Theme.componentSize.avatar.lg.height,
    borderRadius: Theme.borderRadius.avatar.lg,
  },
  placeholder: {
    backgroundColor: Theme.colors.background.secondary,
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
