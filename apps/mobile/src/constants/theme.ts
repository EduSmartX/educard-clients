/**
 * Design System Theme Constants
 *
 * Centralized design tokens for consistent UI across the app.
 */

// =============================================================================
// SEMANTIC COLORS
// =============================================================================

export const SemanticColors = {
  background: {
    primary: '#f8fafc',
    secondary: '#f1f5f9',
    tertiary: '#e2e8f0',
    white: '#ffffff',
  },
  surface: {
    card: '#ffffff',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
    disabled: '#cbd5e1',
  },
  border: {
    light: '#f1f5f9',
    default: '#e2e8f0',
    strong: '#cbd5e1',
  },
  button: {
    primary: '#7c3aed',
    secondary: '#f1f5f9',
    success: '#059669',
    danger: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
    disabled: '#94a3b8',
  },
  status: {
    success: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
    error: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
    warning: { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
    info: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    neutral: { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  },
  stats: {
    blue: '#eff6ff',
    green: '#dcfce7',
    red: '#fee2e2',
    yellow: '#fef3c7',
    purple: '#f5f3ff',
    pink: '#fce7f3',
    indigo: '#eef2ff',
  },
  chip: {
    purple: { bg: '#ede9fe', text: '#7c3aed' },
    blue: { bg: '#dbeafe', text: '#2563eb' },
    green: { bg: '#dcfce7', text: '#16a34a' },
    red: { bg: '#fee2e2', text: '#dc2626' },
    yellow: { bg: '#fef3c7', text: '#d97706' },
    gray: { bg: '#f1f5f9', text: '#64748b' },
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  full: 9999,
  button: 10,
  card: 14,
  chip: 20,
  avatar: {
    sm: 18,
    md: 25,
    lg: 40,
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const Typography = {
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 32,
  },
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// =============================================================================
// ICON SIZES
// =============================================================================

export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
} as const;

// =============================================================================
// COMPONENT SIZES
// =============================================================================

export const ComponentSize = {
  button: {
    sm: { height: 36, paddingHorizontal: 12 },
    md: { height: 44, paddingHorizontal: 16 },
    lg: { height: 52, paddingHorizontal: 20 },
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
  },
  iconButton: {
    sm: { width: 32, height: 32 },
    md: { width: 38, height: 38 },
    lg: { width: 44, height: 44 },
  },
  avatar: {
    sm: { width: 36, height: 36 },
    md: { width: 50, height: 50 },
    lg: { width: 80, height: 80 },
  },
} as const;

// =============================================================================
// COMBINED THEME EXPORT
// =============================================================================

export const Theme = {
  colors: SemanticColors,
  spacing: Spacing,
  borderRadius: BorderRadius,
  typography: Typography,
  shadows: Shadows,
  iconSize: IconSize,
  componentSize: ComponentSize,
} as const;

export default Theme;
