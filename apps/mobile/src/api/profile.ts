/**
 * Profile API endpoints
 * Handles profile photo fetching from attachments API
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
