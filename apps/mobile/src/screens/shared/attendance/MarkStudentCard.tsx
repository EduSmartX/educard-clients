import { LEAVE_STATUS } from '@educard/shared/constants';
import { View, Text, Image, Switch } from 'react-native';

import type { ComprehensiveAttendanceRecord } from '@/features/attendance';

import { styles } from './mark-styles';

export interface StudentRow extends ComprehensiveAttendanceRecord {
  canEdit: boolean;
}

interface MarkStudentCardProps {
  student: StudentRow;
  isViewMode: boolean;
  onToggle: (
    studentId: string,
    field: 'morning_present' | 'afternoon_present',
    value: boolean,
  ) => void;
}

export function MarkStudentCard({
  student,
  isViewMode,
  onToggle,
}: MarkStudentCardProps) {
  const disabled = !student.canEdit || isViewMode;

  return (
    <View
      style={[
        styles.studentCard,
        !student.canEdit && styles.studentCardDisabled,
      ]}
    >
      <View style={styles.studentInfo}>
        {student.profile_photo_thumbnail ? (
          <Image
            source={{ uri: student.profile_photo_thumbnail }}
            style={styles.studentAvatar}
          />
        ) : (
          <View style={styles.studentAvatarPlaceholder}>
            <Text style={styles.studentAvatarText}>
              {student.first_name.charAt(0)}
              {student.last_name.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.studentDetails}>
          <Text style={styles.studentName}>
            {student.first_name} {student.last_name}
          </Text>
          <Text style={styles.studentMeta}>
            {student.roll_number
              ? `Roll: ${student.roll_number}`
              : student.admission_number}
          </Text>
          {student.leave_status === LEAVE_STATUS.APPROVED && (
            <View style={styles.leaveTag}>
              <Text style={styles.leaveTagText}>
                On Leave - {student.leave_type}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Attendance Toggles */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>AM</Text>
          <Switch
            value={student.morning_present ?? false}
            onValueChange={val =>
              onToggle(student.public_id, 'morning_present', val)
            }
            disabled={disabled}
            trackColor={{ false: '#fee2e2', true: '#bbf7d0' }}
            thumbColor={student.morning_present ? '#16a34a' : '#ef4444'}
          />
        </View>
        <View style={styles.toggleItem}>
          <Text style={styles.toggleLabel}>PM</Text>
          <Switch
            value={student.afternoon_present ?? false}
            onValueChange={val =>
              onToggle(student.public_id, 'afternoon_present', val)
            }
            disabled={disabled}
            trackColor={{ false: '#fee2e2', true: '#bbf7d0' }}
            thumbColor={student.afternoon_present ? '#16a34a' : '#ef4444'}
          />
        </View>
      </View>
    </View>
  );
}
