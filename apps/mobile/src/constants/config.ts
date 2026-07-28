/**
 * Application configuration constants (React Native CLI).
 * Env values come from react-native-config (.env files selected via ENVFILE).
 */

import Config from 'react-native-config';
import { Platform } from 'react-native';

const devFallback =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';

// API Configuration
export const API_CONFIG = {
  BASE_URL: (Config.API_URL ?? devFallback).trim(),
  TIMEOUT: 30000,
  DEFAULT_PAGE_SIZE: 15,
} as const;

/**
 * Resolve a media/attachment path from the backend to a full URL.
 */
export function getMediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const serverOrigin = API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');
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
  STUDENT: 'student',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
