import { Calendar, Pencil, Trash2 } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

import type { Holiday } from '@/features/holidays';
import { LinearGradient } from '@/lib/linear-gradient';

import { HOLIDAY_TYPE_CONFIG } from './constants';
import { styles } from './styles';
import { formatDate, getDaysBetween } from './utils';

interface HolidayDetailPopupProps {
  visible: boolean;
  holidays: Holiday[];
  date: Date | null;
  canManage: boolean;
  onClose: () => void;
  onEdit: (h: Holiday) => void;
  onDelete: (h: Holiday) => void;
}

export function HolidayDetailPopup({
  visible,
  holidays,
  date,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: HolidayDetailPopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.popupOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.popupCard}>
          {/* Colored header */}
          {holidays.length > 0 && (
            <LinearGradient
              colors={[
                HOLIDAY_TYPE_CONFIG[holidays[0].holiday_type]?.color ||
                  '#7c3aed',
                (HOLIDAY_TYPE_CONFIG[holidays[0].holiday_type]?.color ||
                  '#7c3aed') + 'cc',
              ]}
              style={styles.popupHeader}
            >
              <Text style={styles.popupHeaderIcon}>
                {HOLIDAY_TYPE_CONFIG[holidays[0].holiday_type]?.icon || '📅'}
              </Text>
              <Text style={styles.popupHeaderDate}>
                {date
                  ? date.toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : ''}
              </Text>
            </LinearGradient>
          )}

          {/* Holiday list */}
          {holidays.map((h, i) => {
            const config =
              HOLIDAY_TYPE_CONFIG[h.holiday_type] || HOLIDAY_TYPE_CONFIG.OTHER;
            const duration = getDaysBetween(h.start_date, h.end_date);
            return (
              <View key={h.public_id} style={styles.popupItem}>
                <View style={styles.popupItemHeader}>
                  <Calendar size={14} color={config.color} />
                  <Text style={styles.popupItemTitle}>{h.description}</Text>
                </View>
                <View style={styles.popupItemDetails}>
                  <View
                    style={[
                      styles.popupTypeBadge,
                      { backgroundColor: config.bg },
                    ]}
                  >
                    <Text
                      style={[styles.popupTypeText, { color: config.color }]}
                    >
                      {config.label}
                    </Text>
                  </View>
                  {duration > 1 && (
                    <Text style={styles.popupDuration}>
                      {formatDate(h.start_date)} — {formatDate(h.end_date)} (
                      {duration} days)
                    </Text>
                  )}
                </View>
                {i < holidays.length - 1 && (
                  <View style={styles.popupDivider} />
                )}
              </View>
            );
          })}

          {/* Actions */}
          <View style={styles.popupActions}>
            {canManage && holidays.length === 1 && (
              <TouchableOpacity
                style={styles.popupEditBtn}
                onPress={() => {
                  onClose();
                  onEdit(holidays[0]);
                }}
              >
                <Pencil size={14} color="#7c3aed" />
                <Text style={styles.popupEditText}>Edit</Text>
              </TouchableOpacity>
            )}
            {canManage && holidays.length === 1 && (
              <TouchableOpacity
                style={styles.popupDeleteBtn}
                onPress={() => {
                  onClose();
                  onDelete(holidays[0]);
                }}
              >
                <Trash2 size={14} color="#dc2626" />
                <Text style={styles.popupDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.popupCloseBtn} onPress={onClose}>
              <Text style={styles.popupCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
