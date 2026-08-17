/**
 * Feedback API - feedback entries and product reviews
 */

import {
  API_ENDPOINTS,
  type ApiDetailResponse,
  type ApiListResponse,
  type Feedback,
  type FeedbackQueryParams,
  type Review,
  type ReviewPayload,
} from '@educard/shared';

import { apiClient } from '@/api/client';
import type { SelectedFile } from '@/components/forms';

export interface CreateFeedbackPayload {
  feedback_type: string;
  module?: string;
  subject: string;
  description: string;
  attachments?: SelectedFile[];
}

function buildFeedbackFormData(payload: CreateFeedbackPayload): FormData {
  const formData = new FormData();
  formData.append('feedback_type', payload.feedback_type);
  formData.append('subject', payload.subject);
  formData.append('description', payload.description);

  if (payload.module) {
    formData.append('module', payload.module);
  }

  for (const file of payload.attachments ?? []) {
    formData.append('attachments', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }

  return formData;
}

export async function createFeedback(
  payload: CreateFeedbackPayload,
): Promise<ApiDetailResponse<Feedback>> {
  if ((payload.attachments?.length ?? 0) > 0) {
    const response = await apiClient.post<ApiDetailResponse<Feedback>>(
      API_ENDPOINTS.FEEDBACK.CREATE,
      buildFeedbackFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  }

  const response = await apiClient.post<ApiDetailResponse<Feedback>>(
    API_ENDPOINTS.FEEDBACK.CREATE,
    {
      feedback_type: payload.feedback_type,
      module: payload.module,
      subject: payload.subject,
      description: payload.description,
    },
  );
  return response.data;
}

export async function getFeedbackList(
  params?: FeedbackQueryParams,
): Promise<ApiListResponse<Feedback>> {
  const response = await apiClient.get<ApiListResponse<Feedback>>(
    API_ENDPOINTS.FEEDBACK.LIST,
    { params },
  );
  return response.data;
}

export async function getMyReview(): Promise<ApiDetailResponse<Review | null>> {
  const response = await apiClient.get<ApiDetailResponse<Review | null>>(
    API_ENDPOINTS.FEEDBACK.REVIEWS.ME,
  );
  return response.data;
}

export async function submitReview(
  payload: ReviewPayload,
): Promise<ApiDetailResponse<Review>> {
  const response = await apiClient.post<ApiDetailResponse<Review>>(
    API_ENDPOINTS.FEEDBACK.REVIEWS.CREATE,
    payload,
  );
  return response.data;
}
