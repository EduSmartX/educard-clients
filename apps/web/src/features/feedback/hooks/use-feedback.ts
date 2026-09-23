import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFeedback,
  fetchFeedbackDetail,
  fetchFeedbackList,
  fetchMyReview,
  fetchPublicReviews,
  fetchReviews,
  submitReview,
  type CreateFeedbackPayload,
  type ReviewQueryParams,
} from '../api/feedback-api';
import type { FeedbackQueryParams } from '@educard/shared';

export const feedbackKeys = {
  all: ['feedback'] as const,
  list: (params?: FeedbackQueryParams) => [...feedbackKeys.all, 'list', params] as const,
  detail: (id: string) => [...feedbackKeys.all, 'detail', id] as const,
  myReview: () => [...feedbackKeys.all, 'my-review'] as const,
  publicReviews: () => [...feedbackKeys.all, 'public-reviews'] as const,
  reviews: (params?: ReviewQueryParams) => [...feedbackKeys.all, 'reviews', params] as const,
};

export function useFeedbackList(params?: FeedbackQueryParams) {
  return useQuery({
    queryKey: feedbackKeys.list(params),
    queryFn: () => fetchFeedbackList(params),
    refetchOnMount: 'always',
  });
}

export function useFeedbackDetail(id: string) {
  return useQuery({
    queryKey: feedbackKeys.detail(id),
    queryFn: () => fetchFeedbackDetail(id),
    enabled: Boolean(id),
  });
}

export function useMyReview() {
  return useQuery({
    queryKey: feedbackKeys.myReview(),
    queryFn: fetchMyReview,
    refetchOnMount: 'always',
  });
}

/** Genuine, written reviews shown publicly on the home page (no auth required). */
export function usePublicReviews() {
  return useQuery({
    queryKey: feedbackKeys.publicReviews(),
    queryFn: fetchPublicReviews,
    staleTime: 5 * 60 * 1000,
  });
}

/** Reviews for the caller's organization (admin dashboard widget). */
export function useReviews(params?: ReviewQueryParams) {
  return useQuery({
    queryKey: feedbackKeys.reviews(params),
    queryFn: () => fetchReviews(params),
    staleTime: 60 * 1000,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => createFeedback(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.myReview() });
    },
  });
}
