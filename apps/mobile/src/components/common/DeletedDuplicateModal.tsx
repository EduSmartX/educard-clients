/**
 * DeletedDuplicateModal — Reusable bottom-sheet-style modal
 * Shown when creating an entity and a soft-deleted duplicate exists.
 * Offers: Reactivate Existing · Create New Anyway · Cancel
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { AlertTriangle, RefreshCw, Plus, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface DeletedDuplicateModalProps {
  visible: boolean;
  message: string;
  onReactivate: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  title?: string;
  reactivateLabel?: string;
  createNewLabel?: string;
  isLoading?: boolean;
}

export function DeletedDuplicateModal({
  visible,
  message,
  onReactivate,
  onCreateNew,
  onCancel,
  title = 'Duplicate Record Found',
  reactivateLabel = 'Reactivate Existing',
  createNewLabel = 'Create New Anyway',
  isLoading = false,
}: DeletedDuplicateModalProps) {
  // Highlight text in single quotes (e.g. 'EMP1116')
  const renderMessage = () => {
    const parts = message.split(/('.*?')/g);
    return (
      <Text style={styles.message}>
        {parts.map((part, i) =>
          part.startsWith("'") && part.endsWith("'") ? (
            <Text key={i} style={styles.messageBold}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInDown.duration(300)} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={22} color="#ea580c" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {renderMessage()}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.reactivateBtn]}
              onPress={onReactivate}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={styles.reactivateText}>{reactivateLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.createNewBtn]}
              onPress={onCreateNew}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Plus size={18} color="#475569" />
              <Text style={styles.createNewText}>{createNewLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxWidth: SCREEN_WIDTH,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fff7ed',
    backgroundColor: '#fff7ed',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fed7aa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  messageBold: {
    fontWeight: '700',
    color: '#1e293b',
  },
  actions: {
    paddingHorizontal: 20,
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  reactivateBtn: {
    backgroundColor: '#2563eb',
  },
  reactivateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  createNewBtn: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  createNewText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
});
