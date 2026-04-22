/**
 * Role-based Theme Configuration
 * Provides consistent color themes across web and mobile based on user roles
 */

import { Colors } from "./colors";

export type RoleTheme = "admin" | "teacher" | "parent" | "student";

export interface RoleThemeColors {
  // Primary gradient colors (for headers, buttons, etc.)
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;

  // Solid accent color
  accent: string;
  accentLight: string;
  accentDark: string;

  // Text colors for the theme
  subtitleText: string;

  // Icon backgrounds
  iconBg: string;
  iconColor: string;
}

export const roleThemeColors: Record<RoleTheme, RoleThemeColors> = {
  admin: {
    // Green/Teal/Emerald theme for Admin
    gradientStart: "#10b981", // emerald-500
    gradientMiddle: "#14b8a6", // teal-500
    gradientEnd: "#06b6d4", // cyan-500
    accent: "#10b981", // emerald-500
    accentLight: "#d1fae5", // emerald-100
    accentDark: "#059669", // emerald-600
    subtitleText: "rgba(167, 243, 208, 0.9)", // emerald-100
    iconBg: "#d1fae5", // emerald-100
    iconColor: "#059669", // emerald-600
  },
  teacher: {
    // Blue/Indigo theme for Teacher
    gradientStart: "#2563eb", // blue-600
    gradientMiddle: "#4f46e5", // indigo-600
    gradientEnd: "#7c3aed", // violet-600
    accent: "#2563eb", // blue-600
    accentLight: "#dbeafe", // blue-100
    accentDark: "#1d4ed8", // blue-700
    subtitleText: "rgba(191, 219, 254, 0.9)", // blue-100
    iconBg: "#dbeafe", // blue-100
    iconColor: "#2563eb", // blue-600
  },
  parent: {
    // Purple/Violet theme for Parent
    gradientStart: "#7c3aed", // violet-600
    gradientMiddle: "#9333ea", // purple-600
    gradientEnd: "#c026d3", // fuchsia-600
    accent: "#7c3aed", // violet-600
    accentLight: "#ede9fe", // violet-100
    accentDark: "#6d28d9", // violet-700
    subtitleText: "rgba(221, 214, 254, 0.9)", // violet-100
    iconBg: "#ede9fe", // violet-100
    iconColor: "#7c3aed", // violet-600
  },
  student: {
    // Orange/Amber theme for Student
    gradientStart: "#f97316", // orange-500
    gradientMiddle: "#f59e0b", // amber-500
    gradientEnd: "#eab308", // yellow-500
    accent: "#f97316", // orange-500
    accentLight: "#ffedd5", // orange-100
    accentDark: "#ea580c", // orange-600
    subtitleText: "rgba(254, 215, 170, 0.9)", // orange-100
    iconBg: "#ffedd5", // orange-100
    iconColor: "#ea580c", // orange-600
  },
};

/**
 * Get role type from user role string
 */
export function getRoleType(userRole?: string): RoleTheme {
  const role = userRole?.toLowerCase() || "";

  if (role.includes("admin") || role.includes("administrator")) {
    return "admin";
  }
  if (
    role.includes("teacher") ||
    role.includes("staff") ||
    role.includes("employee")
  ) {
    return "teacher";
  }
  if (role.includes("parent") || role.includes("guardian")) {
    return "parent";
  }
  if (role.includes("student")) {
    return "student";
  }

  return "admin"; // Default to admin theme
}

/**
 * Get theme colors for a given user role
 */
export function getRoleThemeColors(userRole?: string): RoleThemeColors {
  return roleThemeColors[getRoleType(userRole)];
}

/**
 * Get gradient array for LinearGradient components (React Native)
 */
export function getRoleGradient(
  userRole?: string,
): readonly [string, string, string] {
  const theme = getRoleThemeColors(userRole);
  return [
    theme.gradientStart,
    theme.gradientMiddle,
    theme.gradientEnd,
  ] as const;
}
