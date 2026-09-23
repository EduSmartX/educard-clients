/**
 * Profile Feature Exports
 * Central export point for profile feature
 */

// Pages
export { default as ProfilePage } from './pages/profile-page';

// Components
export { ProfilePhotoUpload } from './components/profile-photo-upload';
export { ProfileInformationForm } from './components/profile-information-form';
export { PasswordChangeForm } from './components/password-change-form';
export { EmailUpdateForm } from './components/email-update-form';
export { PhoneUpdateForm } from './components/phone-update-form';
export { AddressUpdateForm } from './components/address-update-form';

// Hooks
export { useUserProfile, useMyProfilePhoto } from './hooks/queries';
export {
  useUpdateProfile,
  useUpdateAddress,
  useChangePassword,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
} from './hooks/mutations';

// Types
export type {
  UserProfile,
  ProfileImage,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UpdateAddressPayload,
} from './types/profile.types';

// Schemas
export {
  profileInformationSchema,
  passwordChangeSchema,
  addressUpdateSchema,
  type ProfileInformationFormData,
  type PasswordChangeFormData,
  type AddressUpdateFormData,
} from './schemas/profile-schemas';
