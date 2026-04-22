// API Client
export { default as apiClient, clearAuthTokens } from './client';

// Error handling (from shared)
export { 
  parseApiError, 
  parseError, 
  getErrorMessage, 
  getFieldErrors, 
  isValidationError,
  isNetworkError,
  getErrorTitle,
} from '@educard/shared';

// API modules (non-entity — auth, org, profile)
export * from './auth';
export * from './otp';
export * from './organization';
export * from './profile';

// Entity APIs now live in @/features/{entity} — import from there directly
