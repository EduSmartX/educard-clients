/**
 * Profile API
 * API functions for profile management
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type {
  ApiResponse,
  ChangePasswordPayload,
  ProfileImage,
  SendOTPPayload,
  UpdateEmailPayload,
  UpdatePhonePayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types/profile.types';

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  const response = await api.get<ApiResponse<UserProfile>>('/users/profile/me/');
  return response.data;
}

/**
 * Update user profile information (including address)
 */
export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<ApiResponse<UserProfile>> {
  const response = await api.patch<ApiResponse<UserProfile>>('/users/profile/me/', payload);
  return response.data;
}

/**
 * Change password
 */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ApiResponse<{ message: string }>> {
  const response = await api.post<ApiResponse<{ message: string }>>(
    '/auth/change-password/',
    payload
  );
  return response.data;
}

/**
 * Send OTP for email/phone verification
 */
export async function sendOTP(
  payload: SendOTPPayload
): Promise<ApiResponse<{ message: string; expires_in_minutes: number }>> {
  const response = await api.post<ApiResponse<{ message: string; expires_in_minutes: number }>>(
    '/users/send-otp/',
    payload
  );
  return response.data;
}

/**
 * Update email with OTP verification
 */
export async function updateEmail(payload: UpdateEmailPayload): Promise<ApiResponse<UserProfile>> {
  const response = await api.post<ApiResponse<UserProfile>>('/users/update-email/', payload);
  return response.data;
}

/**
 * Update phone with OTP verification
 */
export async function updatePhone(payload: UpdatePhonePayload): Promise<ApiResponse<UserProfile>> {
  const response = await api.post<ApiResponse<UserProfile>>('/users/update-phone/', payload);
  return response.data;
}

// Profile Photo APIs

/**
 * Get current user's profile photo
 */
export async function getMyProfilePhoto(): Promise<ApiResponse<ProfileImage | null>> {
  const response = await api.get<ApiResponse<ProfileImage | null>>(
    API_ENDPOINTS.ATTACHMENTS.MY_PHOTO
  );
  return response.data;
}

/**
 * Upload own profile photo
 */
export async function uploadMyProfilePhoto(file: File): Promise<ApiResponse<ProfileImage>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image_type', 'profile_photo');

  const response = await api.post<ApiResponse<ProfileImage>>(
    API_ENDPOINTS.ATTACHMENTS.MY_PHOTO_UPLOAD,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

/**
 * Delete own profile photo
 */
export async function deleteMyProfilePhoto(): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(API_ENDPOINTS.ATTACHMENTS.MY_PHOTO);
  return response.data;
}
