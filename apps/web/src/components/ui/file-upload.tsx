/**
 * Shared File Upload Component
 * Reusable drag & drop file uploader with preview, validation, and reordering
 */

import { memo, useCallback, useState } from 'react';
import { useDropzone, type DropzoneOptions, type FileRejection } from 'react-dropzone';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  GripVertical,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { Button } from './button';
import { cn, formatFileSize } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
}

export interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxSize?: number;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  placeholder?: string;
  helperText?: string;
  showPreview?: boolean;
  allowReorder?: boolean;
  showProgress?: boolean;
  validator?: (file: File) => Promise<string | null>;
  uploadMode?: 'instant' | 'manual';
  onUpload?: (file: File) => Promise<void>;
  disabled?: boolean;
  error?: string;
  compact?: boolean;
  className?: string;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return ImageIcon;
  }
  if (type.startsWith('video/')) {
    return Video;
  }
  if (type === 'application/pdf' || type.includes('document')) {
    return FileText;
  }
  return File;
};

const createFileId = () => `${Date.now()}-${crypto.randomUUID().slice(0, 9)}`;

export const FileUpload = memo(
  ({
    files,
    onFilesChange,
    maxSize = 10 * 1024 * 1024,
    maxFiles,
    accept,
    multiple = true,
    placeholder,
    helperText,
    showPreview = true,
    allowReorder = true,
    showProgress = false,
    validator,
    uploadMode = 'manual',
    onUpload,
    disabled = false,
    error,
    compact = false,
    className,
  }: FileUploadProps) => {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Handle file drop
    const onDrop = useCallback(
      async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        // Handle rejected files
        const errors: Record<string, string> = {};
        rejectedFiles.forEach((rejected) => {
          const error = rejected.errors[0];
          errors[rejected.file.name] = error.message;
        });

        // Validate and create UploadedFile entries
        const validatedFiles: UploadedFile[] = [];
        for (const file of acceptedFiles) {
          const validationError = validator ? await validator(file) : null;
          if (validationError) {
            errors[file.name] = validationError;
            continue;
          }

          const uploadedFile: UploadedFile = {
            id: createFileId(),
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: uploadMode === 'instant' ? 'uploading' : 'pending',
            progress: uploadMode === 'instant' ? 0 : undefined,
            ...(file.type.startsWith('image/') &&
              showPreview && { preview: URL.createObjectURL(file) }),
          };
          validatedFiles.push(uploadedFile);
        }

        setValidationErrors(errors);

        // Add to files list
        const newFiles = [...files, ...validatedFiles];
        onFilesChange(maxFiles ? newFiles.slice(0, maxFiles) : newFiles);

        // Instant upload if enabled
        if (uploadMode === 'instant' && onUpload) {
          for (const uploadedFile of validatedFiles) {
            try {
              await onUpload(uploadedFile.file);
              onFilesChange((currentFiles) =>
                currentFiles.map((f) =>
                  f.id === uploadedFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
                )
              );
            } catch (err) {
              onFilesChange((currentFiles) =>
                currentFiles.map((f) =>
                  f.id === uploadedFile.id
                    ? { ...f, status: 'error' as const, error: (err as Error).message }
                    : f
                )
              );
            }
          }
        }
      },
      [files, maxFiles, uploadMode, validator, onUpload, showPreview, onFilesChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept,
      maxSize,
      multiple,
      disabled,
      maxFiles,
    } as DropzoneOptions);

    const removeFile = useCallback(
      (id: string) => {
        const file = files.find((f) => f.id === id);
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        onFilesChange(files.filter((f) => f.id !== id));
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[file?.name || ''];
          return newErrors;
        });
      },
      [files, onFilesChange]
    );

    const canUploadMore = !maxFiles || files.length < maxFiles;

    return (
      <div className={cn('space-y-3', className)}>
        {/* Drop zone */}
        {canUploadMore && (
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed text-center transition-colors',
              compact ? 'p-4' : 'p-6',
              isDragActive
                ? 'border-primary bg-primary/5'
                : error
                  ? 'border-destructive bg-destructive/5'
                  : 'border-border hover:border-primary/50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload
              className={cn(
                'text-muted-foreground mx-auto',
                compact ? 'mb-1 h-6 w-6' : 'mb-2 h-8 w-8'
              )}
            />
            <p className={cn('text-foreground', compact ? 'text-xs' : 'text-sm')}>
              {isDragActive ? (
                'Drop files here...'
              ) : placeholder ? (
                placeholder
              ) : (
                <>
                  Drag & drop files here, or <span className="text-primary">click to browse</span>
                </>
              )}
            </p>
            {helperText && (
              <p className={cn('text-muted-foreground mt-1', compact ? 'text-xs' : 'text-xs')}>
                {helperText}
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Validation errors */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-destructive/10 space-y-1 rounded-md p-3">
            {Object.entries(validationErrors).map(([filename, error]) => (
              <div key={filename} className="text-destructive flex items-start gap-2 text-xs">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  <strong>{filename}:</strong> {error}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded files list */}
        <AnimatePresence>
          {files.length > 0 && (
            <>
              {allowReorder ? (
                <Reorder.Group
                  axis="y"
                  values={files}
                  onReorder={onFilesChange}
                  className="space-y-2"
                >
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onRemove={removeFile}
                      showProgress={showProgress}
                      compact={compact}
                      allowReorder={allowReorder}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      onRemove={removeFile}
                      showProgress={showProgress}
                      compact={compact}
                      allowReorder={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* File count info */}
        {maxFiles && files.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {files.length} / {maxFiles} files uploaded
            {files.length >= maxFiles && ' (maximum reached)'}
          </p>
        )}
      </div>
    );
  }
);

interface FileItemProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  showProgress: boolean;
  compact: boolean;
  allowReorder: boolean;
}

const FileItem = memo(({ file, onRemove, showProgress, compact, allowReorder }: FileItemProps) => {
  const Icon = getFileIcon(file.type);
  const hasError = file.status === 'error';
  const isSuccess = file.status === 'success';
  const isUploading = file.status === 'uploading';

  const content = (
    <>
      {allowReorder && <GripVertical className="text-muted-foreground h-4 w-4 cursor-grab" />}

      {file.preview ? (
        <img
          src={file.preview}
          alt={file.name}
          className={cn('rounded object-cover', compact ? 'h-10 w-10' : 'h-12 w-12')}
        />
      ) : (
        <Icon
          className={cn(
            compact ? 'h-5 w-5' : 'h-6 w-6',
            hasError ? 'text-destructive' : 'text-primary'
          )}
        />
      )}

      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-medium', compact ? 'text-xs' : 'text-sm')}>{file.name}</p>
        <div className="flex items-center gap-2">
          <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-xs')}>
            {formatFileSize(file.size)}
          </p>
          {hasError && file.error && <span className="text-destructive text-xs">{file.error}</span>}
        </div>

        {/* Progress bar */}
        {showProgress && isUploading && file.progress !== undefined && (
          <div className="bg-muted mt-1 h-1 overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Status icons */}
      {isSuccess && <CheckCircle2 className="h-4 w-4 text-green-500" />}
      {hasError && <AlertCircle className="text-destructive h-4 w-4" />}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'text-muted-foreground hover:text-destructive',
          compact ? 'h-6 w-6' : 'h-8 w-8'
        )}
        onClick={() => onRemove(file.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </>
  );

  if (allowReorder) {
    return (
      <Reorder.Item
        value={file}
        className={cn(
          'bg-card flex items-center gap-3 rounded-lg border p-3',
          hasError && 'border-destructive bg-destructive/5'
        )}
      >
        {content}
      </Reorder.Item>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'bg-card flex items-center gap-3 rounded-lg border p-3',
        hasError && 'border-destructive bg-destructive/5'
      )}
    >
      {content}
    </motion.div>
  );
});

export const FILE_UPLOAD_PRESETS = {
  documents: {
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
    helperText: 'PDF, DOC, DOCX, XLS, XLSX, TXT (max 10MB each)',
  },
  images: {
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxSize: 5 * 1024 * 1024,
    helperText: 'JPG, PNG, GIF, WEBP (max 5MB)',
    maxFiles: 1,
  },
  attachments: {
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    helperText: 'PDF, DOC, DOCX, Images (max 10MB each)',
  },
  media: {
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxSize: 50 * 1024 * 1024,
    helperText: 'Images, Videos (max 50MB each)',
  },
};
