import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFeedback,
  fetchFeedbackList,
  fetchMyReview,
  submitReview,
  type CreateFeedbackPayload,
} from '../api/feedback-api';
import type { FeedbackQueryParams } from '@educard/shared';

export const feedbackKeys = {
  all: ['feedback'] as const,
  list: (params?: FeedbackQueryParams) => [...feedbackKeys.all, 'list', params] as const,
  myReview: () => [...feedbackKeys.all, 'my-review'] as const,
};

export function useFeedbackList(params?: FeedbackQueryParams) {
  return useQuery({
    queryKey: feedbackKeys.list(params),
    queryFn: () => fetchFeedbackList(params),
    refetchOnMount: 'always',
  });
}

export function useMyReview() {
  return useQuery({
    queryKey: feedbackKeys.myReview(),
    queryFn: fetchMyReview,
    refetchOnMount: 'always',
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
