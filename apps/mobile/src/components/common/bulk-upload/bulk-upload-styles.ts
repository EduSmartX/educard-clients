/**
 * BulkUploadModal — styles (extracted to keep the component under the size limit).
 */

import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  stepBadgePink: {
    backgroundColor: '#ec4899',
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
