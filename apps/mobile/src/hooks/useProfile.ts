/**
 * Profile hooks
 * React Query hooks for profile data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import {
  getMyProfilePhoto,
  getUserProfile,
  updateProfile,
  type UpdateProfilePayload,
} from '@/api/profile';
import { getMediaUrl } from '@/constants/config';
import { useAuthStore } from '@/lib/auth-store';

/**
 * Hook to fetch current user's profile photo from attachments API
 */
export function useMyProfilePhoto() {
  const user = useAuthStore(state => state.user);
  const userId = user?.public_id;

  return useQuery({
    queryKey: ['profile-photo', userId ?? 'me'],
    queryFn: getMyProfilePhoto,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Hook to fetch current user's full profile
 */
export function useUserProfile() {
  const user = useAuthStore(state => state.user);
  const userId = user?.public_id;

  return useQuery({
    queryKey: ['user-profile', userId ?? 'me'],
    queryFn: getUserProfile,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!userId,
  });
}

/**
 * Hook to invalidate profile photo cache - call after uploading new photo
 */
export function useInvalidateProfilePhoto() {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const userId = user?.public_id;

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    if (userId) {
      void queryClient.refetchQueries({ queryKey: ['profile-photo', userId] });
    }
  }, [queryClient, userId]);
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message ?? 'Failed to update profile');
    },
  });
}

/**
 * Unified hook to get profile image URL.
 * No cache-bust param: backend serves signed URLs (R2/S3/GCS) whose signature
 * covers the query string, so appending ?v= would 403. Signed URLs rotate on
 * each fetch, which already busts the cache after an upload.
 */
export function useProfileImageUrl() {
  const { data: profilePhoto, isLoading, dataUpdatedAt } = useMyProfilePhoto();

  const profileImageUrl = useMemo(() => {
    return (
      getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url)
    );
  }, [profilePhoto?.thumbnail_url, profilePhoto?.url]);

  return {
    profileImageUrl,
    serverUrl: profileImageUrl,
    isLoading,
    dataUpdatedAt,
  };
}
