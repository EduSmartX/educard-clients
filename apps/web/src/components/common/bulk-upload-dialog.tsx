/**
 * Generic Bulk Upload Component
 * Reusable component for downloading templates and uploading bulk data
 * Can be used for Students, Teachers, Holidays, and other modules
 */

import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Download, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ErrorMessages, SuccessMessages } from '@/constants';

// Generic error type for bulk uploads
export interface BulkUploadError {
  row: number;
  error: string;
  data?: Record<string, unknown> | null;
}

// Generic result type for bulk uploads
export interface BulkUploadResult {
  success?: boolean;
  created_count?: number;
  successful_count?: number; // Some APIs use this instead of created_count
  failed_count: number;
  total_rows?: number;
  errors: BulkUploadError[];
}

// Generic API response wrapper
export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: BulkUploadResult;
  code: number;
}

// Client-side validation result type
export interface ClientValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

interface BulkUploadDialogProps {
  // Display configuration
  title: string;
  description: string;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  triggerClassName?: string;

  // API functions
  downloadTemplate: () => Promise<Blob>;
  uploadFile: (file: File) => Promise<BulkUploadResponse>;

  // Cache configuration
  invalidateQueryKeys: string[];

  // Optional customization
  templateFileName?: string;
  acceptedFileTypes?: string;

  // Optional minimal fields functionality
  showMinimalFieldsCheckbox?: boolean;
  isMinimalFields?: boolean;
  onMinimalFieldsChange?: (checked: boolean) => void;
  minimalFieldsLabel?: string;

  // Optional callback after successful upload
  onUploadSuccess?: (result: BulkUploadResult) => void;

  // Optional custom alert/info message to display
  customInfoMessage?: string;

  // Optional client-side validation function
  validateFile?: (file: File) => Promise<ClientValidationResult>;
}

