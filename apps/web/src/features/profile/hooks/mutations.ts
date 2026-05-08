/**
 * Profile Mutations
 * React Query mutation hooks for profile updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  changePassword,
  deleteMyProfilePhoto,
  sendOTP,
  updateEmail,
  updatePhone,
  updateProfile,
  uploadMyProfilePhoto,
} from '../api/profile-api';
import { authApi } from '@/lib/api/auth-api';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, SuccessMessages } from '@/constants';
import type {
  ChangePasswordPayload,
  SendOTPPayload,
  UpdateEmailPayload,
  UpdatePhonePayload,
  UpdateProfilePayload,
} from '../types/profile.types';

/**
 * Hook to update profile information (including address)
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'me'] });
      toast.success(SuccessMessages.PROFILE.UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.UPDATE_FAILED);
    },
  });
}

/**
 * Hook to change password with cross-tab logout
 */
export function useChangePassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    onSuccess: async () => {
      toast.success(SuccessMessages.PROFILE.PASSWORD_CHANGED);

      // Wait a moment for user to see the message
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Logout (clears localStorage)
      await authApi.logout();

      // Trigger storage event for cross-tab logout
      window.localStorage.setItem('logout-event', Date.now().toString());
      window.localStorage.removeItem('logout-event');

      // Navigate to login
      navigate(ROUTES.AUTH.LOGIN, { replace: true });

      // Force reload to clear any cached state
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.CHANGE_PASSWORD_FAILED);
    },
  });
}

/**
 * Hook to send OTP
 */
export function useSendOTP() {
  return useMutation({
    mutationFn: (payload: SendOTPPayload) => sendOTP(payload),
    onSuccess: (data) => {
      toast.success(data.data?.message || SuccessMessages.PROFILE.OTP_SENT);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.SEND_OTP_FAILED);
    },
  });
}

/**
 * Hook to update email with OTP
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateEmailPayload) => updateEmail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'me'] });
      toast.success(SuccessMessages.PROFILE.EMAIL_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.UPDATE_EMAIL_FAILED);
    },
  });
}

/**
 * Hook to update phone with OTP
 */
export function useUpdatePhone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePhonePayload) => updatePhone(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'me'] });
      toast.success(SuccessMessages.PROFILE.PHONE_UPDATED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.UPDATE_PHONE_FAILED);
    },
  });
}

// Deprecated - kept for backwards compatibility
export const useUpdateAddress = useUpdateProfile;

// Profile Photo Mutations

/**
 * Hook to upload own profile photo
 */
export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadMyProfilePhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-photo', 'me'] });
      toast.success(SuccessMessages.PROFILE.PHOTO_UPLOADED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.PHOTO_UPLOAD_FAILED);
    },
  });
}

/**
 * Hook to delete own profile photo
 */
export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteMyProfilePhoto(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-photo', 'me'] });
      toast.success(SuccessMessages.PROFILE.PHOTO_DELETED);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.PROFILE.PHOTO_DELETE_FAILED);
    },
  });
}
