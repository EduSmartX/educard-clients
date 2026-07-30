/**
 * Download Template Utility
 * Downloads Excel templates and saves them to the Downloads folder on Android
 */

import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

interface DownloadResult {
  success: boolean;
  message: string;
  filePath?: string;
}

/**
 * Download template data and save to Downloads folder (Android) or share (iOS)
 * @param templateData - ArrayBuffer containing the file data
 * @param fileName - Name of the file (e.g., 'subjects_template.xlsx')
 * @returns Promise with download result
 */
export async function downloadAndSaveTemplate(
  templateData: ArrayBuffer,
  fileName: string
): Promise<DownloadResult> {
  try {
    // Create file in cache directory
    const cacheFile = new File(Paths.cache, fileName);

    // Write the data to the file
    const uint8Array = new Uint8Array(templateData);
    await cacheFile.write(uint8Array);

    if (Platform.OS === 'android') {
      // On Android, save to MediaLibrary (Downloads folder)
      try {
        // Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();

        if (status !== 'granted') {
          // Fallback to sharing if permission denied
          Alert.alert(
            'Permission Required',
            'Storage permission is needed to save files. Using share instead.'
          );
          return await shareFile(cacheFile.uri, fileName);
        }

        // Create asset in MediaLibrary (saves to Downloads)
        const asset = await MediaLibrary.createAssetAsync(cacheFile.uri);

        // Clean up cache file
        if (cacheFile.exists) {
          await cacheFile.delete();
        }

        return {
          success: true,
          message: `Template saved to Downloads folder: ${fileName}`,
          filePath: asset.uri,
        };
      } catch {
        // MediaLibrary save failed, fallback to sharing
        return await shareFile(cacheFile.uri, fileName);
      }
    } else {
      // On iOS, use sharing
      return await shareFile(cacheFile.uri, fileName);
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download template',
    };
  }
}

/**
 * Share file using system share sheet
 */
async function shareFile(filePath: string, fileName: string): Promise<DownloadResult> {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    return {
      success: false,
      message: 'Sharing is not available on this device',
    };
  }

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: `Save ${fileName}`,
  });

  return {
    success: true,
    message: 'Template shared successfully. Please save it to your preferred location.',
    filePath,
  };
}
