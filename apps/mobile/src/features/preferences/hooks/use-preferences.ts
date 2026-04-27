/**
 * Organization Preferences — React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getGroupedPreferences,
  getOrganizationPreferences,
  getPreferenceById,
  updatePreference,
  resetPreference,
} from '../api/preferences-api';

export const preferenceKeys = {
  all: ['organization-preferences'] as const,
  grouped: () => [...preferenceKeys.all, 'grouped'] as const,
  list: (category?: string) => [...preferenceKeys.all, 'list', category] as const,
  detail: (id: string) => [...preferenceKeys.all, 'detail', id] as const,
};

export function useGroupedPreferences() {
  return useQuery({
    queryKey: preferenceKeys.grouped(),
    queryFn: getGroupedPreferences,
    staleTime: 5 * 60 * 1000,
  });
}

export function useOrganizationPreferences(category?: string) {
  return useQuery({
    queryKey: preferenceKeys.list(category),
    queryFn: () => getOrganizationPreferences(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePreferenceDetail(publicId: string) {
  return useQuery({
    queryKey: preferenceKeys.detail(publicId),
    queryFn: () => getPreferenceById(publicId),
    enabled: !!publicId,
  });
}

export function useUpdatePreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, value }: { publicId: string; value: string | string[] }) =>
      updatePreference(publicId, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: preferenceKeys.all });
    },
  });
}

export function useResetPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resetPreference,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: preferenceKeys.all });
    },
  });
}
