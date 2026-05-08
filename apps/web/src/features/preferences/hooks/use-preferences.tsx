import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getGroupedPreferences,
  getOrganizationPreferences,
  getPreference,
  updatePreference,
  type GroupedPreference,
  type OrganizationPreference,
} from '@/lib/api/preferences-api';
import { ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';

/**
 * Hook to fetch all organization preferences
 */
export function useOrganizationPreferences(category?: string) {
  return useQuery({
    queryKey: ['organization-preferences', category],
    queryFn: () => getOrganizationPreferences(false, category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch preferences grouped by category
 */
export function useGroupedPreferences() {
  return useQuery({
    queryKey: ['organization-preferences', 'grouped'],
    queryFn: getGroupedPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single preference
 */
export function usePreference(publicId: string) {
  return useQuery({
    queryKey: ['organization-preference', publicId],
    queryFn: () => getPreference(publicId),
    enabled: !!publicId,
  });
}

/**
 * Hook to update a preference with optimistic updates
 */
export function useUpdatePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, value }: { publicId: string; value: string | string[] }) =>
      updatePreference(publicId, value),

    onMutate: async ({ publicId, value }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['organization-preferences'] });

      // Snapshot previous values
      const previousGrouped = queryClient.getQueryData<{ data: GroupedPreference[] }>([
        'organization-preferences',
        'grouped',
      ]);
      const previousSingle = queryClient.getQueryData<{ data: OrganizationPreference }>([
        'organization-preference',
        publicId,
      ]);

      // Optimistically update grouped preferences
      if (previousGrouped) {
        queryClient.setQueryData<{ data: GroupedPreference[] }>(
          ['organization-preferences', 'grouped'],
          (old) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((group) => ({
                ...group,
                preferences: group.preferences.map((pref: OrganizationPreference) =>
                  pref.public_id === publicId ? { ...pref, value } : pref
                ),
              })),
            };
          }
        );
      }

      // Optimistically update single preference
      if (previousSingle) {
        queryClient.setQueryData(['organization-preference', publicId], (old: unknown) => {
          const oldData = old as { data: OrganizationPreference };
          if (!oldData) return old;
          return {
            ...oldData,
            data: { ...oldData.data, value },
          };
        });
      }

      return { previousGrouped, previousSingle };
    },

    onSuccess: (data) => {
      const response = data as { message?: string };
      toast.success(ToastTitles.SUCCESS, {
        description: response.message || SuccessMessages.PREFERENCES.UPDATED,
      });
    },

    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousGrouped) {
        queryClient.setQueryData(['organization-preferences', 'grouped'], context.previousGrouped);
      }
      if (context?.previousSingle) {
        queryClient.setQueryData(
          ['organization-preference', _variables.publicId],
          context.previousSingle
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : ErrorMessages.UPDATE_FAILED;
      toast.error(ToastTitles.ERROR, {
        description: errorMessage,
      });
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['organization-preferences'] });
    },
  });
}

/**
 * Hook to update multiple preferences at once
 */
export function useBulkUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Array<{ publicId: string; value: string | string[] }>) => {
      // Update each preference individually
      const promises = updates.map(({ publicId, value }) => updatePreference(publicId, value));
      return Promise.all(promises);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-preferences'] });
      toast.success(ToastTitles.SUCCESS, {
        description: SuccessMessages.PREFERENCES.UPDATED,
      });
    },

    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : ErrorMessages.UPDATE_FAILED;
      toast.error(ToastTitles.ERROR, {
        description: errorMessage,
      });
    },
  });
}
