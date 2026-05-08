/**
 * Button Style Constants
 * Centralized button styling presets for consistent UI across the app
 */

// ============================================================================
// Button Style Presets
// ============================================================================

export const BUTTON_STYLES = {
  // Primary actions - gradient with shadow
  primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
  
  // Secondary actions - subtle gray
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-all duration-200',
  
  // Danger/Delete actions - red gradient
  danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50 hover:from-red-600 hover:to-rose-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
  
  // Success actions - green gradient
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/50 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
  
  // Warning actions - amber gradient
  warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50 hover:from-amber-600 hover:to-orange-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
  
  // Info actions - blue gradient
  info: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200',
  
  // Outline variants
  primaryOutline: 'border-2 border-emerald-500 text-emerald-600 bg-white hover:bg-emerald-50 hover:border-emerald-600 transition-all duration-200',
  dangerOutline: 'border-2 border-red-500 text-red-600 bg-white hover:bg-red-50 hover:border-red-600 transition-all duration-200',
  secondaryOutline: 'border-2 border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200',
  
  // Ghost variants
  ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200',
  ghostDanger: 'text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200',
} as const;

export type ButtonStyleType = keyof typeof BUTTON_STYLES;
