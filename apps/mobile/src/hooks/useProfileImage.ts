/**
 * useProfileImage — Pick & upload profile photo via react-native-image-picker + API
 */

import { API_ENDPOINTS, getErrorMessage } from '@educard/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

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
  const user = useAuthStore(state => state.user);

  const invalidateProfilePhoto = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['profile-photo'] });
    if (user?.public_id) {
      void queryClient.refetchQueries({
        queryKey: ['profile-photo', user.public_id],
      });
    }
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

    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: () => void launchPicker('camera') },
      {
        text: 'Choose from Gallery',
        onPress: () => void launchPicker('gallery'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

    async function launchPicker(source: 'camera' | 'gallery') {
      try {
        const result =
          source === 'camera'
            ? await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: false,
              })
            : await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                selectionLimit: 1,
              });

        if (result.didCancel) return;
        if (result.errorCode) {
          Alert.alert(
            'Permission Required',
            result.errorMessage ??
              'Camera and gallery permissions are needed to update your photo.',
          );
          return;
        }

        const asset = result.assets?.[0];
        if (!asset?.uri) return;
        setLocalUri(asset.uri);
        setIsUploading(true);

        const formData = new FormData();
        const fileName =
          asset.fileName ?? asset.uri.split('/').pop() ?? 'photo.jpg';
        const fileType = asset.type ?? 'image/jpeg';

        const fileData: FormDataFile = {
          uri:
            Platform.OS === 'android'
              ? asset.uri
              : asset.uri.replace('file://', ''),
          name: fileName,
          type: fileType,
        };
        formData.append('file', fileData as unknown as Blob);
        formData.append('image_type', 'profile_photo');

        const isSelfUpload = userPublicId === user?.public_id;
        const uploadUrl = isSelfUpload
          ? API_ENDPOINTS.ATTACHMENTS.MY_PHOTO_UPLOAD
          : API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId ?? '');

        const response = await apiClient.post<UploadResponse>(
          uploadUrl,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          },
        );

        const imageUrl =
          response.data?.data?.thumbnail_url ??
          response.data?.data?.original_url ??
          asset.uri;

        invalidateProfilePhoto();

        onSuccess?.(imageUrl);
        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        Alert.alert(
          'Upload Failed',
          getErrorMessage(error, 'Failed to upload photo.'),
        );
        setLocalUri(null);
      } finally {
        setIsUploading(false);
      }
    }
  }, [userPublicId, onSuccess, invalidateProfilePhoto, user?.public_id]);

  return { pickAndUpload, isUploading, localUri, invalidateProfilePhoto };
}
