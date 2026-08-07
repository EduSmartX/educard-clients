/**
 * Attachment utilities — download, open, and save remote attachments locally
 * (auth-aware) instead of handing the URL to the browser.
 *
 * Used by the reusable AttachmentViewer for leave documents, homework files,
 * submissions, and any other supported document.
 */

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

import { apiClient } from '@/api/client';
import { getMediaUrl } from '@/constants/config';

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
 * Open an attachment in the device's native handler (PDF viewer, etc.) via the
 * share sheet — never the browser.
 */
export async function openAttachmentExternally(
  rawUrl: string,
  fileName?: string,
): Promise<void> {
  const path = await downloadAttachmentToCache(rawUrl, fileName);
  await Share.open({
    url: `file://${path}`,
    type: getAttachmentMimeType(fileName || rawUrl),
    failOnCancel: false,
  });
}

/**
 * Save an attachment to the device: Downloads folder on Android, share-to-save
 * on iOS (and as an Android fallback when the Downloads copy is blocked).
 */
export async function saveAttachmentToDevice(
  rawUrl: string,
  fileName?: string,
): Promise<AttachmentSaveResult> {
  const cachePath = await downloadAttachmentToCache(rawUrl, fileName);
  const safeName = sanitizeFileName(fileName, rawUrl);

  if (Platform.OS === 'android') {
    try {
      const dest = `${RNFS.DownloadDirectoryPath}/${safeName}`;
      await RNFS.copyFile(cachePath, dest);
      return {
        success: true,
        message: `Saved to Downloads: ${safeName}`,
        filePath: dest,
      };
    } catch {
      // Scoped storage may block the copy — fall back to the share sheet.
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
