/**
 * Subject Mutations
 * All mutation hooks for subjects module
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSubject,
  updateSubject,
  deleteSubject,
  reactivateSubject,
} from '../api/subjects-api';
import type { SubjectCreatePayload, SubjectUpdatePayload } from '../types/subject';

/**
 * Create subject mutation
 */
export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, forceCreate }: { data: SubjectCreatePayload; forceCreate?: boolean }) =>
      createSubject(data, forceCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

/**
 * Update subject mutation
 */
export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectUpdatePayload }) =>
      updateSubject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

/**
 * Delete subject mutation (soft delete)
 */
export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

/**
 * Reactivate subject mutation
 */
export function useReactivateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}
