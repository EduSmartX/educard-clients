/**
 * LRU Image Cache for Student Profile Photos
 * 
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - Configurable max size
 * - Cache invalidation on image update
 * - Preloading support
 * - Memory-efficient blob storage
 */

interface CacheEntry {
  url: string;
  blobUrl: string;
  lastAccessed: number;
  size: number;
}

class ImageCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private currentSize: number;
  private maxEntries: number;

  constructor(maxSizeMB: number = 50, maxEntries: number = 200) {
    this.cache = new Map();
    this.maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    this.currentSize = 0;
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached blob URL for an image
   * Returns null if not cached
   */
  get(originalUrl: string): string | null {
    const entry = this.cache.get(originalUrl);
    if (entry) {
      // Update last accessed time (LRU)
      entry.lastAccessed = Date.now();
      return entry.blobUrl;
    }
    return null;
  }

  /**
   * Check if URL is cached
   */
  has(originalUrl: string): boolean {
    return this.cache.has(originalUrl);
  }

  /**
   * Add image to cache
   */
  set(originalUrl: string, blob: Blob): string {
    // If already cached, return existing
    const existing = this.get(originalUrl);
    if (existing) {
      return existing;
    }

    // Evict if needed
    while (
      (this.currentSize + blob.size > this.maxSize || 
       this.cache.size >= this.maxEntries) && 
      this.cache.size > 0
    ) {
      this.evictLRU();
    }

    // Create blob URL and cache
    const blobUrl = URL.createObjectURL(blob);
    const entry: CacheEntry = {
      url: originalUrl,
      blobUrl,
      lastAccessed: Date.now(),
      size: blob.size,
    };

    this.cache.set(originalUrl, entry);
    this.currentSize += blob.size;

    return blobUrl;
  }

  /**
   * Remove specific image from cache (for invalidation)
   */
  invalidate(originalUrl: string): void {
    const entry = this.cache.get(originalUrl);
    if (entry) {
      URL.revokeObjectURL(entry.blobUrl);
      this.currentSize -= entry.size;
      this.cache.delete(originalUrl);
    }
  }

  /**
   * Invalidate all images for a student (by student ID pattern)
   */
  invalidateByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.invalidate(key));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.forEach(entry => {
      URL.revokeObjectURL(entry.blobUrl);
    });
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.invalidate(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { entries: number; sizeMB: number; maxSizeMB: number } {
    return {
      entries: this.cache.size,
      sizeMB: Math.round((this.currentSize / (1024 * 1024)) * 100) / 100,
      maxSizeMB: this.maxSize / (1024 * 1024),
    };
  }
}

// Singleton instance
export const imageCache = new ImageCache(50, 200);

/**
 * Hook-friendly function to get or fetch an image with caching
 * For signed URLs (like GCS), we skip fetch caching and return the URL directly
 * since CORS restrictions prevent fetching signed URLs
 */
export async function getCachedImageUrl(originalUrl: string): Promise<string> {
  if (!originalUrl) {
    return '';
  }

  // Skip fetch-based caching for signed URLs (GCS, S3, etc.) due to CORS
  // These URLs already have authentication built in
  if (originalUrl.includes('X-Goog-Signature') || 
      originalUrl.includes('X-Amz-Signature') ||
      originalUrl.includes('storage.googleapis.com') ||
      originalUrl.includes('s3.amazonaws.com')) {
    return originalUrl;
  }

  // Check cache first
  const cached = imageCache.get(originalUrl);
  if (cached) {
    return cached;
  }

  try {
    // Fetch and cache
    const response = await fetch(originalUrl, { 
      mode: 'cors',
      credentials: 'omit' 
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    return imageCache.set(originalUrl, blob);
  } catch {
    // Silently return original URL as fallback for CORS issues
    return originalUrl;
  }
}

/**
 * Preload multiple images into cache
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const uncachedUrls = urls.filter(url => url && !imageCache.has(url));
  
  // Load in parallel, but don't fail if some images fail
  await Promise.allSettled(
    uncachedUrls.map(url => getCachedImageUrl(url))
  );
}

/**
 * Invalidate cache for a specific student
 * Call this when student photo is updated
 */
export function invalidateStudentImage(studentId: string): void {
  imageCache.invalidateByPattern(studentId);
}

/**
 * Clear all cached images
 */
export function clearImageCache(): void {
  imageCache.clear();
}
