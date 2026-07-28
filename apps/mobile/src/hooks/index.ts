/**
 * Custom Hooks Index (data-layer slice)
 * Entity hooks live in @/features/{entity} — import from there directly.
 * More mobile hooks are added here as screens are migrated.
 */

// Shared hooks
export { useDebounce } from '@educard/shared';

// Mobile-specific hooks
export {
  useMyProfilePhoto,
  useUserProfile,
  useUpdateProfile,
  useInvalidateProfilePhoto,
  useProfileImageUrl,
} from './useProfile';
export { useResponsive, rs, type ResponsiveInfo } from './useResponsive';
export { useDeleteConfirm } from './useDeleteConfirm';
export { useActionConfirm } from './useActionConfirm';
export { useListScroll } from './useListScroll';
export { useDeletedDuplicateHandler } from './useDeletedDuplicateHandler';
export { useFormErrors, type FormErrors } from './useFormErrors';
