/**
 * Announcements API
 * Endpoints for creating/sending and listing school announcements.
 */

import api from '@/lib/api';
import type {
  AnnouncementDetail,
  AnnouncementListItem,
  AnnouncementStatus,
  CreateAnnouncementPayload,
  DeliveryMethod,
  RecipientType,
} from '../types';

const BASE_URL = '/notifications/announcements';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta;
}

export interface Paginated<T> {
  items: T[];
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

export interface RecipientAnnouncement {
  public_id: string;
  subject: string;
  event_name: string | null;
  event_date: string | null;
  delivery_methods: DeliveryMethod;
  sent_at: string | null;
  created_at: string;
}

export interface RecipientAnnouncementDetail extends RecipientAnnouncement {
  body_html: string;
  event_note: string | null;
}

/** Server-side filters; empty values are omitted from the request. */
export interface AnnouncementFilterParams {
  search?: string;
  delivery_methods?: DeliveryMethod;
  recipient_type?: RecipientType;
  status?: AnnouncementStatus;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

function toQueryParams(filters: AnnouncementFilterParams = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => (value ?? '').toString().trim() !== '')
  ) as Record<string, string>;
}

export async function fetchRecipientAnnouncements(
  filters: AnnouncementFilterParams = {}
): Promise<Paginated<RecipientAnnouncement>> {
  const response = await api.get<PaginatedResponse<RecipientAnnouncement>>(`${BASE_URL}/`, {
    params: toQueryParams(filters),
  });
  return {
    items: response.data.data ?? [],
    pagination: response.data.pagination ?? EMPTY_PAGINATION,
  };
}

export async function fetchRecipientAnnouncementDetail(
  publicId: string
): Promise<RecipientAnnouncementDetail> {
  const response = await api.get<ApiResponse<RecipientAnnouncementDetail>>(
    `${BASE_URL}/${publicId}/`
  );
  return response.data.data;
}

export async function fetchAnnouncements(
  filters: AnnouncementFilterParams = {}
): Promise<Paginated<AnnouncementListItem>> {
  const response = await api.get<PaginatedResponse<AnnouncementListItem>>(`${BASE_URL}/`, {
    params: toQueryParams(filters),
  });
  return {
    items: response.data.data ?? [],
    pagination: response.data.pagination ?? EMPTY_PAGINATION,
  };
}

export async function fetchAnnouncementDetail(publicId: string): Promise<AnnouncementDetail> {
  const response = await api.get<ApiResponse<AnnouncementDetail>>(`${BASE_URL}/${publicId}/`);
  return response.data.data;
}

function buildAnnouncementFormData(payload: CreateAnnouncementPayload): FormData {
  const { attachments, class_ids, ...rest } = payload;
  const formData = new FormData();

  formData.append('subject', rest.subject);
  formData.append('delivery_methods', rest.delivery_methods);
  formData.append('recipient_type', rest.recipient_type);
  formData.append('body_html', rest.body_html ?? '');
  formData.append('event_name', rest.event_name ?? '');
  formData.append('event_note', rest.event_note ?? '');
  formData.append('manual_emails', rest.manual_emails ?? '');
  if (rest.event_date) {
    formData.append('event_date', rest.event_date);
  }
  (class_ids ?? []).forEach((id) => formData.append('class_ids', id));
  (attachments ?? []).forEach((file) => formData.append('attachments', file));

  return formData;
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<{ public_id: string }> {
  const hasAttachments = (payload.attachments?.length ?? 0) > 0;

  if (hasAttachments) {
    const formData = buildAnnouncementFormData(payload);
    const response = await api.post<ApiResponse<{ public_id: string }>>(`${BASE_URL}/`, formData, {
      headers: { 'Content-Type': undefined },
    });
    return response.data.data;
  }

  const { attachments: _attachments, ...jsonPayload } = payload;
  const response = await api.post<ApiResponse<{ public_id: string }>>(`${BASE_URL}/`, jsonPayload);
  return response.data.data;
}

export async function retryAnnouncement(publicId: string): Promise<{ public_id: string }> {
  const response = await api.post<ApiResponse<{ public_id: string }>>(`${BASE_URL}/retry/`, {
    public_id: publicId,
  });
  return response.data.data;
}
