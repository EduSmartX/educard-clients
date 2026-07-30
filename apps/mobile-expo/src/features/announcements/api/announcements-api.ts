import { apiClient } from '@/api/client';

import type { AnnouncementListItem } from '../types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE_URL = '/notifications/announcements';

export async function getAnnouncements(): Promise<AnnouncementListItem[]> {
  const response = await apiClient.get<ApiResponse<AnnouncementListItem[]>>(`${BASE_URL}/`);
  return response.data.data;
}

export async function retryAnnouncement(publicId: string): Promise<{ public_id: string }> {
  const response = await apiClient.post<ApiResponse<{ public_id: string }>>(`${BASE_URL}/retry/`, {
    public_id: publicId,
  });
  return response.data.data;
}
