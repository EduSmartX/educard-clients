/**
 * Attachment API helpers for form components.
 *
 * Used by teacher/student forms to upload a profile photo for a
 * managed user after the entity is created.
 */

import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

/**
 * Upload a profile photo for a user by public_id.
 * Used by parent forms after entity creation to upload the held file.
 */
export async function uploadProfilePhotoForUser(userPublicId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image_type', 'profile_photo');

  await api.post(API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
