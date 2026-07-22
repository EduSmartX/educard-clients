/**
 * Profile API endpoints
 * Handles profile data and photo management
 */

import { API_ENDPOINTS } from '@/constants';

import { apiClient } from './client';

export interface ProfileImage {
  public_id: string;
  owner_type: string;
  image_type: string;
  mime_type: string;
  file_size: number;
  width: number;
  height: number;
  is_current: boolean;
  url: string;
  thumbnail_url: string;
  created_at: string;
}

export interface Address {
  id?: number;
  public_id?: string;
  address_type?: string;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

export interface UserProfile {
  public_id: string;
  username?: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  is_email_verified?: boolean;
  is_mobile_verified?: boolean;
  gender?: string;
  blood_group?: string;
  date_of_birth?: string;
  role: string;
  profile_image?: string;
  address?: Address;
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  organization_role?: {
    id: number;
    code: string;
    name: string;
  };
  notification_opt_in?: boolean;
  teacher_public_id?: string;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: string;
  blood_group?: string;
  date_of_birth?: string;
  organization_role?: string;
  notification_opt_in?: boolean;
  address?: {
    street_address?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    address_type?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Get current user's profile photo
 */
export async function getMyProfilePhoto(): Promise<ProfileImage | null> {
  try {
    const response = await apiClient.get<ApiResponse<ProfileImage | null>>(
      API_ENDPOINTS.ATTACHMENTS.MY_PHOTO
    );
    return response.data.data;
  } catch {
    return null;
  }
}

/**
 * Get current user's full profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await apiClient.get<ApiResponse<UserProfile>>('/users/profile/me/');
  return response.data.data;
}

/**
 * Update user profile information
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const response = await apiClient.patch<ApiResponse<UserProfile>>('/users/profile/me/', payload);
  return response.data.data;
}
