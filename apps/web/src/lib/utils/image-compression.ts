/**
 * Client-side image compression.
 *
 * Downscales and re-encodes an image so it fits under a byte budget *before* upload,
 * so large phone/tablet camera photos succeed instead of being rejected for size.
 * Runs entirely in the browser (canvas) — no network, no dependency.
 */

interface CompressOptions {
  /** Longest edge in pixels. Larger images are scaled down to this. */
  maxDimension?: number;
  /** Target maximum output size in bytes. */
  maxSizeBytes?: number;
  /** Output format. */
  mimeType?: 'image/jpeg' | 'image/webp';
}

const DEFAULTS = {
  maxDimension: 1600,
  maxSizeBytes: 5 * 1024 * 1024,
  mimeType: 'image/jpeg' as const,
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image.'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Compress an image file, returning a new File under `maxSizeBytes` when possible.
 * If the browser can't decode the file (e.g. HEIC), the original is returned unchanged
 * so the caller's own type/size validation can handle it.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  const { maxDimension, maxSizeBytes, mimeType } = { ...DEFAULTS, ...options };

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }

  const { width, height } = img;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return file;
  }
  // White backdrop so transparent PNGs don't turn black when flattened to JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);
  ctx.drawImage(img, 0, 0, targetW, targetH);

  let quality = 0.9;
  let blob = await canvasToBlob(canvas, mimeType, quality);
  while (blob && blob.size > maxSizeBytes && quality > 0.4) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, mimeType, quality);
  }

  if (!blob || blob.size >= file.size) {
    return file;
  }

  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.${ext}`, { type: mimeType, lastModified: Date.now() });
}
