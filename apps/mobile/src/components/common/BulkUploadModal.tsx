/**
 * BulkUploadModal - Reusable Bulk Upload Component for React Native
 * (download template → pick Excel file → upload → show per-row results)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';

import {
  transformErrors,
  extractUploadErrorResult,
  type BulkUploadResult,
  type BulkUploadResponse,
} from './bulk-upload/bulk-upload-utils';
import { styles } from './bulk-upload/bulk-upload-styles';

export type {
  BulkUploadError,
  BulkUploadResult,
  BulkUploadResponse,
} from './bulk-upload/bulk-upload-utils';

interface BulkUploadModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  downloadTemplate: () => Promise<
    | { success: boolean; message: string; filePath?: string }
    | ArrayBuffer
    | Blob
  >;
  uploadFile: (
    fileUri: string,
    fileName: string,
  ) => Promise<BulkUploadResponse>;
  onUploadSuccess?: (result: BulkUploadResult) => void;
  customInfoMessage?: string;
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
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null,
  );
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
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          Alert.alert('Template Ready', result.message);
        } else {
          Alert.alert('Error', result.message || 'Failed to download template');
        }
      } else {
        Alert.alert(
          'Template Ready',
          'The template download has been initiated. Please check your downloads.',
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
      const asset = await pick({
        type: [types.xlsx, types.xls],
        copyToCacheDirectory: true,
      });

      if (!asset || asset.length === 0) return;

      const selectedAsset = asset[0];
      setSelectedFile({
        uri: selectedAsset.uri,
        name: selectedAsset.name ?? 'upload.xlsx',
        size: selectedAsset.size ?? undefined,
      });
      setUploadResult(null);
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      )
        return;
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

      if (
        result.successful_count !== undefined &&
        result.created_count === undefined
      ) {
        result.created_count = result.successful_count;
      }
      result.total_rows ??=
        (result.created_count || 0) + (result.failed_count || 0);
      result.errors = result.errors ? transformErrors(result.errors) : [];

      setUploadResult(result);

      const createdCount = result.created_count ?? 0;
      const failedCount = result.failed_count ?? 0;
      const successSuffix = createdCount > 1 ? 's' : '';
      const message =
        failedCount === 0
          ? `${createdCount} record${successSuffix} uploaded successfully!`
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
        const errorMessage =
          (error as Error)?.message || 'Failed to upload file';
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
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

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
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
                <View style={[styles.stepBadge, styles.stepBadgePink]}>
                  <Text style={styles.stepBadgeText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Upload Filled Template</Text>
              </View>
              <Text style={styles.stepDescription}>
                Select the Excel file with data
              </Text>

              <TouchableOpacity
                style={styles.fileSelectArea}
                onPress={() => void handleSelectFile()}
                activeOpacity={0.7}
              >
                <Text style={styles.fileIcon}>📊</Text>
                <Text style={styles.fileSelectText}>
                  {selectedFile
                    ? 'Tap to change file'
                    : 'Tap to select Excel file'}
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
                  <TouchableOpacity
                    onPress={handleClearFile}
                    style={styles.clearFileButton}
                  >
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
                  <Text style={styles.resultIcon}>
                    {hasErrors ? '⚠️' : '✅'}
                  </Text>
                  <Text
                    style={[
                      styles.resultTitle,
                      hasErrors
                        ? styles.resultTitleError
                        : styles.resultTitleSuccess,
                    ]}
                  >
                    Upload Result
                  </Text>
                </View>

                <View style={styles.resultStats}>
                  <View style={styles.statBadge}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>
                      {uploadResult.total_rows ?? 0}
                    </Text>
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
                  <Text style={styles.errorsTitle}>
                    Errors ({uploadResult.errors.length})
                  </Text>
                </View>
                <ScrollView style={styles.errorsList} nestedScrollEnabled>
                  {uploadResult.errors.map(error => (
                    <View
                      key={`${error.row}-${error.error}`}
                      style={styles.errorItem}
                    >
                      {error.row !== 0 && (
                        <View style={styles.errorRowBadge}>
                          <Text style={styles.errorRowText}>
                            Row {error.row}
                          </Text>
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
                                  {key.replaceAll('_', ' ')}:{' '}
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
              <Text style={styles.uploadButtonText}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
