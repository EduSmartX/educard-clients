/**
 * Organization Roles API Hooks
 * Hooks for fetching organization roles
 */

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api';

export interface OrganizationRole {
  id: number;
  name: string;
  code: string;
  description: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

/**
 * Fetch organization roles from API
 */
async function fetchOrganizationRoles(): Promise<OrganizationRole[]> {
  try {
    const response = await apiClient.get<ApiResponse<OrganizationRole[]>>(
      '/core/organization-role-types/'
    );
    // API response structure: { success, message, data: [...roles], code }
    return response.data?.data || [];
  } catch {
    return [];
  }
}

/**
 * Custom hook to fetch organization roles
 */
export function useOrganizationRoles() {
  return useQuery({
    queryKey: ['organization-roles'],
    queryFn: fetchOrganizationRoles,
    select: (data) => (Array.isArray(data) ? data : []),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
