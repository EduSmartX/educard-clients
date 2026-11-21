/**
 * Pick one image from the gallery for a store upload (card artwork, product photos).
 */
import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import type { UploadFile } from '../api/store-api';

export async function pickStoreImage(): Promise<UploadFile | undefined> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    quality: 0.9,
    maxWidth: 2048,
    maxHeight: 2048,
    selectionLimit: 1,
  });
  if (result.didCancel) {
    return undefined;
  }
  if (result.errorCode) {
    Alert.alert(
      'Permission required',
      result.errorMessage ?? 'Allow access to your photos to upload an image.',
    );
    return undefined;
  }
  const asset = result.assets?.[0];
  if (!asset?.uri) {
    return undefined;
  }
  return {
    uri: asset.uri,
    name: asset.fileName ?? asset.uri.split('/').pop() ?? 'image.jpg',
    type: asset.type ?? 'image/jpeg',
  };
}
