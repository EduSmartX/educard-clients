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

/**
 * Fetch organization users for supervisor selection
 */
export function useOrganizationUsers() {
  return useQuery<OrganizationUser[]>({
    queryKey: ['organization-users', 'supervisors'],
    queryFn: async () => {
      try {
        const response =
          await apiClient.get<ApiResponse<OrganizationUser[]>>('/users/supervisors/');
        // API response structure: { success, message, data: [...users], code }
        return response.data?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
