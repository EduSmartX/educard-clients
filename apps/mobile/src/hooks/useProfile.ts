/**
 * Profile hooks
 * React Query hooks for profile data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  getMyProfilePhoto,
  getUserProfile,
  updateProfile,
  type UpdateProfilePayload,
} from '@/api/profile';

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

/**
 * Hook to fetch current user's full profile
 */
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile', 'me'],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      // Invalidate profile queries to refetch
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });
}
