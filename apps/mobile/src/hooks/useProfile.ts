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
 * Uses user's public_id in query key to prevent cache issues on user switch
 */
export function useMyProfilePhoto() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.public_id;

  return useQuery({
    queryKey: ['profile-photo', userId ?? 'me'],
    queryFn: getMyProfilePhoto,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for faster updates)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId, // Only fetch when user is logged in
  });
}

/**
 * Hook to fetch current user's full profile
 * Uses user's public_id in query key to prevent cache issues on user switch
 */
export function useUserProfile() {
  const user = useAuthStore((state) => state.user);
  const userId = user?.public_id;

  return useQuery({
    queryKey: ['user-profile', userId ?? 'me'],
    queryFn: getUserProfile,
    staleTime: 1 * 60 * 1000, // 1 minute (reduced for faster updates)
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId, // Only fetch when user is logged in
  });
}

/**
 * Hook to invalidate profile photo cache - call after uploading new photo
 */
export function useInvalidateProfilePhoto() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userId = user?.public_id;

  return useCallback(() => {
    // Invalidate all profile-photo queries
    void queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    // Also refetch immediately for the current user
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
      // Invalidate profile queries to refetch
      void queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      void queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message ?? 'Failed to update profile');
    },
  });
}

/**
 * Unified hook to get profile image URL with cache-busting
 * 
 * This hook:
 * - Fetches profile photo data
 * - Constructs a cache-busted URL using dataUpdatedAt timestamp
 * - Returns loading state and the ready-to-use URL
 * 
 * @returns {Object} Profile image state
 * - `profileImageUrl`: Cache-busted URL ready for Image component (undefined if no photo)
 * - `serverUrl`: Raw server URL without cache-busting (for comparisons)
 * - `isLoading`: Whether profile photo is being fetched
 * - `dataUpdatedAt`: Timestamp for cache-busting (useful for child components)
 */
export function useProfileImageUrl() {
  const { data: profilePhoto, isLoading, dataUpdatedAt } = useMyProfilePhoto();
  
  const serverUrl = useMemo(() => {
    return getMediaUrl(profilePhoto?.thumbnail_url) ?? getMediaUrl(profilePhoto?.url);
  }, [profilePhoto?.thumbnail_url, profilePhoto?.url]);

  const profileImageUrl = useMemo(() => {
    if (!serverUrl) return undefined;
    // Add cache-busting query param using dataUpdatedAt
    const separator = serverUrl.includes('?') ? '&' : '?';
    return `${serverUrl}${separator}v=${dataUpdatedAt || Date.now()}`;
  }, [serverUrl, dataUpdatedAt]);

  return {
    profileImageUrl,
    serverUrl,
    isLoading,
    dataUpdatedAt,
  };
}
