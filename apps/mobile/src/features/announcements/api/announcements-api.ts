import { apiClient } from '@/api/client';

import {
  ANNOUNCEMENT_DELIVERY_METHODS,
  ANNOUNCEMENT_RECIPIENT_TYPES,
  type AnnouncementDetail,
  type AnnouncementListItem,
} from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE_URL = '/notifications/announcements';

export interface CreateAnnouncementPayload {
  subject: string;
  body_html: string;
  delivery_methods:
    | typeof ANNOUNCEMENT_DELIVERY_METHODS.EMAIL
    | typeof ANNOUNCEMENT_DELIVERY_METHODS.SMS;
  recipient_type:
    | typeof ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS
    | typeof ANNOUNCEMENT_RECIPIENT_TYPES.ALL_STUDENTS
    | typeof ANNOUNCEMENT_RECIPIENT_TYPES.ALL_TEACHERS
    | typeof ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS
    | typeof ANNOUNCEMENT_RECIPIENT_TYPES.SPECIFIC_CLASSES
    | typeof ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS;
  event_name?: string;
  event_date?: string;
  event_note?: string;
  manual_emails?: string;
}

export async function getAnnouncements(): Promise<AnnouncementListItem[]> {
  const response = await apiClient.get<ApiResponse<AnnouncementListItem[]>>(
    `${BASE_URL}/`,
  );
  return response.data.data;
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<{ public_id: string }> {
  const response = await apiClient.post<ApiResponse<{ public_id: string }>>(
    `${BASE_URL}/`,
    payload,
  );
  return response.data.data;
}

export async function getAnnouncementDetail(
  publicId: string,
): Promise<AnnouncementDetail> {
  const response = await apiClient.get<ApiResponse<AnnouncementDetail>>(
    `${BASE_URL}/${publicId}/`,
  );
  return response.data.data;
}

export async function retryAnnouncement(
  publicId: string,
): Promise<{ public_id: string }> {
  const response = await apiClient.post<ApiResponse<{ public_id: string }>>(
    `${BASE_URL}/retry/`,
    {
      public_id: publicId,
    },
  );
  return response.data.data;
}
