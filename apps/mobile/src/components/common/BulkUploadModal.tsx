/**
 * BulkUploadModal - Reusable Bulk Upload Component for React Native
 * Minimal version without problematic dependencies
 */

import * as DocumentPicker from 'expo-document-picker';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';

// Types
export interface BulkUploadError {
  row: number;
  error: string;
  data?: Record<string, unknown> | null;
}

export interface BulkUploadResult {
  success?: boolean;
  created_count?: number;
  successful_count?: number;
  failed_count: number;
  total_rows?: number;
  errors: BulkUploadError[];
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: BulkUploadResult;
  code: number;
}

interface BulkUploadModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  downloadTemplate: () => Promise<
    { success: boolean; message: string; filePath?: string } | ArrayBuffer | Blob
  >;
  uploadFile: (fileUri: string, fileName: string) => Promise<BulkUploadResponse>;
  onUploadSuccess?: (result: BulkUploadResult) => void;
  templateFileName?: string;
  customInfoMessage?: string;
}

function transformErrors(errors: unknown): BulkUploadError[] {
  if (!errors) return [];

  if (typeof errors === 'object' && !Array.isArray(errors)) {
    return Object.entries(errors).map(([rowKey, errorData]: [string, unknown]) => {
      const rowMatch = rowKey.match(/Row (\d+)/i);
      const rowNumber = rowMatch ? Number.parseInt(rowMatch[1], 10) : 0;

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

      return { row: rowNumber, error: errorMessage, data };
    });
  }

  if (Array.isArray(errors)) {
    return errors.map((err: unknown) => {
      const error = err as Record<string, unknown>;
      const rowNum = (error.row_number ?? error.row) as number | undefined;
      const errorErrors = error.errors as Record<string, string> | undefined;
      if (rowNum !== undefined && errorErrors && typeof errorErrors === 'object') {
        if (rowNum === 0 && errorErrors.file) {
          return { row: 0, error: errorErrors.file, data: {} };
        }
        const errorKeys = Object.keys(errorErrors);
        const firstErrorKey = errorKeys[0];
        const errorMessage =
          errorKeys.length > 1
            ? `${errorKeys.length} validation errors`
            : errorErrors[firstErrorKey] || 'Validation error';

        return { row: rowNum, error: errorMessage, data: errorErrors as Record<string, unknown> };
      }
      return {
        row: (error.row as number) || 0,
        error: (error.error as string) || 'Unknown error',
        data: (error.data as Record<string, unknown>) || {},
      };
    });
  }

  return [];
}

function extractUploadErrorResult(error: unknown): BulkUploadResult | null {
  const err = error as {
    data?: { data?: BulkUploadResult; error?: string };
    response?: { data?: { data?: BulkUploadResult; error?: string } };
  };

  let rawResult = err?.data || err?.response?.data;
  if (rawResult && 'data' in rawResult && typeof rawResult.data === 'object') {
    rawResult = rawResult.data as { data?: BulkUploadResult; error?: string };
  }
  if (!rawResult) return null;

  const topLevelError = (rawResult as { error?: string }).error;
  if (topLevelError) {
    return {
      created_count: 0,
      failed_count: 1,
      total_rows: 0,
      errors: [{ row: 0, error: topLevelError, data: null }],
    };
  }

  const data = rawResult as unknown as BulkUploadResult;
  const successCount = data.successful_count ?? 0;
  const createdCount = data.created_count ?? successCount;
  const failedCount = data.failed_count ?? 0;
  return {
    created_count: createdCount,
    failed_count: failedCount,
    total_rows: data.total_rows ?? createdCount + failedCount,
    errors: data.errors ? transformErrors(data.errors) : [],
  };
}

