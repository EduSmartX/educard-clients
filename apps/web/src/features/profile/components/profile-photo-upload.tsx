/**
 * Profile Photo Upload Component
 * Upload, preview, and delete profile photo with drag & drop support
 */

import { useCallback, useRef, useState } from 'react';
import { Camera, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useMyProfilePhoto, useUserProfile } from '../hooks/queries';
import { useUploadProfilePhoto, useDeleteProfilePhoto } from '../hooks/mutations';
import { getMediaUrl } from '@/lib/utils/media-utils';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfilePhotoUpload() {
  const { data: profile } = useUserProfile();
  const { data: photo, isLoading } = useMyProfilePhoto();
  const uploadMutation = useUploadProfilePhoto();
  const deleteMutation = useDeleteProfilePhoto();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const initials = profile
    ? `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`.toUpperCase()
    : '?';

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size must be under ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  }, []);

  const handleUpload = useCallback(
    (file: File) => {
      if (!validateFile(file)) {
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      uploadMutation.mutate(file, {
        onSuccess: () => {
          setPreview(null);
          URL.revokeObjectURL(objectUrl);
        },
        onError: () => {
          setPreview(null);
          URL.revokeObjectURL(objectUrl);
        },
      });
    },
    [validateFile, uploadMutation]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const displayUrl = preview || getMediaUrl(photo?.url);
  const thumbnailUrl = getMediaUrl(photo?.thumbnail_url);
  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const hasPhoto = !!photo?.url;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Profile Photo</CardTitle>
        <CardDescription>
          Upload a photo to personalize your profile. Max {MAX_FILE_SIZE_MB}MB, JPEG/PNG/WebP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar Preview */}
          <div className="relative">
            <Avatar className="border-muted h-28 w-28 border-2">
              {isLoading ? (
                <AvatarFallback>
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </AvatarFallback>
              ) : displayUrl ? (
                <AvatarImage src={displayUrl} alt="Profile photo" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-brand/10 text-brand text-2xl font-semibold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-brand hover:bg-brand/90 absolute right-0 bottom-0 rounded-full p-2 text-white shadow-md transition-colors disabled:opacity-50"
              title="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {/* Upload area + info */}
          <div className="flex-1 space-y-4">
            {/* Drag & drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-brand bg-brand/5'
                  : 'border-muted-foreground/25 hover:border-brand/50 hover:bg-muted/50'
              }`}
            >
              <Upload className="text-muted-foreground mx-auto h-8 w-8" />
              <p className="text-foreground mt-2 text-sm font-medium">
                {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                JPEG, PNG, or WebP • Max {MAX_FILE_SIZE_MB}MB
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Photo info + actions */}
            {hasPhoto && (
              <div className="flex items-center gap-3">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="h-10 w-10 rounded border object-cover"
                  />
                )}
                <div className="text-muted-foreground flex-1 text-xs">
                  {photo?.mime_type} •{' '}
                  {photo?.file_size ? `${(photo.file_size / 1024).toFixed(1)} KB` : ''}
                  {photo?.width && photo?.height ? ` • ${photo.width}×${photo.height}` : ''}
                </div>

                {/* Delete button with confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="mr-1 h-3 w-3" />
                      )}
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove profile photo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your profile photo will be permanently deleted. Your initials will be shown
                        instead.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
