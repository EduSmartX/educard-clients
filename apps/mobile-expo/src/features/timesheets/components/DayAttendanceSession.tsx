/**
 * DayAttendanceSession - A single session toggle (Morning/Afternoon)
 * Extracted to reduce cognitive complexity of DayAttendanceModal.
 */

import { Text, TouchableOpacity } from 'react-native';

interface DayAttendanceSessionProps {
  icon: React.ReactNode;
  label: string;
  isPresent: boolean;
  onToggle: () => void;
}

export function DayAttendanceSession({
  icon,
  label,
  isPresent,
  onToggle,
}: DayAttendanceSessionProps) {
  const bgColor = isPresent ? '#dcfce7' : '#fee2e2';
  const borderColor = isPresent ? '#22c55e' : '#ef4444';
  const labelColor = isPresent ? '#166534' : '#991b1b';
  const statusColor = isPresent ? '#16a34a' : '#dc2626';
  const statusText = isPresent ? 'Present' : 'Absent';

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: bgColor,
        borderColor: borderColor,
        alignItems: 'center',
      }}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {icon}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: labelColor,
          marginTop: 8,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: statusColor,
          marginTop: 4,
        }}
      >
        {statusText}
      </Text>
    </TouchableOpacity>
  );
}
