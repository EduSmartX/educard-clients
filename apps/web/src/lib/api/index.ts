/**
 * API Services Index
 *
 * Centralized exports for all API services.
 * Import from here instead of individual files for better organization.
 *
 * @example
 * import { authApi, studentApi } from '@/lib/api';
 */

// Re-export API client
export { default as api } from './api';

// Re-export API services
export * from './auth-api';
export * from './student-api';
export * from './otp-api';
export * from './organization-api';

// TODO: Add more API services as they are created
// export * from './teacher-api';
// export * from './class-api';
// export * from './api/subject-api';
// export * from './api/attendance-api';
// export * from './api/leave-api';
// export * from './api/organization-api';
