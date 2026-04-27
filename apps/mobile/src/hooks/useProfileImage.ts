/**
 * useProfileImage — Pick & upload profile photo via expo-image-picker + API
 */

import { API_ENDPOINTS, getErrorMessage } from '@educard/shared';
import * as ImagePicker from 'expo-image-picker';
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';

import { apiClient } from '@/api/client';

interface UseProfileImageOptions {
  /** The user's public_id (not teacher/student public_id) */
  userPublicId: string | undefined;
  /** Called after successful upload with the new image URL */
  onSuccess?: (imageUrl: string) => void;
}

export function useProfileImage({ userPublicId, onSuccess }: UseProfileImageOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    if (!userPublicId) {
      Alert.alert('Error', 'User data not loaded yet.');
      return;
    }

    // Show action sheet: Camera or Gallery
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => launchPicker('camera'),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => launchPicker('gallery'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);

    async function launchPicker(source: 'camera' | 'gallery') {
      try {
        // Request permissions
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
            return;
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
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
        const fileName = asset.uri.split('/').pop() || 'photo.jpg';
        const fileType = asset.mimeType || 'image/jpeg';

        formData.append('file', {
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: fileName,
          type: fileType,
        } as any);
        formData.append('image_type', 'profile_photo');

        const response = await apiClient.post(
          API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId!),
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          }
        );

        const imageUrl =
          response.data?.data?.thumbnail_url || response.data?.data?.original_url || asset.uri;

        onSuccess?.(imageUrl);
        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        Alert.alert('Upload Failed', getErrorMessage(error, 'Failed to upload photo.'));
        setLocalUri(null);
      } finally {
        setIsUploading(false);
      }
    }
  }, [userPublicId, onSuccess]);

  return { pickAndUpload, isUploading, localUri };
}
