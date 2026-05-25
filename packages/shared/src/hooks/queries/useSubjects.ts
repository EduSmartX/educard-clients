/**
 * Shared Subject Hooks
 *
 * React Query hooks for subject management.
 * These hooks work on both web and mobile when provided with an API instance.
 *
 * NOTE: These hooks require @tanstack/react-query to be installed in the consuming app.
 * The shared package lists it as a peer dependency.
 */

import type { SubjectsApi } from "../../api/subjects";
import type {
  CreateSubjectPayload,
  UpdateSubjectPayload,
  SubjectQueryParams,
} from "../../types/subject";
import { QueryKeys } from "../../constants/query-keys";

// Re-export types for consumers
export type { SubjectListResponse, SubjectDetailResponse } from "../../api/subjects";

/**
 * Query key factory for subjects
 * Can be used directly without the full hooks if needed
 */
export const subjectQueryKeys = {
  all: QueryKeys.SUBJECTS.ALL,
  lists: () => QueryKeys.SUBJECTS.LISTS(),
  list: (params?: SubjectQueryParams) => QueryKeys.SUBJECTS.LIST(params as object),
  byClass: (classId: string) => QueryKeys.SUBJECTS.BY_CLASS(classId),
  details: () => QueryKeys.SUBJECTS.DETAILS(),
  detail: (id: string) => QueryKeys.SUBJECTS.DETAIL(id),
};

/**
 * Create subject query hooks bound to a specific API instance
 * This factory function returns hooks that can be used in React components.
 *
 * Usage in web/mobile:
 * ```
 * // In your app's hooks setup
 * import { createSubjectsApi, createSubjectHooks } from '@educard/shared';
 * import { apiClient } from './api/client';
 *
 * const subjectsApi = createSubjectsApi(apiClient);
 * export const {
 *   useSubjects,
 *   useSubject,
 *   useCreateSubject,
 *   useUpdateSubject,
 *   useDeleteSubject,
 *   useRestoreSubject,
 * } = createSubjectHooks(subjectsApi);
 * ```
 */
export function createSubjectHooks(api: SubjectsApi) {
  // Return hook factory functions that use react-query
  // The actual implementation uses the consuming app's react-query instance
  return {
    /**
     * Get query config for fetching subjects list
     * Can be used with useQuery directly
     */
    getSubjectsQueryConfig: (params?: SubjectQueryParams) => ({
      queryKey: subjectQueryKeys.list(params),
      queryFn: () => api.list(params),
    }),

    /**
     * Get query config for fetching a single subject
     */
    getSubjectQueryConfig: (publicId: string, isDeleted = false) => ({
      queryKey: subjectQueryKeys.detail(publicId),
      queryFn: () => api.get(publicId, isDeleted),
      enabled: !!publicId,
    }),

    /**
     * Get query config for fetching subjects by class
     */
    getSubjectsByClassQueryConfig: (classId: string) => ({
      queryKey: subjectQueryKeys.byClass(classId),
      queryFn: () => api.getByClass(classId),
      enabled: !!classId,
    }),

    /**
     * Get mutation config for creating a subject
     */
    getCreateSubjectMutationConfig: () => ({
      mutationFn: ({ data, forceCreate }: { data: CreateSubjectPayload; forceCreate?: boolean }) =>
        api.create(data, forceCreate),
      invalidateKeys: [QueryKeys.SUBJECTS.ALL],
    }),

    /**
     * Get mutation config for updating a subject
     */
    getUpdateSubjectMutationConfig: () => ({
      mutationFn: ({ publicId, data }: { publicId: string; data: UpdateSubjectPayload }) =>
        api.update(publicId, data),
      invalidateKeys: [QueryKeys.SUBJECTS.ALL],
    }),

    /**
     * Get mutation config for deleting a subject
     */
    getDeleteSubjectMutationConfig: () => ({
      mutationFn: (publicId: string) => api.delete(publicId),
      invalidateKeys: [QueryKeys.SUBJECTS.ALL],
    }),

    /**
     * Get mutation config for restoring a subject
     */
    getRestoreSubjectMutationConfig: () => ({
      mutationFn: (publicId: string) => api.restore(publicId),
      invalidateKeys: [QueryKeys.SUBJECTS.ALL],
    }),

    // Direct API access (for cases where hooks aren't needed)
    api,
  };
}

export type SubjectHooks = ReturnType<typeof createSubjectHooks>;

