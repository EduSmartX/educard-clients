/**
 * DayAttendanceModal - Bottom sheet modal for submitting daily attendance
 * Extracted from my-submissions.tsx to reduce cognitive complexity.
 */

import { format } from 'date-fns';
import { Lock, Moon, Send, Sun } from 'lucide-react-native';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

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
  const isLocked = weekTimesheetStatus === 'SUBMITTED' || weekTimesheetStatus === 'APPROVED';
  const statusMessage =
    weekTimesheetStatus === 'APPROVED'
      ? 'Timesheet Approved: You cannot modify this date.'
      : 'Timesheet Submitted: Return to draft to modify.';
  const isFullDayAbsent = !dayMorningPresent && !dayAfternoonPresent;
  const isBusy = isSubmitting || checkingWeekStatus;

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 40,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#e5e7eb',
                borderRadius: 2,
                marginBottom: 16,
              }}
            />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
              Submit Attendance
            </Text>
            {selectedDay && (
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                {format(selectedDay, 'EEEE, MMMM d, yyyy')}
              </Text>
            )}
          </View>

          {/* Timesheet Status Warning */}
          {weekTimesheetStatus && isLocked && (
            <View
              style={{
                backgroundColor: '#fef3c7',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Lock size={16} color="#d97706" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: '#92400e', flex: 1 }}>{statusMessage}</Text>
            </View>
          )}

          {/* Instruction */}
          <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, textAlign: 'center' }}>
            Select the sessions you were present, or mark as absent:
          </Text>

          {/* Session Toggles */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                backgroundColor: dayMorningPresent ? '#dcfce7' : '#fee2e2',
                borderColor: dayMorningPresent ? '#22c55e' : '#ef4444',
                alignItems: 'center',
              }}
              onPress={onToggleMorning}
              activeOpacity={0.7}
            >
              <Sun size={24} color={dayMorningPresent ? '#16a34a' : '#dc2626'} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: dayMorningPresent ? '#166534' : '#991b1b',
                  marginTop: 8,
                }}
              >
                Morning
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: dayMorningPresent ? '#16a34a' : '#dc2626',
                  marginTop: 4,
                }}
              >
                {dayMorningPresent ? 'Present' : 'Absent'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                padding: 16,
                borderRadius: 12,
                borderWidth: 2,
                backgroundColor: dayAfternoonPresent ? '#dcfce7' : '#fee2e2',
                borderColor: dayAfternoonPresent ? '#22c55e' : '#ef4444',
                alignItems: 'center',
              }}
              onPress={onToggleAfternoon}
              activeOpacity={0.7}
            >
              <Moon size={24} color={dayAfternoonPresent ? '#16a34a' : '#dc2626'} />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: dayAfternoonPresent ? '#166534' : '#991b1b',
                  marginTop: 8,
                }}
              >
                Afternoon
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: dayAfternoonPresent ? '#16a34a' : '#dc2626',
                  marginTop: 4,
                }}
              >
                {dayAfternoonPresent ? 'Present' : 'Absent'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mark as Absent Button */}
          <TouchableOpacity
            style={{
              backgroundColor: isFullDayAbsent ? '#ef4444' : '#f3f4f6',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 16,
            }}
            onPress={onMarkAbsent}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isFullDayAbsent ? 'white' : '#6b7280',
              }}
            >
              Mark as Absent (Full Day)
            </Text>
          </TouchableOpacity>

          {/* Submit Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#4f46e5',
              paddingVertical: 14,
              borderRadius: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isBusy ? 0.7 : 1,
            }}
            onPress={onSubmit}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Send size={18} color="white" />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                  Save Attendance
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={{ marginTop: 12, paddingVertical: 12, alignItems: 'center' }}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, color: '#6b7280' }}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
