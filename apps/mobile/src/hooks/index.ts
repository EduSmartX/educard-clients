/**
 * Custom Hooks Index
 * Entity hooks live in @/features/{entity} — import from there directly.
 * This file only exports mobile-specific hooks.
 */

// Shared hooks
export { useDebounce } from '@educard/shared';

// Mobile-specific hooks
export { useRefreshOnFocus } from './useRefreshOnFocus';
export { useMyProfilePhoto, useUserProfile, useUpdateProfile } from './useProfile';
export { useListScroll } from './useListScroll';
export { useDeleteConfirm } from './useDeleteConfirm';
export { useDeletedDuplicateHandler } from './useDeletedDuplicateHandler';
