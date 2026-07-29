/**
 * Hook for fetching manageable users.
 * For admins: returns all staff/teachers.
 * For teachers: returns only their subordinates/manageable users.
 */

import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';

export interface ManageableUser {
  public_id: string;
  full_name: string;
  email: string;
  employee_id?: string;
}

interface ManageableUsersResponse {
  success?: boolean;
  message?: string;
  data?: { users?: ManageableUser[] } | ManageableUser[];
}

function parseManageableUsers(resData: ManageableUsersResponse): ManageableUser[] {
  if (Array.isArray(resData)) {
    return resData;
  }
  if (resData?.data) {
    if (Array.isArray(resData.data)) {
      return resData.data;
    }
    if ('users' in resData.data && Array.isArray(resData.data.users)) {
      return resData.data.users;
    }
  }
  return [];
}

export function useManageableUsers(role?: string, enabled = true) {
  return useQuery<ManageableUser[]>({
    queryKey: ['manageable-users', role],
    queryFn: async () => {
      const params = role ? `?role=${role}` : '';
      const response = await apiClient.get<ManageableUsersResponse>(
        `/users/profile/manageable-users/${params}`
      );
      return parseManageableUsers(response.data);
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
