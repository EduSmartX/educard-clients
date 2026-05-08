/**
 * Profile Queries
 * React Query hooks for fetching profile data
 */

import { useQuery } from '@tanstack/react-query';
import { getUserProfile, getMyProfilePhoto } from '../api/profile-api';

/**
 * Hook to fetch user profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: () => getUserProfile(),
    select: (data) => data.data,
  });
}

/**
 * Hook to fetch current user's profile photo
 */
export function useMyProfilePhoto() {
  return useQuery({
    queryKey: ['profile-photo', 'me'],
    queryFn: () => getMyProfilePhoto(),
    select: (data) => data.data,
  });
}
