/**
 * Media URL Utilities
 * Resolve relative media paths from the backend into full URLs.
 */

/**
 * Backend origin derived from VITE_API_BASE_URL.
 *
 * VITE_API_BASE_URL is like "http://localhost:8000/api" (local)
 * or "https://educard-backend-zgz9.onrender.com/api" (prod).
 *
 * We strip the "/api" suffix to get the bare origin so we can
 * prepend it to media paths like "/media/attachments/...".
 */
const BACKEND_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || 'https://educard-backend-zgz9.onrender.com/api'
).replace(/\/api\/?$/, '');

/**
 * Convert a relative media path from the backend into a full URL.
 *
 * @param path - Relative path like "/media/attachments/org-xxx/..." or ""
 * @returns Full URL like "http://localhost:8000/media/attachments/org-xxx/..."
 *          or empty string if path is falsy
 *
 * @example
 * getMediaUrl("/media/attachments/org-abc/profiles/user-xyz/photo.jpg")
 * // => "http://localhost:8000/media/attachments/org-abc/profiles/user-xyz/photo.jpg"
 */
export function getMediaUrl(path: string | null | undefined): string {
  if (!path) {
    return '';
  }

  // Already a full URL (e.g. GCS signed URL)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${BACKEND_ORIGIN}${path}`;
}
