/**
 * Send Reminder Modal
 * Allows admin to select notification channel before sending fee reminder
 */

import {
  ReminderChannel,
  REMINDER_CHANNEL_OPTIONS,
  type ReminderChannelType,
  type StudentFee,
} from '@educard/shared';
import { Bell, Mail, MessageSquare, Phone, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface SendReminderModalProps {
  visible: boolean;
  onClose: () => void;
  studentFee: StudentFee | null;
  onSend: (channel: ReminderChannelType) => void;
  isLoading?: boolean;
}

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  [ReminderChannel.EMAIL]: <Mail size={20} color="#3b82f6" />,
  [ReminderChannel.WHATSAPP]: <MessageSquare size={20} color="#25D366" />,
  [ReminderChannel.SMS]: <Phone size={20} color="#f59e0b" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  [ReminderChannel.EMAIL]: '#3b82f6',
  [ReminderChannel.WHATSAPP]: '#25D366',
  [ReminderChannel.SMS]: '#f59e0b',
};

export function SendReminderModal({
  visible,
  onClose,
  studentFee,
  onSend,
  isLoading,
}: SendReminderModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<ReminderChannelType>(
    ReminderChannel.EMAIL,
  );

  const handleSend = () => {
    onSend(selectedChannel);
  };

  if (!studentFee) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={20} color="#7c3aed" />
              <Text style={styles.title}>Send Reminder</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Student Info */}
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{studentFee.student_name}</Text>
            <Text style={styles.studentClass}>
              {studentFee.class_name} • Balance: ₹
              {Number(studentFee.balance_due).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Channel Selection */}
          <Text style={styles.sectionLabel}>Select Channel</Text>
          <View style={styles.channelList}>
            {REMINDER_CHANNEL_OPTIONS.map(option => {
              const isSelected = selectedChannel === option.value;
              const color = CHANNEL_COLORS[option.value] || '#3b82f6';
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.channelOption,
                    isSelected && {
                      borderColor: color,
                      backgroundColor: `${color}10`,
                    },
                  ]}
                  onPress={() =>
                    setSelectedChannel(option.value as ReminderChannelType)
                  }
                >
                  {CHANNEL_ICONS[option.value]}
                  <Text
                    style={[
                      styles.channelLabel,
                      isSelected && styles.channelLabelSelected,
                      isSelected && { color },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={[styles.radioSelected, { borderColor: color }]}
                    >
                      <View
                        style={[styles.radioDot, { backgroundColor: color }]}
                      />
                    </View>
                  )}
                  {!isSelected && <View style={styles.radioUnselected} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.sendBtn, isLoading && styles.dimmed]}
            onPress={handleSend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Bell size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Send Reminder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeBtn: {
    padding: 4,
  },
  studentInfo: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  studentClass: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  channelList: {
    gap: 10,
    marginBottom: 20,
  },
  channelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  channelLabel: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  channelLabelSelected: { fontWeight: '700' },
  dimmed: { opacity: 0.6 },
});
