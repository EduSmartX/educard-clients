/**
 * Download Template Utility
 * Downloads Excel templates and saves them to Downloads (Android) or shares (iOS).
 * Bare RN implementation using react-native-fs + react-native-share.
 */

/* eslint-disable no-bitwise */
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

interface DownloadResult {
  success: boolean;
  message: string;
  filePath?: string;
}

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result +=
      BASE64_CHARS[(n >> 18) & 63] +
      BASE64_CHARS[(n >> 12) & 63] +
      BASE64_CHARS[(n >> 6) & 63] +
      BASE64_CHARS[n & 63];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const n = bytes[i] << 16;
    result +=
      BASE64_CHARS[(n >> 18) & 63] + BASE64_CHARS[(n >> 12) & 63] + '==';
  } else if (remaining === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result +=
      BASE64_CHARS[(n >> 18) & 63] +
      BASE64_CHARS[(n >> 12) & 63] +
      BASE64_CHARS[(n >> 6) & 63] +
      '=';
  }
  return result;
}

/**
 * Download template data and save to Downloads folder (Android) or share (iOS)
 */
export async function downloadAndSaveTemplate(
  templateData: ArrayBuffer,
  fileName: string,
): Promise<DownloadResult> {
  try {
    const base64 = arrayBufferToBase64(templateData);
    const cachePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
    await RNFS.writeFile(cachePath, base64, 'base64');

    if (Platform.OS === 'android') {
      try {
        const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.copyFile(cachePath, downloadPath);
        return {
          success: true,
          message: `Template saved to Downloads folder: ${fileName}`,
          filePath: downloadPath,
        };
      } catch {
        return await shareFile(cachePath, fileName);
      }
    }

    return await shareFile(cachePath, fileName);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to download template',
    };
  }
}

async function shareFile(
  filePath: string,
  fileName: string,
): Promise<DownloadResult> {
  try {
    await Share.open({
      url: `file://${filePath}`,
      type: XLSX_MIME,
      title: `Save ${fileName}`,
      failOnCancel: false,
    });
    return {
      success: true,
      message:
        'Template shared successfully. Please save it to your preferred location.',
      filePath,
    };
  } catch {
    return {
      success: false,
      message: 'Sharing was cancelled or is not available',
    };
  }
}
