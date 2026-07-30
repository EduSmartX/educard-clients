import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import { useCriticalOperation } from '@/providers/critical-operation-provider';
import type {
  CreateStudentPayload,
  UpdateStudentPayload,
  BulkUploadResult,
  Student,
} from '../types';
import {
  createStudent,
  updateStudent,
  deleteStudent,
  reactivateStudent,
  bulkUploadStudents,
} from '../api/students-api';

export function useCreateStudent(
  options?: Omit<
    UseMutationOptions<
      Student,
      Error,
      { classId: string; payload: CreateStudentPayload; forceCreate?: boolean }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: ({
      classId,
      payload,
      forceCreate,
    }: {
      classId: string;
      payload: CreateStudentPayload;
      forceCreate?: boolean;
    }) => createStudent(classId, payload, forceCreate),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      onSuccess?.(...args);
    },
  });
}

export function useUpdateStudent(
  options?: Omit<
    UseMutationOptions<
      Student,
      Error,
      { classId: string; publicId: string; payload: UpdateStudentPayload }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: ({
      classId,
      publicId,
      payload,
    }: {
      classId: string;
      publicId: string;
      payload: UpdateStudentPayload;
    }) => updateStudent(classId, publicId, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      onSuccess?.(...args);
    },
  });
}

export function useDeleteStudent(
  options?: Omit<
    UseMutationOptions<void, Error, { classId: string; publicId: string }>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } = useCriticalOperation();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: ({ classId, publicId }: { classId: string; publicId: string }) =>
      deleteStudent(classId, publicId),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Deleting student',
        description: 'Removing the student and related records...',
      });
    },
    onSuccess: (...args) => {
      const [, { publicId }] = args;
      queryClient.removeQueries({
        queryKey: ['students', publicId],
      });
      // Invalidate list queries to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['students'],
      });
      queryClient.invalidateQueries({
        queryKey: ['classes'],
      });
      onSuccess?.(...args);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

export function useReactivateStudent(
  options?: Omit<
    UseMutationOptions<Student, Error, { classId: string; publicId: string }>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};

  return useMutation({
    ...restOptions,
    mutationFn: ({ classId, publicId }: { classId: string; publicId: string }) =>
      reactivateStudent(classId, publicId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: ['students'],
      });
      queryClient.invalidateQueries({
        queryKey: ['classes'],
      });
      onSuccess?.(...args);
    },
  });
}

export function useBulkUploadStudents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file }: { file: File }) => bulkUploadStudents(file),
    onSuccess: (response: BulkUploadResult) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      return response;
    },
  });
}
