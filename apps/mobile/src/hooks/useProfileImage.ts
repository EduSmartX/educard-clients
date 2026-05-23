/**
 * useProfileImage — Pick & upload profile photo via expo-image-picker + API
 */

import { API_ENDPOINTS, getErrorMessage } from '@educard/shared';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

import { apiClient } from '@/api/client';
import { useAuthStore } from '@/lib/auth-store';

interface UseProfileImageOptions {
  /** The user's public_id (not teacher/student public_id) */
  userPublicId: string | undefined;
  /** Called after successful upload with the new image URL */
  onSuccess?: (imageUrl: string) => void;
  /** Additional query keys to invalidate after upload (e.g., teacher/student details) */
  additionalInvalidateKeys?: (readonly unknown[])[];
}

interface FormDataFile {
  uri: string;
  name: string;
  type: string;
}

interface UploadResponse {
  data?: {
    thumbnail_url?: string;
    original_url?: string;
  };
}

export function useProfileImage({
  userPublicId,
  onSuccess,
  additionalInvalidateKeys,
}: UseProfileImageOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const invalidateProfilePhoto = useCallback(() => {
    // Invalidate all profile-photo queries to force refetch
    void queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    // Also refetch immediately
    if (user?.public_id) {
      void queryClient.refetchQueries({ queryKey: ['profile-photo', user.public_id] });
    }
    // Invalidate additional queries (e.g., teacher/student details)
    if (additionalInvalidateKeys) {
      for (const key of additionalInvalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    }
  }, [queryClient, user?.public_id, additionalInvalidateKeys]);

  const pickAndUpload = useCallback(() => {
    if (!userPublicId) {
      Alert.alert('Error', 'User data not loaded yet.');
      return;
    }

    // Show action sheet: Camera or Gallery
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => {
          void launchPicker('camera');
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          void launchPicker('gallery');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

    async function launchPicker(source: 'camera' | 'gallery') {
      try {
        // Request permissions
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== ImagePicker.PermissionStatus.GRANTED) {
            Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
            return;
          }
        }

        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];
        setLocalUri(asset.uri);
        setIsUploading(true);

        // Build multipart form data
        const formData = new FormData();
        const fileName = asset.uri.split('/').pop() ?? 'photo.jpg';
        const fileType = asset.mimeType ?? 'image/jpeg';

        const fileData: FormDataFile = {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: fileName,
          type: fileType,
        };
        formData.append('file', fileData as unknown as Blob);
        formData.append('image_type', 'profile_photo');

        // Use self-upload endpoint when uploading own photo, otherwise use managed user endpoint
        const isSelfUpload = userPublicId === user?.public_id;
        const uploadUrl = isSelfUpload
          ? API_ENDPOINTS.ATTACHMENTS.MY_PHOTO_UPLOAD
          : API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId ?? '');

        const response = await apiClient.post<UploadResponse>(uploadUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });

        const imageUrl =
          response.data?.data?.thumbnail_url ?? response.data?.data?.original_url ?? asset.uri;

        // Invalidate profile photo cache to force all components to refetch
        invalidateProfilePhoto();

        onSuccess?.(imageUrl);
        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        Alert.alert('Upload Failed', getErrorMessage(error, 'Failed to upload photo.'));
        setLocalUri(null);
      } finally {
        setIsUploading(false);
      }
    }
  }, [userPublicId, onSuccess, invalidateProfilePhoto, user?.public_id]);

  return { pickAndUpload, isUploading, localUri, invalidateProfilePhoto };
}
