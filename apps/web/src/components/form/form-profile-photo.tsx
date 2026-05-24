/**
 * Form Profile Photo Upload Component
 *
 * Reusable profile photo uploader for teacher/student create & edit forms.
 *
 * - In EDIT mode: uploads directly via the managed-user attachment endpoint.
 * - In CREATE mode: holds the file and exposes it via `onFileSelected` so the
 *   parent can upload after the entity is created.
 * - In VIEW mode: displays the current photo (read-only).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Trash2, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { getMediaUrl } from '@/lib/utils/media-utils';
import type { ProfileImage } from '@/features/profile/types/profile.types';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface FormProfilePhotoProps {
  /** Current mode */
  mode: 'create' | 'edit' | 'view';
  /** User's public_id — required in edit/view mode to fetch/upload */
  userPublicId?: string;
  /** Current thumbnail URL (from list data or detail data) */
  currentThumbnailUrl?: string | null;
  /** Name for initials fallback */
  name?: string;
  /** Gender for avatar fallback */
  gender?: string;
  /** Called when a file is selected in create mode (parent stores it for post-create upload) */
  onFileSelected?: (file: File | null) => void;
  /** Whether the form is submitting */
  disabled?: boolean;
}

export function FormProfilePhoto({
  mode,
  userPublicId,
  currentThumbnailUrl,
  name,
  gender: _gender,
  onFileSelected,
  disabled = false,
}: FormProfilePhotoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [fetchedThumbnail, setFetchedThumbnail] = useState<string | null>(null);

  const isViewMode = mode === 'view';

  // Auto-fetch current photo for edit/view mode
  useEffect(() => {
    if (!userPublicId || mode === 'create') {
      return;
    }
    let cancelled = false;
    api
      .get<ApiResponse<ProfileImage | null>>(API_ENDPOINTS.ATTACHMENTS.USER_PHOTO(userPublicId))
      .then((res) => {
        if (!cancelled && res.data?.data?.thumbnail_url) {
          setFetchedThumbnail(res.data.data.thumbnail_url);
        }
      })
      .catch(() => {
        // Silently ignore — no photo is fine
      });
    return () => {
      cancelled = true;
    };
  }, [userPublicId, mode]);

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size must be under ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  }, []);

  const uploadForUser = useCallback(
    async (file: File) => {
      if (!userPublicId) {
        return;
      }
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('image_type', 'profile_photo');

        const response = await api.post<ApiResponse<ProfileImage>>(
          API_ENDPOINTS.ATTACHMENTS.USER_PHOTO_UPLOAD(userPublicId),
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        const thumbUrl = response.data?.data?.thumbnail_url;
        if (thumbUrl) {
          setUploadedUrl(thumbUrl);
        }
        setDeleted(false);
        toast.success('Profile photo uploaded.');
      } catch {
        toast.error('Failed to upload photo.');
      } finally {
        setIsUploading(false);
        setPreview(null);
      }
    },
    [userPublicId]
  );

  const deleteForUser = useCallback(async () => {
    if (!userPublicId) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.ATTACHMENTS.USER_PHOTO(userPublicId));
      setUploadedUrl(null);
      setDeleted(true);
      toast.success('Profile photo deleted.');
    } catch {
      toast.error('Failed to delete photo.');
    } finally {
      setIsDeleting(false);
    }
  }, [userPublicId]);

  const handleFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) {
        return;
      }

      if (mode === 'create') {
        // In create mode: show preview and pass file to parent
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onFileSelected?.(file);
      } else if (mode === 'edit' && userPublicId) {
        // In edit mode: upload directly
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        uploadForUser(file);
      }
    },
    [mode, userPublicId, validateFile, onFileSelected, uploadForUser]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    if (mode === 'create') {
      setPreview(null);
      onFileSelected?.(null);
    } else if (mode === 'edit') {
      deleteForUser();
    }
  }, [mode, onFileSelected, deleteForUser]);

  // Determine what to display
  const resolvedUrl =
    preview ||
    (uploadedUrl ? getMediaUrl(uploadedUrl) : null) ||
    (!deleted && fetchedThumbnail ? getMediaUrl(fetchedThumbnail) : null) ||
    (!deleted && currentThumbnailUrl ? getMediaUrl(currentThumbnailUrl) : null);

  const hasPhoto = !!resolvedUrl;
  const initials = name?.charAt(0)?.toUpperCase() || '';
  const isBusy = isUploading || isDeleting || disabled;

  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="border-muted h-20 w-20 border-2">
          {resolvedUrl ? (
            <AvatarImage src={resolvedUrl} alt={name || 'Photo'} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-muted text-muted-foreground text-lg font-semibold">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Camera button overlay */}
        {!isViewMode && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="bg-primary text-primary-foreground hover:bg-primary/90 absolute -right-1 -bottom-1 rounded-full p-1.5 shadow-md transition-colors disabled:opacity-50"
            title="Upload photo"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Upload / Delete buttons */}
      {!isViewMode && (
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
            className="h-8 text-xs"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {hasPhoto ? 'Change Photo' : 'Upload Photo'}
          </Button>

          {hasPhoto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isBusy}
              className="text-destructive hover:text-destructive h-8 text-xs"
            >
              {isDeleting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Remove
            </Button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
