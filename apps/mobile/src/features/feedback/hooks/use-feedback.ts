import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeedbackQueryParams } from '@educard/shared';

import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { showToast } from '@/utils/toast';

import {
  createFeedback,
  getFeedbackList,
  getMyReview,
  submitReview,
  type CreateFeedbackPayload,
} from '../api/feedback-api';

export const feedbackKeys = {
  all: ['feedback'] as const,
  list: (params?: FeedbackQueryParams) =>
    [...feedbackKeys.all, 'list', params] as const,
  myReview: () => [...feedbackKeys.all, 'my-review'] as const,
};

export function useFeedbackList(params?: FeedbackQueryParams) {
  return useQuery({
    queryKey: feedbackKeys.list(params),
    queryFn: () => getFeedbackList(params),
    staleTime: 30_000,
  });
}

export function useMyReview() {
  return useQuery({
    queryKey: feedbackKeys.myReview(),
    queryFn: getMyReview,
    staleTime: 30_000,
  });
}

export function useCreateFeedback(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) => createFeedback(payload),
    onSuccess: response => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
      showToast(
        'success',
        response.message || 'Thank you! Your feedback has been submitted.',
      );
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to submit feedback', options?.onError);
    },
  });
}

export function useSubmitReview(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitReview,
    onSuccess: response => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.myReview() });
      showToast(
        'success',
        response.message || 'Thank you! Your review has been saved.',
      );
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to save your review',
        options?.onError,
      );
    },
  });
}
