/**
 * Class Mutations
 * All React Query mutations for class CRUD operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCriticalOperation } from '@/providers/critical-operation-provider';
import { toast } from 'sonner';
import {
  handleMutationError,
  type FieldErrors,
  type MutationOptions,
} from '@/lib/utils/mutation-utils';
import { ErrorMessages, QueryKeys } from '@/constants';
import type { CreateClassPayload, UpdateClassPayload } from '../types';
import {
  createClass,
  updateClass,
  deleteClass,
  reactivateClass,
  bulkUploadClasses,
} from '../api/classes-api';

export interface ClassFieldErrors extends FieldErrors {
  standard?: string;
  section?: string;
  class_teacher?: string;
  academic_year?: string;
  capacity?: string;
}

export type { MutationOptions };

export function useCreateClass(options?: MutationOptions<ClassFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      forceCreate,
    }: {
      payload: CreateClassPayload;
      forceCreate?: boolean;
    }) => createClass(payload, forceCreate),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.CLASSES.ALL });
      toast.success(response.message);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.CLASS.CREATE_FAILED, options?.onError);
    },
  });
}

export function useReactivateClass(options?: MutationOptions<ClassFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => reactivateClass(publicId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.CLASSES.ALL,
      });
      toast.success(response.message);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.CLASS.REACTIVATE_FAILED, options?.onError);
    },
  });
}

export function useUpdateClass(options?: MutationOptions<ClassFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, payload }: { publicId: string; payload: UpdateClassPayload }) =>
      updateClass(publicId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.CLASSES.ALL });
      toast.success(response.message);
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.CLASS.UPDATE_FAILED, options?.onError);
    },
  });
}

export function useDeleteClass(options?: MutationOptions<ClassFieldErrors>) {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } = useCriticalOperation();

  return useMutation({
    mutationFn: (publicId: string) => deleteClass(publicId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting class',
        description: 'Removing the class and its related records...',
      });
    },
    onSuccess: (response, publicId) => {
      queryClient.removeQueries({ queryKey: ['classes', publicId] });
      queryClient.invalidateQueries({ queryKey: QueryKeys.CLASSES.ALL });
      toast.success(response?.message || 'Class deleted successfully');
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.CLASS.DELETE_FAILED, options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useBulkUploadClasses(options?: MutationOptions<ClassFieldErrors>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => bulkUploadClasses(file),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.CLASSES.ALL });
      if (response.failed_count > 0) {
        toast.warning(ErrorMessages.CLASS.BULK_UPLOAD_FAILED, {
          description: `${response.created_count} classes created, ${response.failed_count} failed.`,
          duration: 6000,
        });
      } else {
        toast.success('Classes uploaded successfully');
      }
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      handleMutationError(error, ErrorMessages.CLASS.BULK_UPLOAD_FAILED, options?.onError);
    },
  });
}
