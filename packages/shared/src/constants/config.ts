/**
 * Shared Constants - Config
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  TIMEOUT: 30000,
  DEFAULT_PAGE_SIZE: 15,
} as const;

// App Info
export const APP_INFO = {
  NAME: 'EduCard',
  VERSION: '1.0.0',
  DESCRIPTION: 'Smart School Management',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  ONBOARDING_COMPLETE: 'onboardingComplete',
} as const;

// Web Route paths
export const WEB_ROUTES = {
  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Students
  STUDENTS: '/students',
  STUDENT_DETAIL: '/students/:id',
  
  // Attendance
  ATTENDANCE: '/attendance',
  
  // Marks
  MARKS: '/marks',
  
  // Fees
  FEES: '/fees',
  
  // Settings
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;

// Mobile Route paths (Expo Router)
export const MOBILE_ROUTES = {
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

