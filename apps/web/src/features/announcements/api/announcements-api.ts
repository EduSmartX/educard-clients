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
}

function toQueryParams(filters: AnnouncementFilterParams = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => (value ?? '').toString().trim() !== '')
  ) as Record<string, string>;
}

export async function fetchRecipientAnnouncements(
  filters: AnnouncementFilterParams = {}
): Promise<RecipientAnnouncement[]> {
  const response = await api.get<ApiResponse<RecipientAnnouncement[]>>(`${BASE_URL}/`, {
    params: toQueryParams(filters),
  });
  return response.data.data;
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
): Promise<AnnouncementListItem[]> {
  const response = await api.get<ApiResponse<AnnouncementListItem[]>>(`${BASE_URL}/`, {
    params: toQueryParams(filters),
  });
  return response.data.data;
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
