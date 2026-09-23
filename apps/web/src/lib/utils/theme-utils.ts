/**
 * Role-based Theme Utilities
 * Provides consistent color themes across the application based on user roles
 */

export type RoleTheme = 'admin' | 'teacher' | 'parent' | 'student';

export interface ThemeConfig {
  // Header colors
  headerBg: string;
  headerShadow: string;
  subtitleText: string;
  notificationRing: string;
  avatarGradient: string;
  // Sidebar active state
  sidebarActiveBg: string;
  sidebarActiveText: string;
  sidebarActiveShadow: string;
  // Mobile menu button
  mobileMenuBg: string;
  mobileMenuHover: string;
  mobileMenuShadow: string;
  // Main content background
  mainBgGradient: string;
  // Accent color for badges, etc.
  accentColor: string;
  accentBg: string;
}

export const roleThemes: Record<RoleTheme, ThemeConfig> = {
  admin: {
    // Green/Teal/Emerald theme for Admin (original colors)
    headerBg: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
    headerShadow: 'shadow-xl shadow-emerald-500/20',
    subtitleText: 'text-emerald-100',
    notificationRing: 'ring-emerald-600',
    avatarGradient: 'from-emerald-500 to-teal-600',
    sidebarActiveBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-md shadow-emerald-500/25',
    mobileMenuBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    mobileMenuHover: 'hover:from-emerald-600 hover:to-teal-600',
    mobileMenuShadow: 'shadow-lg shadow-emerald-500/25',
    mainBgGradient: 'bg-gradient-to-br from-slate-50 via-white to-emerald-50/30',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-100',
  },
  teacher: {
    // Blue/Indigo theme for Teacher
    headerBg: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600',
    headerShadow: 'shadow-xl shadow-blue-500/20',
    subtitleText: 'text-blue-100',
    notificationRing: 'ring-blue-600',
    avatarGradient: 'from-blue-500 to-indigo-600',
    sidebarActiveBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-md shadow-blue-500/25',
    mobileMenuBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    mobileMenuHover: 'hover:from-blue-700 hover:to-indigo-700',
    mobileMenuShadow: 'shadow-lg shadow-blue-500/25',
    mainBgGradient: 'bg-gradient-to-br from-slate-50 via-white to-blue-50/30',
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-100',
  },
  parent: {
    // Purple/Violet theme for Parent
    headerBg: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600',
    headerShadow: 'shadow-xl shadow-violet-500/20',
    subtitleText: 'text-violet-100',
    notificationRing: 'ring-violet-600',
    avatarGradient: 'from-violet-500 to-purple-600',
    sidebarActiveBg: 'bg-gradient-to-r from-violet-600 to-purple-600',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-md shadow-violet-500/25',
    mobileMenuBg: 'bg-gradient-to-r from-violet-600 to-purple-600',
    mobileMenuHover: 'hover:from-violet-700 hover:to-purple-700',
    mobileMenuShadow: 'shadow-lg shadow-violet-500/25',
    mainBgGradient: 'bg-gradient-to-br from-slate-50 via-white to-violet-50/30',
    accentColor: 'text-violet-600',
    accentBg: 'bg-violet-100',
  },
  student: {
    // Light Green/Lime theme for Student
    headerBg: 'bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500',
    headerShadow: 'shadow-xl shadow-lime-500/20',
    subtitleText: 'text-lime-100',
    notificationRing: 'ring-lime-600',
    avatarGradient: 'from-lime-500 to-green-600',
    sidebarActiveBg: 'bg-gradient-to-r from-lime-500 to-green-500',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-md shadow-lime-500/25',
    mobileMenuBg: 'bg-gradient-to-r from-lime-500 to-green-500',
    mobileMenuHover: 'hover:from-lime-600 hover:to-green-600',
    mobileMenuShadow: 'shadow-lg shadow-lime-500/25',
    mainBgGradient: 'bg-gradient-to-br from-slate-50 via-white to-lime-50/30',
    accentColor: 'text-lime-600',
    accentBg: 'bg-lime-100',
  },
};

/**
 * Helper function to determine role theme from userRole string
 */
export function getRoleTheme(userRole?: string): RoleTheme {
  const role = userRole?.toLowerCase() || '';

  if (role.includes('admin') || role.includes('administrator')) {
    return 'admin';
  }
  if (role.includes('teacher') || role.includes('staff') || role.includes('employee')) {
    return 'teacher';
  }
  if (role.includes('parent') || role.includes('guardian')) {
    return 'parent';
  }
  if (role.includes('student')) {
    return 'student';
  }

  return 'admin'; // Default to admin theme
}

/**
 * Get the theme config for a given user role
 */
export function getThemeConfig(userRole?: string): ThemeConfig {
  return roleThemes[getRoleTheme(userRole)];
}
