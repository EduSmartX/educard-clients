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

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface AnnouncementFilterParams {
  search?: string;
  delivery_methods?: string;
  recipient_type?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
}

export interface PaginatedAnnouncements {
  items: AnnouncementListItem[];
  pagination: PaginationMeta;
}

const EMPTY_PAGINATION: PaginationMeta = {
  current_page: 1,
  total_pages: 1,
  count: 0,
  page_size: 25,
  has_next: false,
  has_previous: false,
};

export async function getAnnouncements(
  filters: AnnouncementFilterParams = {},
): Promise<PaginatedAnnouncements> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => (value ?? '').toString().trim() !== '',
    ),
  );
  const response = await apiClient.get<
    ApiResponse<AnnouncementListItem[]> & { pagination?: PaginationMeta }
  >(`${BASE_URL}/`, { params });
  return {
    items: response.data.data ?? [],
    pagination: response.data.pagination ?? EMPTY_PAGINATION,
  };
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
