/**
 * Attachment utilities — download, open, and save remote attachments locally
 * (auth-aware) instead of handing the URL to the browser.
 *
 * Used by the reusable AttachmentViewer for leave documents, homework files,
 * submissions, and any other supported document.
 */

import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { apiClient } from '@/api/client';
import { getMediaUrl } from '@/constants/config';
import { ensureLegacyStorageWritePermission } from '@/lib/permissions';

import { arrayBufferToBase64 } from './download-template';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp'];

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  bmp: 'image/bmp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export interface AttachmentSaveResult {
  success: boolean;
  message: string;
  filePath?: string;
}

export function getFileExtension(nameOrUrl?: string | null): string {
  if (!nameOrUrl) return '';
  const clean = nameOrUrl.split('?')[0].split('#')[0];
  const dot = clean.lastIndexOf('.');
  return dot >= 0 ? clean.slice(dot + 1).toLowerCase() : '';
}

export function isImageAttachment(nameOrUrl?: string | null): boolean {
  return IMAGE_EXTS.includes(getFileExtension(nameOrUrl));
}

export function getAttachmentMimeType(nameOrUrl?: string | null): string {
  return MIME_BY_EXT[getFileExtension(nameOrUrl)] ?? 'application/octet-stream';
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${Number.parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
}

function deriveNameFromUrl(url?: string): string {
  if (!url) return '';
  const clean = url.split('?')[0].split('#')[0];
  return clean.substring(clean.lastIndexOf('/') + 1);
}

function sanitizeFileName(name?: string | null, fallbackUrl?: string): string {
  const raw =
    (name || '').trim() || deriveNameFromUrl(fallbackUrl) || 'attachment';
  // Strip characters unsafe for file paths.
  return raw.replace(/[/\\?%*:|"<>]/g, '_');
}

/**
 * Download a remote attachment (with the app's auth token) into the cache and
 * return the local file path.
 */
export async function downloadAttachmentToCache(
  rawUrl: string,
  fileName?: string,
): Promise<string> {
  const url = getMediaUrl(rawUrl);
  if (!url) {
    throw new Error('Invalid attachment URL');
  }

  const response = await apiClient.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
  });
  const base64 = arrayBufferToBase64(response.data);
  const safeName = sanitizeFileName(fileName, rawUrl);
  const path = `${RNFS.CachesDirectoryPath}/${safeName}`;
  await RNFS.writeFile(path, base64, 'base64');
  return path;
}

/**
 * Copy a cached file into the public Downloads collection.
 *
 * MediaStore is the only route to Downloads for apps targeting Android 10+;
 * a plain file copy there fails under scoped storage.
 */
async function copyToAndroidDownloads(
  cachePath: string,
  safeName: string,
  mimeType: string,
): Promise<void> {
  await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
    // The native module reads `name`; the shipped typings wrongly say `path`.
    { name: safeName, parentFolder: '', mimeType } as unknown as Parameters<
      typeof ReactNativeBlobUtil.MediaCollection.copyToMediaStore
    >[0],
    'Download',
    cachePath,
  );
}

/**
 * Open an attachment in the device's native handler (PDF viewer, etc.).
 * Android uses a view intent so the file opens directly; the share sheet is
 * only a fallback when no app can handle the type.
 */
export async function openAttachmentExternally(
  rawUrl: string,
  fileName?: string,
): Promise<void> {
  const path = await downloadAttachmentToCache(rawUrl, fileName);
  const mimeType = getAttachmentMimeType(fileName || rawUrl);

  if (Platform.OS === 'android') {
    try {
      await ReactNativeBlobUtil.android.actionViewIntent(path, mimeType);
      return;
    } catch {
      // No viewer for this type — offer the share sheet instead.
    }
  }

  await Share.open({
    url: `file://${path}`,
    type: mimeType,
    failOnCancel: false,
  });
}

/**
 * Save an attachment to the device.
 *
 * Android: public Downloads first, then the app's own external folder. Both are
 * real local files — the share sheet (Drive, Gmail, ...) is never used here, so
 * saving works without a cloud account.
 * iOS: the share sheet is the only way to reach the Files app.
 */
export async function saveAttachmentToDevice(
  rawUrl: string,
  fileName?: string,
): Promise<AttachmentSaveResult> {
  const cachePath = await downloadAttachmentToCache(rawUrl, fileName);
  const safeName = sanitizeFileName(fileName, rawUrl);

  if (Platform.OS === 'android') {
    const mimeType = getAttachmentMimeType(fileName || rawUrl);
    try {
      await ensureLegacyStorageWritePermission();
      await copyToAndroidDownloads(cachePath, safeName, mimeType);
      return {
        success: true,
        message: `Saved to Downloads: ${safeName}`,
        filePath: `${RNFS.DownloadDirectoryPath}/${safeName}`,
      };
    } catch {
      // Fall through to the app's own folder so the file still lands locally.
    }

    try {
      const appDir = `${RNFS.ExternalDirectoryPath}/Downloads`;
      await RNFS.mkdir(appDir);
      const dest = `${appDir}/${safeName}`;
      await RNFS.copyFile(cachePath, dest);
      return {
        success: true,
        message: `Saved to app storage: ${safeName}`,
        filePath: dest,
      };
    } catch {
      return {
        success: false,
        message: 'Could not save the file to this device.',
        filePath: cachePath,
      };
    }
  }

  await Share.open({
    url: `file://${cachePath}`,
    type: getAttachmentMimeType(fileName || rawUrl),
    title: `Save ${safeName}`,
    failOnCancel: false,
  });
  return {
    success: true,
    message: 'Choose where to save the file.',
    filePath: cachePath,
  };
}
