/**
 * Hook for fetching manageable users (subordinates + self for teachers, all for admins).
 * Shared across features that need user selection filtered by role.
 */

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { QUERY_KEYS } from '@/constants/app-config';

export interface ManageableUser {
  public_id: string;
  full_name: string;
  email: string;
}

interface ManageableUsersApiResponse {
  status?: string;
  message?: string;
  data?: { users?: ManageableUser[] } | ManageableUser[];
}

function parseManageableUsers(resData: ManageableUsersApiResponse): ManageableUser[] {
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

export function useManageableUsers(role?: string) {
  return useQuery<ManageableUser[]>({
    queryKey: QUERY_KEYS.users.manageable(role),
    queryFn: async () => {
      const params = role ? `?role=${role}` : '';
      const response = await api.get<ManageableUsersApiResponse>(
        `/users/profile/manageable-users/${params}`
      );
      return parseManageableUsers(response.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}