export function BulkUploadModal({
  visible,
  onClose,
  title,
  description,
  downloadTemplate,
  uploadFile,
  onUploadSuccess,
  customInfoMessage,
}: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
  } | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
    onClose();
  }, [onClose]);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadTemplate();

      // Handle new return type with success/message/filePath
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          Alert.alert('Template Ready', result.message);
        } else {
          Alert.alert('Error', result.message || 'Failed to download template');
        }
      } else {
        // Legacy: ArrayBuffer or Blob was returned (shouldn't happen with new APIs)
        Alert.alert(
          'Template Ready',
          'The template download has been initiated. Please check your downloads.'
        );
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err?.message || 'Failed to download template');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? undefined,
        });
        setUploadResult(null);
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err?.message || 'Failed to select file');
    }
  };

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    setUploadResult(null);
    setIsUploading(true);

    try {
      const response = await uploadFile(selectedFile.uri, selectedFile.name);
      const result = response.data;

      // Normalize result
      if (result.successful_count !== undefined && result.created_count === undefined) {
        result.created_count = result.successful_count;
      }
      result.total_rows ??= (result.created_count || 0) + (result.failed_count || 0);
      result.errors = result.errors ? transformErrors(result.errors) : [];

      setUploadResult(result);

      const createdCount = result.created_count ?? 0;
      const failedCount = result.failed_count ?? 0;
      const message =
        failedCount === 0
          ? `${createdCount} record${createdCount > 1 ? 's' : ''} uploaded successfully!`
          : `Created: ${createdCount}, Failed: ${failedCount}`;

      if (failedCount === 0) {
        Alert.alert('Success', message);
        onUploadSuccess?.(result);
      }
    } catch (error) {
      const errorResult = extractUploadErrorResult(error);
      if (errorResult) {
        setUploadResult(errorResult);
      } else {
        const errorMessage = (error as Error)?.message || 'Failed to upload file';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const hasErrors = uploadResult && uploadResult.failed_count > 0;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Text style={styles.headerIcon}>📤</Text>
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.headerSubtitle}>{description}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Custom Info Message */}
            {customInfoMessage && (
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>{customInfoMessage}</Text>
              </View>
            )}

            {/* Step 1: Download Template */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Download Template</Text>
              </View>
              <Text style={styles.stepDescription}>
                Get the Excel template with the correct format
              </Text>
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton]}
                onPress={() => void handleDownloadTemplate()}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <Text style={styles.buttonIcon}>⬇️</Text>
                )}
                <Text style={styles.downloadButtonText}>
                  {isDownloading ? 'Downloading...' : 'Download Template'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step 2: Upload File */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepBadge, { backgroundColor: '#ec4899' }]}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Upload Filled Template</Text>
              </View>
              <Text style={styles.stepDescription}>Select the Excel file with data</Text>

              <TouchableOpacity
                style={styles.fileSelectArea}
                onPress={() => void handleSelectFile()}
                activeOpacity={0.7}
              >
                <Text style={styles.fileIcon}>📊</Text>
                <Text style={styles.fileSelectText}>
                  {selectedFile ? 'Tap to change file' : 'Tap to select Excel file'}
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <View style={styles.selectedFileContainer}>
                  <View style={styles.selectedFileInfo}>
                    <Text style={styles.fileCheckIcon}>✓</Text>
                    <View style={styles.selectedFileTextContainer}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      {selectedFile.size && (
                        <Text style={styles.selectedFileSize}>
                          {formatFileSize(selectedFile.size)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleClearFile} style={styles.clearFileButton}>
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Upload Result Summary */}
            {uploadResult && (
              <View
                style={[
                  styles.resultCard,
                  hasErrors ? styles.resultCardError : styles.resultCardSuccess,
                ]}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultIcon}>{hasErrors ? '⚠️' : '✅'}</Text>
                  <Text
                    style={[
                      styles.resultTitle,
                      hasErrors ? styles.resultTitleError : styles.resultTitleSuccess,
                    ]}
                  >
                    Upload Result
                  </Text>
                </View>

                <View style={styles.resultStats}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>{uploadResult.total_rows ?? 0}</Text>
                  </View>
                  <View style={[styles.statBadge, styles.statBadgeSuccess]}>
                    <Text style={styles.statLabel}>Created</Text>
                    <Text style={[styles.statValue, styles.statValueSuccess]}>
                      {uploadResult.created_count ?? 0}
                    </Text>
                  </View>
                  {hasErrors && (
                    <View style={[styles.statBadge, styles.statBadgeError]}>
                      <Text style={styles.statLabel}>Failed</Text>
                      <Text style={[styles.statValue, styles.statValueError]}>
                        {uploadResult.failed_count}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Error Details */}
            {uploadResult?.errors && uploadResult.errors.length > 0 && (
              <View style={styles.errorsCard}>
                <View style={styles.errorsHeader}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorsTitle}>Errors ({uploadResult.errors.length})</Text>
                </View>
                <ScrollView style={styles.errorsList} nestedScrollEnabled>
                  {uploadResult.errors.map((error, index) => (
                    <View key={index} style={styles.errorItem}>
                      {error.row !== 0 && (
                        <View style={styles.errorRowBadge}>
                          <Text style={styles.errorRowText}>Row {error.row}</Text>
                        </View>
                      )}
                      <Text style={styles.errorMessage}>{error.error}</Text>
                      {error.data &&
                        typeof error.data === 'object' &&
                        Object.keys(error.data).length > 0 && (
                          <View style={styles.errorDetails}>
                            {Object.entries(error.data).map(([key, value]) => (
                              <Text key={key} style={styles.errorDetailText}>
                                <Text style={styles.errorDetailKey}>
                                  {key.replace(/_/g, ' ')}:{' '}
                                </Text>
                                {String(value)}
                              </Text>
                            ))}
                          </View>
                        )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                (!selectedFile || isUploading) && styles.uploadButtonDisabled,
              ]}
              onPress={() => void handleUpload()}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.uploadIcon}>📤</Text>
              )}
              <Text style={styles.uploadButtonText}>{isUploading ? 'Uploading...' : 'Upload'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#7c3aed',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 40,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  stepCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9d5ff',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#581c87',
  },
  stepDescription: {
    fontSize: 13,
    color: '#7e22ce',
    marginLeft: 38,
    marginBottom: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 38,
  },
  downloadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d8b4fe',
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  downloadButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  fileSelectArea: {
    marginLeft: 38,
    borderWidth: 2,
    borderColor: '#d8b4fe',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fileIcon: {
    fontSize: 32,
  },
  fileSelectText: {
    marginTop: 8,
    fontSize: 13,
    color: '#7c3aed',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginLeft: 38,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileCheckIcon: {
    fontSize: 18,
    color: '#16a34a',
    fontWeight: '700',
  },
  selectedFileTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  selectedFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  selectedFileSize: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
  },
  clearFileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  resultCardSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  resultCardError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  resultIcon: {
    fontSize: 18,
  },
  resultTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
  },
  resultTitleSuccess: {
    color: '#166534',
  },
  resultTitleError: {
    color: '#991b1b',
  },
  resultStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  statBadgeSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  statBadgeError: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  statValueSuccess: {
    color: '#16a34a',
  },
  statValueError: {
    color: '#ef4444',
  },
  errorsCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  errorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorsTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
  },
  errorsList: {
    maxHeight: 150,
  },
  errorItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorRowBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  errorRowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  errorMessage: {
    fontSize: 13,
    color: '#991b1b',
    fontWeight: '500',
  },
  errorDetails: {
    marginTop: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    padding: 8,
  },
  errorDetailText: {
    fontSize: 11,
    color: '#991b1b',
    lineHeight: 16,
  },
  errorDetailKey: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7c3aed',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7c3aed',
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    ...Platform.select({
      ios: {
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  uploadButtonDisabled: {
    backgroundColor: '#c4b5fd',
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  uploadIcon: {
    fontSize: 16,
  },
  uploadButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
