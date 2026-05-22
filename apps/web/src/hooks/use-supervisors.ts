/**
 * Supervisors API Hooks
 * Hooks for fetching organization users/supervisors
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

interface OrganizationUser {
  email: string;
  full_name: string;
  public_id: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

export function useOrganizationUsers() {
  return useQuery<OrganizationUser[]>({
    queryKey: ['organization-users', 'supervisors'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<OrganizationUser[]>>('/users/supervisors/');
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
