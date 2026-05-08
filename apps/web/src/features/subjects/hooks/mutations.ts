/**
 * Subject Mutations
 * All mutation hooks for subjects module
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  handleMutationError,
  type FieldErrors,
  type MutationOptions,
} from '@/lib/utils/mutation-utils';
import {
  createSubject,
  updateSubject,
  deleteSubject,
  reactivateSubject,
} from '../api/subjects-api';
import { ErrorMessages, SuccessMessages } from '@/constants';
import type { SubjectCreatePayload, SubjectUpdatePayload } from '../types/subject';

export interface SubjectFieldErrors extends FieldErrors {
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  description?: string;
}

export type { MutationOptions };

export function useCreateSubject(options?: MutationOptions<SubjectFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: SubjectCreatePayload; forceCreate?: boolean }) =>
      createSubject(data, forceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.SUBJECT.CREATE_FAILED, options?.onError);
    },
  });
}

export function useUpdateSubject(options?: MutationOptions<SubjectFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectUpdatePayload }) =>
      updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.SUBJECT.UPDATE_FAILED, options?.onError);
    },
  });
}

export function useDeleteSubject(options?: MutationOptions<SubjectFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: (_data, publicId) => {
      queryClient.removeQueries({ queryKey: ['subjects', publicId] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(SuccessMessages.SUBJECT.DELETE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.SUBJECT.DELETE_FAILED, options?.onError);
    },
  });
}

export function useReactivateSubject(options?: MutationOptions<SubjectFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast.success(SuccessMessages.SUBJECT.REACTIVATE_SUCCESS);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.SUBJECT.REACTIVATE_FAILED, options?.onError);
    },
  });
}
