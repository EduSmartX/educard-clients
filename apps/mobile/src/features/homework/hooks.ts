/**
 * Homework React Query Hooks
 * Provides type-safe data fetching and mutation hooks for homework feature
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type {
  Homework,
  HomeworkDetail,
  HomeworkSubmission,
  HomeworkSubmissionDetail,
  HomeworkDashboardStats,
  CalendarHomework,
  TeacherClass,
  HomeworkCreatePayload,
  HomeworkUpdatePayload,
  ReviewSubmissionPayload,
  HomeworkListParams,
  SubmissionListParams,
  CalendarParams,
  SubmissionsResponse,
} from '@educard/shared';

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
} from './api';
import { showToast } from '@/utils/toast';

// ============== Query Keys ==============

export const homeworkKeys = {
  all: ['homework'] as const,
  lists: () => [...homeworkKeys.all, 'list'] as const,
  list: (params?: HomeworkListParams) => [...homeworkKeys.lists(), params] as const,
  details: () => [...homeworkKeys.all, 'detail'] as const,
  detail: (id: string) => [...homeworkKeys.details(), id] as const,
  dashboard: () => [...homeworkKeys.all, 'dashboard'] as const,
  upcoming: () => [...homeworkKeys.all, 'upcoming'] as const,
  calendar: (params?: CalendarParams) => [...homeworkKeys.all, 'calendar', params] as const,
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
  options?: Omit<UseQueryOptions<HomeworkDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: homeworkKeys.detail(publicId),
    queryFn: () => fetchHomeworkDetail(publicId),
    ...options,
  });
}

// ============== Homework Mutations ==============

export function useCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHomework,
    onSuccess: () => {
      showToast('success', 'Homework created successfully');
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
    },
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: HomeworkUpdatePayload }) =>
      updateHomework(publicId, data),
    onSuccess: (_, variables) => {
      showToast('success', 'Homework updated successfully');
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(variables.publicId) });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => {
      showToast('success', 'Homework deleted successfully');
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
    },
  });
}

// ============== Attachment Mutations ==============

export function useUploadHomeworkAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, formData }: { publicId: string; formData: FormData }) =>
      uploadHomeworkAttachment(publicId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(variables.publicId) });
    },
  });
}

export function useDeleteHomeworkAttachment() {
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
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(variables.homeworkPublicId) });
    },
  });
}

// ============== Submissions ==============

export function useSubmissions(homeworkPublicId: string, params?: SubmissionListParams) {
  return useQuery({
    queryKey: homeworkKeys.submissions(homeworkPublicId, params),
    queryFn: () => fetchSubmissions(homeworkPublicId, params),
  });
}

export function useSubmissionDetail(homeworkPublicId: string, submissionPublicId: string) {
  return useQuery({
    queryKey: homeworkKeys.submissionDetail(homeworkPublicId, submissionPublicId),
    queryFn: () => fetchSubmissionDetail(homeworkPublicId, submissionPublicId),
  });
}

export function useReviewSubmission() {
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
      showToast('success', 'Submission reviewed successfully');
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.submissionDetail(
          variables.homeworkPublicId,
          variables.submissionPublicId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.submissions(variables.homeworkPublicId),
      });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(variables.homeworkPublicId) });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
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
