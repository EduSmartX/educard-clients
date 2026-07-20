/**
 * Announcements API
 * Endpoints for creating/sending and listing school announcements.
 */

import api from '@/lib/api';
import type { AnnouncementListItem, CreateAnnouncementPayload } from '../types';

const BASE_URL = '/notifications/announcements';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchAnnouncements(): Promise<AnnouncementListItem[]> {
  const response = await api.get<ApiResponse<AnnouncementListItem[]>>(`${BASE_URL}/`);
  return response.data.data;
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<{ public_id: string }> {
  const response = await api.post<ApiResponse<{ public_id: string }>>(`${BASE_URL}/`, payload);
  return response.data.data;
}
