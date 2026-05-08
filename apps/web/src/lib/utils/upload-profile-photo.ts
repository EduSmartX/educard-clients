/**
 * Profile Photo Upload Utility
 *
 * Helper function to upload a profile photo for a user by their public_id.
 * Used by teacher/student forms to upload photo after entity creation.
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export async function uploadProfilePhotoForUser(userPublicId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image_type', 'profile_photo');

  await api.post(API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
