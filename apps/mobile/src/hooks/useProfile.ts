/**
 * Profile hooks
 * React Query hooks for profile data
 */

import { useQuery } from '@tanstack/react-query';
import { getMyProfilePhoto } from '@/api/profile';

/**
 * Hook to fetch current user's profile photo from attachments API
 */
export function useMyProfilePhoto() {
  return useQuery({
    queryKey: ['profile-photo', 'me'],
    queryFn: getMyProfilePhoto,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
