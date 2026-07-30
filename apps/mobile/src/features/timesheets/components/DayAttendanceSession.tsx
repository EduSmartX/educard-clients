/**
 * DayAttendanceSession - A single session toggle (Morning/Afternoon)
 * Extracted to reduce cognitive complexity of DayAttendanceModal.
 */

import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DayAttendanceSessionProps {
  icon: ReactNode;
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
      style={[styles.session, { backgroundColor: bgColor, borderColor }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.status, { color: statusColor }]}>{statusText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  session: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  status: {
    fontSize: 12,
    marginTop: 4,
  },
});