export function BulkUploadDialog({
  title,
  description,
  triggerLabel = 'Bulk Upload',
  triggerVariant = 'outline',
  triggerClassName = '',
  downloadTemplate,
  uploadFile,
  invalidateQueryKeys,
  templateFileName = 'bulk_upload_template.xlsx',
  acceptedFileTypes = '.xlsx,.xls',
  showMinimalFieldsCheckbox = false,
  isMinimalFields = false,
  onMinimalFieldsChange,
  minimalFieldsLabel = 'Minimal Fields Only',
  onUploadSuccess,
  customInfoMessage,
  validateFile,
}: BulkUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Reset file selection
  const resetFileInput = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Download template handler
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = templateFileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success(SuccessMessages.FILES.TEMPLATE_DOWNLOADED);
    } catch (error) {
      const err = error as Error;
      toast.error(err?.message || 'Failed to download template');
    } finally {
      setIsDownloading(false);
    }
  };

  // File change handler
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  // Allow re-selecting the same file
  const handleFileInputClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.currentTarget.value = '';
  };

  const transformErrors = (errors: unknown): BulkUploadError[] => {
    if (!errors) {
      return [];
    }

    if (typeof errors === 'object' && !Array.isArray(errors)) {
      return Object.entries(errors).map(([rowKey, errorData]: [string, unknown]) => {
        const rowMatch = rowKey.match(/Row (\d+)/i);
        const rowNumber = rowMatch ? parseInt(rowMatch[1], 10) : 0;

        let errorMessage = 'Validation error';
        let data: Record<string, unknown> | null = null;
        if (typeof errorData === 'object' && errorData !== null) {
          data = errorData as Record<string, unknown>;
          const firstKey = Object.keys(data)[0];
          errorMessage =
            typeof data[firstKey] === 'string' ? (data[firstKey] as string) : errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }

        return {
          row: rowNumber,
          error: errorMessage,
          data,
        };
      });
    }

    // Handle array format
    if (Array.isArray(errors)) {
      if (errors.length === 0) {
        return [];
      }

      return errors.map((error) => {
        // Handle new backend format: { row_number, errors: {...} } or { row, errors: {...} }
        const rowNum = error.row_number ?? error.row;
        if (rowNum !== undefined && error.errors && typeof error.errors === 'object') {
          // For file-level errors (row: 0), extract the file error message
          if (rowNum === 0 && error.errors.file) {
            return {
              row: 0,
              error: error.errors.file,
              data: {},
            };
          }
          // Extract first error message from errors object
          const errorKeys = Object.keys(error.errors);
          const firstErrorKey = errorKeys[0];
          const errorMessage =
            errorKeys.length > 1
              ? `${errorKeys.length} validation errors`
              : error.errors[firstErrorKey] || 'Validation error';

          return {
            row: rowNum,
            error: errorMessage,
            data: error.errors,
          };
        }
        // Handle old format: { row, error, data }
        return {
          row: error.row || 0,
          error: error.error || 'Unknown error',
          data: error.data || {},
        };
      });
    }

    return [];
  };

  // Normalize result from a successful response
  const normalizeSuccessResult = (result: BulkUploadResult): BulkUploadResult => {
    if (result.successful_count !== undefined && result.created_count === undefined) {
      result.created_count = result.successful_count;
    }
    if (result.total_rows === undefined) {
      result.total_rows = (result.created_count || 0) + (result.failed_count || 0);
    }
    if (result.errors) {
      result.errors = transformErrors(result.errors);
    } else {
      result.errors = [];
    }
    return result;
  };

  // Handle error response and extract result
  const extractErrorResult = (error: unknown): BulkUploadResult | null => {
    const err = error as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any;
      response?: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data?: any;
      };
    };

    let rawResult = err?.data || err?.response?.data;
    if (rawResult && 'data' in rawResult && typeof rawResult.data === 'object') {
      rawResult = rawResult.data;
    }
    if (!rawResult) {
      return null;
    }

    const topLevelError = rawResult.error;
    if (topLevelError) {
      toast.error(topLevelError);
      return {
        created_count: 0,
        failed_count: 1,
        total_rows: 0,
        errors: [{ row: 0, error: topLevelError, data: null }],
      };
    }

    const result: BulkUploadResult = {
      created_count: rawResult.created_count ?? rawResult.successful_count ?? 0,
      failed_count: rawResult.failed_count ?? 0,
      total_rows:
        rawResult.total_rows ??
        (rawResult.created_count ?? rawResult.successful_count ?? 0) +
          (rawResult.failed_count ?? 0),
      errors: rawResult.errors ? transformErrors(rawResult.errors) : [],
    };

    const message = result.failed_count > 0 ? 'Upload failed with errors' : 'Upload failed';
    toast.error(message);
    return result;
  };

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(ErrorMessages.FILE_NOT_SELECTED);
      return;
    }

    setUploadResult(null);
    setIsUploading(true);

    // Run client-side validation if provided
    if (validateFile) {
      try {
        const validationResult = await validateFile(selectedFile);
        if (!validationResult.isValid) {
          // Convert validation errors to BulkUploadResult format
          const clientErrors: BulkUploadError[] = validationResult.errors.map((error) => ({
            row: error.row,
            error: `${error.field}: ${error.message}`,
            data: { field: error.field },
          }));

          const result: BulkUploadResult = {
            created_count: 0,
            failed_count: validationResult.errors.length,
            total_rows: validationResult.errors.length,
            errors: clientErrors,
          };

          setUploadResult(result);
          setIsUploading(false);
          toast.error(`Validation failed: ${validationResult.errors.length} error(s) found`);
          return;
        }
      } catch (validationError) {
        const errorMessage = (validationError as Error)?.message || 'Failed to validate file';
        toast.error(errorMessage);
        setIsUploading(false);
        return;
      }
    }

    try {
      const response = await uploadFile(selectedFile);
      const result = normalizeSuccessResult(response.data);

      setUploadResult(result);

      // Invalidate cache
      invalidateQueryKeys.forEach((key) => {
        queryClient.invalidateQueries({
          queryKey: [key],
        });
      });

      // Show success/partial success toast
      const createdCount = result.created_count ?? 0;
      const failedCount = result.failed_count ?? 0;
      const message =
        failedCount === 0
          ? `${createdCount} record${createdCount > 1 ? 's' : ''} uploaded successfully`
          : `Created: ${createdCount}, Failed: ${failedCount}`;

      if (failedCount === 0) {
        toast.success(message);
      } else {
        toast.error(message);
      }

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      const result = extractErrorResult(error);
      if (result) {
        setUploadResult(result);
      } else {
        const errorMessage = (error as Error)?.message || 'Failed to upload file';
        toast.error(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetFileInput();
  };

  const hasErrors = uploadResult && uploadResult.failed_count > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={`gap-1.5 shadow-md transition-all duration-200 hover:shadow-lg ${triggerClassName}`}
        >
          <Upload className="h-4 w-4" />
          <span className="sm:hidden">Upload</span>
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-hidden border-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-0 sm:w-auto">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 px-6 py-8">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>

          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">{title}</DialogTitle>
                <DialogDescription className="mt-1 text-purple-50">{description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content area */}
        <div className="max-h-[calc(90vh-280px)] overflow-y-auto px-6 py-6">
          <div className="space-y-4">
            {/* Custom Info Message */}
            {customInfoMessage && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  {customInfoMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Minimal Fields Toggle */}
            {showMinimalFieldsCheckbox && (
              <div className="flex items-center justify-between rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm">
                <Label
                  htmlFor="minimal-fields-toggle"
                  className="cursor-pointer text-sm leading-none font-semibold text-purple-900"
                >
                  {minimalFieldsLabel}
                </Label>
                <Switch
                  id="minimal-fields-toggle"
                  checked={isMinimalFields}
                  onCheckedChange={(checked) => onMinimalFieldsChange?.(checked)}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            )}

            {/* Download Template */}
            <div className="flex flex-col gap-4 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600 text-sm font-bold text-white">
                    1
                  </div>
                  <h3 className="text-base font-bold text-purple-900">Download Template</h3>
                </div>
                <p className="mt-1 ml-10 text-sm text-purple-700">
                  Get the Excel template with the correct format
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="w-full flex-shrink-0 gap-2 border-purple-300 bg-white transition-all hover:border-purple-400 hover:bg-purple-50 sm:w-auto"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                ) : (
                  <Download className="h-4 w-4 text-purple-600" />
                )}
                <span className="text-purple-900">Download Template</span>
              </Button>
            </div>

            {/* Upload File */}
            <div className="space-y-3 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-pink-50 to-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-600 text-sm font-bold text-white">
                  2
                </div>
                <h3 className="text-base font-bold text-purple-900">Upload Filled Template</h3>
              </div>
              <p className="mb-3 ml-10 text-sm text-purple-700">Select the Excel file with data</p>
              <div className="ml-10 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFileTypes}
                  onChange={handleFileChange}
                  onClick={handleFileInputClick}
                  className="w-full cursor-pointer rounded-lg border-2 border-dashed border-purple-300 bg-white p-3 text-sm break-all transition-all file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white file:transition-all hover:border-purple-400 hover:bg-purple-50 hover:file:from-purple-700 hover:file:to-pink-700 sm:flex-1 sm:file:mr-4 sm:file:px-4 sm:file:text-sm"
                />
                {selectedFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={resetFileInput}
                    className="self-center hover:bg-red-100 hover:text-red-600 sm:self-auto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedFile && (
                <div className="mt-2 ml-10 rounded-lg bg-purple-100 px-3 py-2 text-sm text-purple-900">
                  <span className="font-semibold">Selected:</span> {selectedFile.name}
                </div>
              )}
            </div>

            {/* Upload Result Summary */}
            {uploadResult && (
              <Alert
                variant={hasErrors ? 'destructive' : 'default'}
                className={
                  hasErrors
                    ? 'border-2 border-red-300 bg-gradient-to-br from-red-50 to-white shadow-md'
                    : 'border-2 border-green-300 bg-gradient-to-br from-green-50 to-white shadow-md'
                }
              >
                {hasErrors ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                <AlertTitle className={hasErrors ? 'text-red-900' : 'text-green-900'}>
                  Upload Result
                </AlertTitle>
                <AlertDescription>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="border border-gray-300 bg-gray-100 text-gray-900"
                    >
                      Total: {uploadResult.total_rows}
                    </Badge>
                    <Badge className="border-0 bg-green-500 text-white hover:bg-green-600">
                      Created: {uploadResult.created_count}
                    </Badge>
                    {hasErrors && (
                      <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
                        Failed: {uploadResult.failed_count}
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Details */}
            {uploadResult?.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-3 rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-bold text-red-900">
                  <AlertCircle className="h-5 w-5" />
                  Errors ({uploadResult.errors.length})
                </h3>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {uploadResult.errors.map((error, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-red-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        {error.row !== 0 && (
                          <Badge variant="destructive" className="mt-0.5 bg-red-500">
                            Row {error.row}
                          </Badge>
                        )}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-red-900">{error.error}</p>
                          {error.data &&
                            typeof error.data === 'object' &&
                            Object.keys(error.data).length > 0 && (
                              <div className="mt-2 space-y-0.5 rounded bg-red-50 p-2 text-xs text-red-700">
                                {Object.entries(error.data).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-semibold capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>{' '}
                                    {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with gradient */}
        <DialogFooter className="gap-3 border-t bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
          <Button variant="brandOutline" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="brand"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="min-w-[120px] gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
