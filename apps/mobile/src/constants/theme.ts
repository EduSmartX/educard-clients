/**
 * Design System Theme Constants
 *
 * Centralized design tokens for consistent UI across the app.
 * Use these constants instead of hardcoded values.
 *
 * @example
 * import { Theme } from '@/constants/theme';
 *
 * const styles = StyleSheet.create({
 *   card: { backgroundColor: Theme.colors.surface.card },
 *   button: { backgroundColor: Theme.colors.button.primary },
 * });
 */

import { Colors } from '@educard/shared';

// =============================================================================
// SEMANTIC COLORS
// Map design tokens to Tailwind-like color names for consistency
// =============================================================================

export const SemanticColors = {
  // Backgrounds
  background: {
    primary: '#f8fafc', // slate-50: Main app background
    secondary: '#f1f5f9', // slate-100: Secondary background
    tertiary: '#e2e8f0', // slate-200: Tertiary/muted background
    white: '#ffffff', // Pure white
  },

  // Surface colors (cards, modals, etc.)
  surface: {
    card: '#ffffff',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text colors
  text: {
    primary: '#1e293b', // slate-800: Primary text
    secondary: '#64748b', // slate-500: Secondary text
    tertiary: '#94a3b8', // slate-400: Tertiary/muted text
    inverse: '#ffffff', // White text on dark backgrounds
    disabled: '#cbd5e1', // slate-300: Disabled text
  },

  // Border colors
  border: {
    light: '#f1f5f9', // slate-100
    default: '#e2e8f0', // slate-200
    strong: '#cbd5e1', // slate-300
  },

  // Button colors
  button: {
    primary: '#7c3aed', // violet-600: Primary action buttons
    secondary: '#f1f5f9', // slate-100: Secondary buttons
    success: '#059669', // emerald-600: Success/Approve buttons
    danger: '#dc2626', // red-600: Danger/Reject buttons
    warning: '#f59e0b', // amber-500: Warning buttons
    info: '#3b82f6', // blue-500: Info buttons
    disabled: '#94a3b8', // slate-400: Disabled buttons
  },

  // Status colors
  status: {
    success: {
      bg: '#dcfce7', // green-100
      text: '#16a34a', // green-600
      border: '#86efac', // green-300
    },
    error: {
      bg: '#fee2e2', // red-100
      text: '#dc2626', // red-600
      border: '#fca5a5', // red-300
    },
    warning: {
      bg: '#fef3c7', // amber-100
      text: '#d97706', // amber-600
      border: '#fcd34d', // amber-300
    },
    info: {
      bg: '#dbeafe', // blue-100
      text: '#1d4ed8', // blue-700
      border: '#93c5fd', // blue-300
    },
    neutral: {
      bg: '#f1f5f9', // slate-100
      text: '#64748b', // slate-500
      border: '#e2e8f0', // slate-200
    },
  },

  // Stat/Analytics card backgrounds
  stats: {
    blue: '#eff6ff', // blue-50
    green: '#dcfce7', // green-100
    red: '#fee2e2', // red-100
    yellow: '#fef3c7', // amber-100
    purple: '#f5f3ff', // violet-50
    pink: '#fce7f3', // pink-100
    indigo: '#eef2ff', // indigo-50
  },

  // Chip/Badge colors
  chip: {
    purple: {
      bg: '#ede9fe', // violet-100
      text: '#7c3aed', // violet-600
    },
    blue: {
      bg: '#dbeafe', // blue-100
      text: '#2563eb', // blue-600
    },
    green: {
      bg: '#dcfce7', // green-100
      text: '#16a34a', // green-600
    },
    red: {
      bg: '#fee2e2', // red-100
      text: '#dc2626', // red-600
    },
    yellow: {
      bg: '#fef3c7', // amber-100
      text: '#d97706', // amber-600
    },
    gray: {
      bg: '#f1f5f9', // slate-100
      text: '#64748b', // slate-500
    },
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
  // Common specific values
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

// Export individual parts for convenient imports
export default Theme;
