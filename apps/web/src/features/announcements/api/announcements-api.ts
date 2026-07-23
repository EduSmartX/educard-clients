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
