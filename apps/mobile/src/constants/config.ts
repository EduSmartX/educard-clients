/**
 * Application configuration constants
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the correct API URL based on platform and device type
const getDefaultApiUrl = () => {
  // If running in Expo Go on a physical device, we need the host machine's IP
  // Expo provides this in the manifest
  const expoHostUri = Constants.expoConfig?.hostUri;
  // Access manifest with type assertion for legacy support
  const manifest = Constants.manifest as { debuggerHost?: string } | undefined;
  const manifestDebugger = manifest?.debuggerHost;
  const debuggerHost = expoHostUri ?? manifestDebugger;

  if (debuggerHost) {
    // Extract IP from debuggerHost (format: "192.168.1.x:8081")
    const hostIp = debuggerHost.split(':')[0];
    return `http://${hostIp}:8000/api`;
  }

  // Fallback for Android emulator (10.0.2.2 maps to host localhost)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  // iOS simulator can use localhost
  return 'http://localhost:8000/api';
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: (process.env.EXPO_PUBLIC_API_URL as string | undefined)?.trim() ?? getDefaultApiUrl(),
  TIMEOUT: 30000,
  DEFAULT_PAGE_SIZE: 15,
} as const;

/**
 * Resolve a media/attachment path from the backend to a full URL.
 * Backend returns paths like "/media/attachments/..." — on mobile we need the full host.
 * Also handles Base64 data URIs (embed_images=true) which are returned directly.
 */
export function getMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  // Already a full URL, local file URI, or Base64 data URI (embed_images mode)
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  // Relative path — prepend the server host
  const baseUrl = API_CONFIG.BASE_URL; // e.g. "http://192.168.x.x:8000/api"
  const serverOrigin = baseUrl.replace(/\/api\/?$/, ''); // "http://192.168.x.x:8000"
  return `${serverOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
}

// App Info
export const APP_INFO = {
  NAME: 'EduCard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart School Management',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  ONBOARDING_COMPLETE: 'onboardingComplete',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  AUTH: ['auth'] as const,
  USER: ['user'] as const,
  STUDENTS: ['students'] as const,
  TEACHERS: ['teachers'] as const,
  CLASSES: ['classes'] as const,
  ATTENDANCE: ['attendance'] as const,
  EXAMS: ['exams'] as const,
  NOTIFICATIONS: ['notifications'] as const,
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  TEACHER: 'teacher',
  PARENT: 'parent',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Routes
export const ROUTES = {
  // Auth routes
  LOGIN: '/(auth)/login',
  SIGNUP: '/(auth)/signup',
  FORGOT_PASSWORD: '/(auth)/forgot-password',

  // Admin routes
  ADMIN_DASHBOARD: '/(tabs)/(admin)/dashboard',
  ADMIN_TEACHERS: '/(tabs)/(admin)/teachers',
  ADMIN_STUDENTS: '/(tabs)/(admin)/students',
  ADMIN_CLASSES: '/(tabs)/(admin)/classes',
  ADMIN_SETTINGS: '/(tabs)/(admin)/settings',

  // Employee routes
  EMPLOYEE_DASHBOARD: '/(tabs)/(employee)/dashboard',
  EMPLOYEE_ATTENDANCE: '/(tabs)/(employee)/attendance',
  EMPLOYEE_TIMETABLE: '/(tabs)/(employee)/timetable',
  EMPLOYEE_PROFILE: '/(tabs)/(employee)/profile',

  // Parent routes
  PARENT_DASHBOARD: '/(tabs)/(parent)/dashboard',
  PARENT_CHILDREN: '/(tabs)/(parent)/children',
  PARENT_ATTENDANCE: '/(tabs)/(parent)/attendance',
  PARENT_NOTIFICATIONS: '/(tabs)/(parent)/notifications',
} as const;
