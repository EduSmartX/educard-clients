/**
 * Teacher Mutations
 * All React Query mutations for Teacher CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  handleMutationError,
  type FieldErrors,
  type MutationOptions,
} from '@/lib/utils/mutation-utils';
import { ErrorMessages, QueryKeys, SuccessMessages } from '@/constants';
import type { CreateTeacherPayload, UpdateTeacherPayload } from '../types';
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  reactivateTeacher,
  bulkUploadTeachers,
} from '../api/teachers-api';

export interface TeacherFieldErrors extends FieldErrors {
  employee_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  blood_group?: string;
  date_of_birth?: string;
  designation?: string;
  highest_qualification?: string;
  specialization?: string;
  experience_years?: string;
  joining_date?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  subjects?: string;
}

export type { MutationOptions };

export function useCreateTeacher(options?: MutationOptions<TeacherFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      forceCreate,
    }: {
      payload: CreateTeacherPayload;
      forceCreate?: boolean;
    }) => createTeacher(payload, forceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.TEACHERS.ALL });
      toast.success(SuccessMessages.TEACHER.CREATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TEACHER.CREATE_FAILED, options?.onError);
    },
  });
}

export function useReactivateTeacher(options?: MutationOptions<TeacherFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => reactivateTeacher(publicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.TEACHERS.ALL });
      toast.success(SuccessMessages.TEACHER.REACTIVATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TEACHER.REACTIVATE_FAILED, options?.onError);
    },
  });
}

export function useUpdateTeacher(options?: MutationOptions<TeacherFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, payload }: { publicId: string; payload: UpdateTeacherPayload }) =>
      updateTeacher(publicId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.TEACHERS.ALL });
      toast.success(SuccessMessages.TEACHER.UPDATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TEACHER.UPDATE_FAILED, options?.onError);
    },
  });
}

export function useDeleteTeacher(options?: MutationOptions<TeacherFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => deleteTeacher(publicId),
    onSuccess: (_data, publicId) => {
      queryClient.removeQueries({ queryKey: ['teachers', publicId] });
      queryClient.invalidateQueries({ queryKey: QueryKeys.TEACHERS.ALL });
      toast.success(SuccessMessages.TEACHER.DELETE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TEACHER.DELETE_FAILED, options?.onError);
    },
  });
}

export function useBulkUploadTeachers(options?: MutationOptions<TeacherFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => bulkUploadTeachers(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.TEACHERS.ALL });
      if (response.failed_count > 0) {
        toast.warning(ErrorMessages.TEACHER.BULK_UPLOAD_FAILED, {
          description: `${response.created_count} teachers created, ${response.failed_count} failed.`,
          duration: 6000,
        });
      } else {
        toast.success(SuccessMessages.TEACHER.BULK_UPLOAD_SUCCESS);
      }
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.TEACHER.BULK_UPLOAD_FAILED, options?.onError);
    },
  });
}
