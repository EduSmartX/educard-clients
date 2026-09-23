/**
 * FormAttachmentPicker - Reusable file/document picker component
 *
 * Used for: Homework attachments, Leave request documents, etc.
 */

import { Colors } from '@educard/shared';
import {
  PaperclipIcon,
  X,
  FileTextIcon,
  ImageIcon,
  FileIcon,
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  pick,
  isErrorWithCode,
  errorCodes,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';

export interface SelectedFile {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface FormAttachmentPickerProps {
  files: SelectedFile[];
  onChange: (files: SelectedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  label?: string;
  buttonText?: string;
  hint?: string;
  disabled?: boolean;
  multiple?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return ImageIcon;
  }
  if (mimeType.includes('pdf')) {
    return FileTextIcon;
  }
  return FileIcon;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function FormAttachmentPicker({
  files,
  onChange,
  maxFiles = 10,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  label = 'Attachments',
  buttonText = 'Add Attachment',
  hint = 'Supported: Images, PDF, Word documents (Max 5MB each)',
  disabled = false,
  multiple = true,
}: FormAttachmentPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const validateAndCollectFiles = useCallback(
    (assets: DocumentPickerResponse[]) => {
      const validFiles: SelectedFile[] = [];
      const errors: string[] = [];

      for (const asset of assets) {
        if (asset.size && asset.size > maxFileSize) {
          errors.push(
            `${asset.name ?? 'File'} exceeds ${formatFileSize(maxFileSize)} limit`,
          );
          continue;
        }

        if (files.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`);
          break;
        }

        validFiles.push({
          uri: asset.uri,
          name: asset.name ?? 'file',
          type: asset.type ?? 'application/octet-stream',
          size: asset.size ?? undefined,
        });
      }

      return { validFiles, errors };
    },
    [files.length, maxFiles, maxFileSize],
  );

  const handlePickAttachment = useCallback(async () => {
    if (disabled) return;

    if (files.length >= maxFiles) {
      Alert.alert('Limit Reached', `Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsLoading(true);
    try {
      const results = await pick({
        type: allowedTypes,
        allowMultiSelection: multiple && files.length < maxFiles - 1,
        copyToCacheDirectory: true,
      });

      if (!results || results.length === 0) return;

      const { validFiles, errors } = validateAndCollectFiles(results);

      if (validFiles.length > 0) {
        onChange([...files, ...validFiles]);
      }

      if (errors.length > 0) {
        Alert.alert('Some files skipped', errors.join('\n'));
      }
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== errorCodes.OPERATION_CANCELED) {
        Alert.alert('Error', 'Failed to pick document');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    files,
    onChange,
    maxFiles,
    allowedTypes,
    multiple,
    disabled,
    validateAndCollectFiles,
  ]);

  const handleRemoveFile = useCallback(
    (index: number) => {
      onChange(files.filter((_, i) => i !== index));
    },
    [files, onChange],
  );

  const canAddMore = files.length < maxFiles && !disabled;

  return (
    <View style={styles.container}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.addButton, !canAddMore && styles.addButtonDisabled]}
        onPress={() => void handlePickAttachment()}
        disabled={!canAddMore || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        ) : (
          <>
            <PaperclipIcon
              size={20}
              color={canAddMore ? Colors.primary[500] : Colors.gray[400]}
            />
            <Text
              style={[
                styles.addButtonText,
                !canAddMore && styles.addButtonTextDisabled,
              ]}
            >
              {buttonText}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {files.length > 0 && (
        <View style={styles.fileList}>
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);
            return (
              <View key={`${file.name}-${index}`} style={styles.fileItem}>
                <View style={styles.fileIcon}>
                  <Icon size={20} color={Colors.primary[500]} />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  {file.size && (
                    <Text style={styles.fileSize}>
                      {formatFileSize(file.size)}
                    </Text>
                  )}
                </View>
                {!disabled && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFile(index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color={Colors.gray[400]} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {maxFiles < 10 && (
        <Text style={styles.countText}>
          {files.length} / {maxFiles} files
        </Text>
      )}

      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray[800],
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary[50],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary[300],
    borderRadius: 12,
    paddingVertical: 16,
  },
  addButtonDisabled: {
    backgroundColor: Colors.gray[50],
    borderColor: Colors.gray[300],
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[600],
  },
  addButtonTextDisabled: {
    color: Colors.gray[400],
  },
  fileList: {
    marginTop: 12,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[800],
  },
  fileSize: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  countText: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 8,
    textAlign: 'right',
  },
  hint: {
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
});

export default FormAttachmentPicker;
