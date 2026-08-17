/**
 * API client for the feedback module (feedback entries + product reviews).
 */
import apiClient from '@/lib/api';
import {
  API_ENDPOINTS,
  type ApiDetailResponse,
  type ApiListResponse,
  type Feedback,
  type FeedbackQueryParams,
  type Review,
  type ReviewPayload,
} from '@educard/shared';

export interface CreateFeedbackPayload {
  feedback_type: string;
  module?: string;
  subject: string;
  description: string;
  attachments?: File[];
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
    formData.append('attachments', file);
  }

  return formData;
}

export async function createFeedback(
  payload: CreateFeedbackPayload
): Promise<ApiDetailResponse<Feedback>> {
  const hasAttachments = (payload.attachments?.length ?? 0) > 0;

  if (hasAttachments) {
    const response = await apiClient.post(
      API_ENDPOINTS.FEEDBACK.CREATE,
      buildFeedbackFormData(payload),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  const { attachments: _attachments, ...jsonPayload } = payload;
  const response = await apiClient.post(API_ENDPOINTS.FEEDBACK.CREATE, jsonPayload);
  return response.data;
}

export async function fetchFeedbackList(
  params?: FeedbackQueryParams
): Promise<ApiListResponse<Feedback>> {
  const response = await apiClient.get(API_ENDPOINTS.FEEDBACK.LIST, { params });
  return response.data;
}

export async function fetchMyReview(): Promise<ApiDetailResponse<Review | null>> {
  const response = await apiClient.get(API_ENDPOINTS.FEEDBACK.REVIEWS.ME);
  return response.data;
}

export async function submitReview(payload: ReviewPayload): Promise<ApiDetailResponse<Review>> {
  const response = await apiClient.post(API_ENDPOINTS.FEEDBACK.REVIEWS.CREATE, payload);
  return response.data;
}
