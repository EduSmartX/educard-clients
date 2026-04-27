/**
 * Color constants for the app
 * Re-exports from shared and adds mobile-specific themes
 */

// Re-export colors from shared
// Import for local use
import { Colors } from '@educard/shared';

export { Colors, colors } from '@educard/shared';

// Light theme
export const LightTheme = {
  colors: {
    primary: Colors.primary[500],
    background: Colors.background.primary,
    card: Colors.background.primary,
    text: Colors.text.primary,
    border: Colors.border.light,
    notification: Colors.danger[500],
  },
};

// Dark theme
export const DarkTheme = {
  colors: {
    primary: Colors.primary[400],
    background: Colors.secondary[900],
    card: Colors.secondary[800],
    text: Colors.text.inverse,
    border: Colors.secondary[700],
    notification: Colors.danger[500],
  },
};

// Gray colors (alias for secondary)
export const gray = Colors.secondary;
