/**
 * Photo state for the create student/teacher screens.
 *
 * The record does not exist yet when the photo is picked, so the photo is checked with the
 * server straight away (one clear, centred face; not blurry; not an ID card or document).
 * A rejected photo is cleared and the reason is shown, instead of only failing after the
 * record has been created.
 */

import { getErrorMessage } from '@educard/shared';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { uploadProfilePhoto, validateProfilePhoto } from '@/features/core';

export function useValidatedProfilePhoto() {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCheckingPhoto, setIsCheckingPhoto] = useState(false);
  // Only the latest pick may clear the photo, if an older check finishes late.
  const latestPick = useRef(0);

  const onPhotoSelected = useCallback(async (uri: string | null) => {
    const pick = ++latestPick.current;
    setPhotoUri(uri);
    if (!uri) {
      setIsCheckingPhoto(false);
      return;
    }
    setIsCheckingPhoto(true);
    try {
      await validateProfilePhoto(uri);
    } catch (error) {
      if (pick === latestPick.current) {
        setPhotoUri(null);
        Alert.alert(
          'Photo Not Accepted',
          getErrorMessage(
            error,
            'This photo cannot be used. Please try another.',
          ),
        );
      }
    } finally {
      if (pick === latestPick.current) setIsCheckingPhoto(false);
    }
  }, []);

  /** Upload after the record is created; tell the user if the server still rejects it. */
  const uploadAfterCreate = useCallback(
    (userPublicId: string, entityLabel: string) => {
      if (!photoUri) return;
      uploadProfilePhoto(userPublicId, photoUri, 'photo.jpg').catch(error => {
        Alert.alert(
          'Photo Not Saved',
          `${entityLabel} created, but the photo was not saved: ${getErrorMessage(
            error,
            'upload failed.',
          )} You can upload it later from their profile.`,
        );
      });
    },
    [photoUri],
  );

  return { photoUri, isCheckingPhoto, onPhotoSelected, uploadAfterCreate };
}
