/**
 * DayAttendanceModal - Bottom sheet modal for submitting daily attendance
 * Extracted from my-submissions.tsx to reduce cognitive complexity.
 */

import { format } from 'date-fns';
import { Lock, Moon, Send, Sun } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { DayAttendanceSession } from './DayAttendanceSession';

interface DayAttendanceModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDay: Date | null;
  weekTimesheetStatus: string | null;
  checkingWeekStatus: boolean;
  dayMorningPresent: boolean;
  dayAfternoonPresent: boolean;
  onToggleMorning: () => void;
  onToggleAfternoon: () => void;
  onMarkAbsent: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function DayAttendanceModal({
  visible,
  onClose,
  selectedDay,
  weekTimesheetStatus,
  checkingWeekStatus,
  dayMorningPresent,
  dayAfternoonPresent,
  onToggleMorning,
  onToggleAfternoon,
  onMarkAbsent,
  onSubmit,
  isSubmitting,
}: DayAttendanceModalProps) {
  const isLocked =
    weekTimesheetStatus === 'SUBMITTED' || weekTimesheetStatus === 'APPROVED';
  const statusMessage =
    weekTimesheetStatus === 'APPROVED'
      ? 'Timesheet Approved: You cannot modify this date.'
      : 'Timesheet Submitted: Return to draft to modify.';
  const isFullDayAbsent = !dayMorningPresent && !dayAfternoonPresent;
  const isBusy = isSubmitting || checkingWeekStatus;
  const absentBtnBg = isFullDayAbsent ? '#ef4444' : '#f3f4f6';
  const absentBtnColor = isFullDayAbsent ? 'white' : '#6b7280';
  const submitOpacity = isBusy ? 0.7 : 1;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Submit Attendance</Text>
            {selectedDay && (
              <Text style={styles.date}>
                {format(selectedDay, 'EEEE, MMMM d, yyyy')}
              </Text>
            )}
          </View>

          {/* Timesheet Status Warning */}
          {weekTimesheetStatus && isLocked && (
            <View style={styles.warning}>
              <Lock size={16} color="#d97706" style={styles.lockIcon} />
              <Text style={styles.warningText}>{statusMessage}</Text>
            </View>
          )}

          {/* Instruction */}
          <Text style={styles.instruction}>
            Select the sessions you were present, or mark as absent:
          </Text>

          {/* Session Toggles */}
          <View style={styles.sessionsRow}>
            <DayAttendanceSession
              icon={
                <Sun
                  size={24}
                  color={dayMorningPresent ? '#16a34a' : '#dc2626'}
                />
              }
              label="Morning"
              isPresent={dayMorningPresent}
              onToggle={onToggleMorning}
            />
            <DayAttendanceSession
              icon={
                <Moon
                  size={24}
                  color={dayAfternoonPresent ? '#16a34a' : '#dc2626'}
                />
              }
              label="Afternoon"
              isPresent={dayAfternoonPresent}
              onToggle={onToggleAfternoon}
            />
          </View>

          {/* Mark as Absent Button */}
          <TouchableOpacity
            style={[styles.absentBtn, { backgroundColor: absentBtnBg }]}
            onPress={onMarkAbsent}
            activeOpacity={0.7}
          >
            <Text style={[styles.absentBtnText, { color: absentBtnColor }]}>
              Mark as Absent (Full Day)
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { opacity: submitOpacity }]}
            onPress={onSubmit}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Send size={18} color="white" />
                <Text style={styles.submitText}>Save Attendance</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
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
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  warning: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  instruction: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  sessionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  absentBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  absentBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
