/**
 * Homework React Query Hooks
 * Provides type-safe data fetching and mutation hooks for homework feature
 */

import type {
  HomeworkDetail,
  HomeworkUpdatePayload,
  ReviewSubmissionPayload,
  HomeworkListParams,
  SubmissionListParams,
  CalendarParams,
} from '@educard/shared';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { useCriticalOperation } from '@/providers/critical-operation-context';
import { showToast } from '@/utils/toast';

import {
  fetchHomeworkList,
  fetchHomeworkDetail,
  createHomework,
  updateHomework,
  deleteHomework,
  uploadHomeworkAttachment,
  deleteHomeworkAttachment,
  fetchSubmissions,
  fetchSubmissionDetail,
  reviewSubmission,
  fetchHomeworkDashboard,
  fetchUpcomingHomework,
  fetchCalendarHomework,
  fetchTeacherClasses,
  sendHomeworkNotification,
} from './api';

// ============== Query Keys ==============

export const homeworkKeys = {
  all: ['homework'] as const,
  lists: () => [...homeworkKeys.all, 'list'] as const,
  list: (params?: HomeworkListParams) =>
    [...homeworkKeys.lists(), params] as const,
  details: () => [...homeworkKeys.all, 'detail'] as const,
  detail: (id: string) => [...homeworkKeys.details(), id] as const,
  dashboard: () => [...homeworkKeys.all, 'dashboard'] as const,
  upcoming: () => [...homeworkKeys.all, 'upcoming'] as const,
  calendar: (params?: CalendarParams) =>
    [...homeworkKeys.all, 'calendar', params] as const,
  submissions: (homeworkId: string, params?: SubmissionListParams) =>
    [...homeworkKeys.detail(homeworkId), 'submissions', params] as const,
  submissionDetail: (homeworkId: string, submissionId: string) =>
    [...homeworkKeys.detail(homeworkId), 'submission', submissionId] as const,
  teacherClasses: () => [...homeworkKeys.all, 'teacher-classes'] as const,
};

// ============== Teacher Classes ==============

export function useTeacherClasses() {
  return useQuery({
    queryKey: homeworkKeys.teacherClasses(),
    queryFn: fetchTeacherClasses,
  });
}

// ============== Dashboard ==============

export function useHomeworkDashboard() {
  return useQuery({
    queryKey: homeworkKeys.dashboard(),
    queryFn: fetchHomeworkDashboard,
  });
}

export function useUpcomingHomework() {
  return useQuery({
    queryKey: homeworkKeys.upcoming(),
    queryFn: fetchUpcomingHomework,
  });
}

// ============== Homework List ==============

export function useHomeworkList(params?: HomeworkListParams) {
  return useQuery({
    queryKey: homeworkKeys.list(params),
    queryFn: () => fetchHomeworkList(params),
  });
}

// ============== Homework Detail ==============

export function useHomeworkDetail(
  publicId: string,
  options?: Omit<UseQueryOptions<HomeworkDetail>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: homeworkKeys.detail(publicId),
    queryFn: () => fetchHomeworkDetail(publicId),
    ...options,
  });
}

// ============== Homework Mutations ==============

export function useCreateHomework(options?: MutationOptions) {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();

  return useMutation({
    mutationFn: createHomework,
    onMutate: () => {
      beginCriticalOperation({
        title: 'Creating homework',
        description: 'Publishing homework for the selected class...',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.dashboard(),
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to create homework', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useUpdateHomework(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: HomeworkUpdatePayload;
    }) => updateHomework(publicId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.detail(variables.publicId),
      });
      void queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.dashboard(),
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to update homework', options?.onError);
    },
  });
}

export function useDeleteHomework(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => {
      showToast('success', 'Homework deleted successfully');
      void queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.dashboard(),
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to delete homework', options?.onError);
    },
  });
}

// ============== Attachment Mutations ==============

export function useUploadHomeworkAttachment(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      publicId,
      formData,
    }: {
      publicId: string;
      formData: FormData;
    }) => uploadHomeworkAttachment(publicId, formData),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.detail(variables.publicId),
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to upload attachment',
        options?.onError,
      );
    },
  });
}

export function useDeleteHomeworkAttachment(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      homeworkPublicId,
      attachmentPublicId,
    }: {
      homeworkPublicId: string;
      attachmentPublicId: string;
    }) => deleteHomeworkAttachment(homeworkPublicId, attachmentPublicId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.detail(variables.homeworkPublicId),
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to delete attachment',
        options?.onError,
      );
    },
  });
}

// ============== Submissions ==============

export function useSubmissions(
  homeworkPublicId: string,
  params?: SubmissionListParams,
) {
  return useQuery({
    queryKey: homeworkKeys.submissions(homeworkPublicId, params),
    queryFn: () => fetchSubmissions(homeworkPublicId, params),
  });
}

export function useSubmissionDetail(
  homeworkPublicId: string,
  submissionPublicId: string,
) {
  return useQuery({
    queryKey: homeworkKeys.submissionDetail(
      homeworkPublicId,
      submissionPublicId,
    ),
    queryFn: () => fetchSubmissionDetail(homeworkPublicId, submissionPublicId),
  });
}

export function useReviewSubmission(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      homeworkPublicId,
      submissionPublicId,
      data,
    }: {
      homeworkPublicId: string;
      submissionPublicId: string;
      data: ReviewSubmissionPayload;
    }) => reviewSubmission(homeworkPublicId, submissionPublicId, data),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.submissionDetail(
          variables.homeworkPublicId,
          variables.submissionPublicId,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.submissions(variables.homeworkPublicId),
      });
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.detail(variables.homeworkPublicId),
      });
      void queryClient.invalidateQueries({
        queryKey: homeworkKeys.dashboard(),
      });
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to review submission',
        options?.onError,
      );
    },
  });
}

// ============== Calendar ==============

export function useCalendarHomework(params?: CalendarParams) {
  return useQuery({
    queryKey: homeworkKeys.calendar(params),
    queryFn: () => fetchCalendarHomework(params),
  });
}

// ============== Notifications ==============

export function useSendHomeworkNotification(options?: MutationOptions) {
  return useMutation({
    mutationFn: (data: { class_public_id: string; date: string }) =>
      sendHomeworkNotification(data),
    onSuccess: () => {
      showToast('success', 'Notification sent successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to send notification',
        options?.onError,
      );
    },
  });
}
