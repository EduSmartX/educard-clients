/**
 * AttachmentViewer — reusable attachment row that previews images in-app and
 * opens other documents (PDF, CSV, Office, …) in the device's native handler,
 * plus a save-to-device action. Never redirects to the browser.
 *
 * Reuse for leave documents, homework files, submissions, and similar.
 */

import { Download, Eye, FileText, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { showToast } from '@/utils/toast';
import {
  downloadAttachmentToCache,
  isImageAttachment,
  openAttachmentExternally,
  saveAttachmentToDevice,
} from '@/utils/attachment-utils';

interface AttachmentViewerProps {
  /** Raw attachment path/URL from the backend (relative or absolute). */
  url: string;
  fileName?: string;
  /** Secondary line under the name (e.g. file size). */
  subtitle?: string;
  /** Optional caption shown above the row (e.g. "Supporting Document"). */
  label?: string;
}

export function AttachmentViewer({
  url,
  fileName,
  subtitle,
  label,
}: AttachmentViewerProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageVisible, setImageVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const displayName = fileName || 'Attached document';
  const isImage = isImageAttachment(fileName || url);

  const handleView = useCallback(async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    try {
      if (isImage) {
        const path = await downloadAttachmentToCache(url, fileName);
        setImageUri(`file://${path}`);
        setImageVisible(true);
      } else {
        await openAttachmentExternally(url, fileName);
      }
    } catch {
      showToast('error', 'Could not open the attachment.');
    } finally {
      setIsPreparing(false);
    }
  }, [isImage, url, fileName, isPreparing]);

  const handleDownload = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await saveAttachmentToDevice(url, fileName);
      showToast(result.success ? 'success' : 'error', result.message);
    } catch {
      showToast('error', 'Could not download the attachment.');
    } finally {
      setIsSaving(false);
    }
  }, [url, fileName, isSaving]);

  return (
    <View>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.row}>
        <FileText size={16} color="#059669" />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => void handleView()}
          disabled={isPreparing}
          activeOpacity={0.7}
        >
          {isPreparing ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <Eye size={14} color="#047857" />
          )}
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => void handleDownload()}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <Download size={14} color="#047857" />
          )}
          <Text style={styles.actionText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* In-app image preview */}
      <Modal
        visible={imageVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImageVisible(false)}
      >
        <View style={styles.imageOverlay}>
          <View style={styles.imageHeader}>
            <Text style={styles.imageTitle} numberOfLines={1}>
              {displayName}
            </Text>
            <TouchableOpacity
              onPress={() => void handleDownload()}
              hitSlop={12}
              style={styles.imageHeaderBtn}
            >
              <Download size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setImageVisible(false)}
              hitSlop={12}
              style={styles.imageHeaderBtn}
            >
              <X size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.imageBody}>
            {imageLoading && (
              <ActivityIndicator
                size="large"
                color="#fff"
                style={styles.imageSpinner}
              />
            )}
            {!!imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: '#065f46',
  },
  info: {
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#059669',
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 62,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },

  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  imageTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  imageHeaderBtn: {
    padding: 4,
  },
  imageBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSpinner: {
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
