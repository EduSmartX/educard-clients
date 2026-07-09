/**
 * Homework Hooks
 * React Query hooks for homework operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { HOMEWORK_UI } from '@educard/shared';

import * as homeworkApi from '../api/homework-api';
import type {
  HomeworkCreatePayload,
  HomeworkUpdatePayload,
  ReviewSubmissionPayload,
  HomeworkListParams,
  SubmissionListParams,
  CalendarParams,
} from '../types';

// Query keys
export const homeworkKeys = {
  all: ['homework'] as const,
  lists: () => [...homeworkKeys.all, 'list'] as const,
  list: (params?: HomeworkListParams) => [...homeworkKeys.lists(), params] as const,
  details: () => [...homeworkKeys.all, 'detail'] as const,
  detail: (id: string) => [...homeworkKeys.details(), id] as const,
  dashboard: () => [...homeworkKeys.all, 'dashboard'] as const,
  calendar: (params?: CalendarParams) => [...homeworkKeys.all, 'calendar', params] as const,
  upcoming: (days?: number) => [...homeworkKeys.all, 'upcoming', days] as const,
  submissions: (homeworkId: string, params?: SubmissionListParams) =>
    [...homeworkKeys.all, 'submissions', homeworkId, params] as const,
  submissionDetail: (homeworkId: string, submissionId: string) =>
    [...homeworkKeys.all, 'submission', homeworkId, submissionId] as const,
  classHomework: (classId: string, params?: object) =>
    [...homeworkKeys.all, 'class', classId, params] as const,
  teacherClasses: () => [...homeworkKeys.all, 'teacher-classes'] as const,
};

// ==================== Dashboard & Analytics ====================

export function useHomeworkDashboard() {
  return useQuery({
    queryKey: homeworkKeys.dashboard(),
    queryFn: homeworkApi.fetchDashboardStats,
  });
}

export function useCalendarHomework(params?: CalendarParams) {
  return useQuery({
    queryKey: homeworkKeys.calendar(params),
    queryFn: () => homeworkApi.fetchCalendarHomework(params),
  });
}

export function useUpcomingHomework(days?: number) {
  return useQuery({
    queryKey: homeworkKeys.upcoming(days),
    queryFn: () => homeworkApi.fetchUpcomingHomework(days),
  });
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: homeworkKeys.teacherClasses(),
    queryFn: homeworkApi.fetchTeacherClasses,
  });
}

// ==================== Homework CRUD ====================

export function useHomeworkList(params?: HomeworkListParams) {
  return useQuery({
    queryKey: homeworkKeys.list(params),
    queryFn: () => homeworkApi.fetchHomeworkList(params),
  });
}

export function useHomeworkDetail(publicId: string | undefined) {
  return useQuery({
    queryKey: homeworkKeys.detail(publicId!),
    queryFn: () => homeworkApi.fetchHomeworkDetail(publicId!),
    enabled: !!publicId,
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: HomeworkCreatePayload) => homeworkApi.createHomework(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_CREATE);
    },
  });
}

export function useBulkCreateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: HomeworkCreatePayload[]) => homeworkApi.bulkCreateHomework(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_CREATE);
    },
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: HomeworkUpdatePayload }) =>
      homeworkApi.updateHomework(publicId, data),
    onSuccess: (_, { publicId }) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(publicId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_UPDATE);
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => homeworkApi.deleteHomework(publicId),
    onSuccess: () => {
      toast.success('Homework deleted successfully');
      queryClient.invalidateQueries({ queryKey: homeworkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_DELETE);
    },
  });
}

// ==================== Attachments ====================

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      homeworkPublicId,
      file,
      fileName,
    }: {
      homeworkPublicId: string;
      file: File;
      fileName?: string;
    }) => homeworkApi.uploadAttachment(homeworkPublicId, file, fileName),
    onSuccess: (_, { homeworkPublicId }) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(homeworkPublicId) });
      toast.success(HOMEWORK_UI.FILE_UPLOADED);
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_UPLOAD);
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      homeworkPublicId,
      attachmentId,
    }: {
      homeworkPublicId: string;
      attachmentId: string;
    }) => homeworkApi.deleteAttachment(homeworkPublicId, attachmentId),
    onSuccess: (_, { homeworkPublicId }) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.detail(homeworkPublicId) });
      toast.success(HOMEWORK_UI.ATTACHMENT_REMOVED);
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_REMOVE);
    },
  });
}

// ==================== Submissions ====================

export function useHomeworkSubmissions(homeworkPublicId: string, params?: SubmissionListParams) {
  return useQuery({
    queryKey: homeworkKeys.submissions(homeworkPublicId, params),
    queryFn: () => homeworkApi.fetchSubmissions(homeworkPublicId, params),
    enabled: !!homeworkPublicId,
  });
}

export function useSubmissionDetail(homeworkPublicId: string, submissionId: string) {
  return useQuery({
    queryKey: homeworkKeys.submissionDetail(homeworkPublicId, submissionId),
    queryFn: () => homeworkApi.fetchSubmissionDetail(homeworkPublicId, submissionId),
    enabled: !!homeworkPublicId && !!submissionId,
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      homeworkPublicId,
      submissionId,
      data,
    }: {
      homeworkPublicId: string;
      submissionId: string;
      data: ReviewSubmissionPayload;
    }) => homeworkApi.reviewSubmission(homeworkPublicId, submissionId, data),
    onSuccess: (_, { homeworkPublicId, submissionId }) => {
      queryClient.invalidateQueries({ queryKey: homeworkKeys.submissions(homeworkPublicId) });
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.submissionDetail(homeworkPublicId, submissionId),
      });
      queryClient.invalidateQueries({ queryKey: homeworkKeys.dashboard() });
      toast.success(HOMEWORK_UI.SUBMISSION_REVIEWED);
    },
    onError: (error: Error) => {
      toast.error(error.message || HOMEWORK_UI.FAILED_TO_REVIEW);
    },
  });
}

// ==================== Class Homework ====================

export function useClassHomework(
  classPublicId: string,
  params?: { status?: string; subject_public_id?: string }
) {
  return useQuery({
    queryKey: homeworkKeys.classHomework(classPublicId, params),
    queryFn: () => homeworkApi.fetchClassHomework(classPublicId, params),
    enabled: !!classPublicId,
  });
}

// ==================== Notifications ====================

export function useSendHomeworkNotification() {
  return useMutation({
    mutationFn: (data: { class_public_id: string; date: string }) =>
      homeworkApi.sendHomeworkNotification(data),
    onSuccess: () => {
      toast.success('Notification sent successfully');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send notification';
      toast.error(message);
    },
  });
}
