/**
 * CalendarDayCell - a single day cell in the timesheet month calendar.
 * Extracted from my-submissions to keep the screen under the 500-line limit.
 */

import { format, isToday } from 'date-fns';
import { Check, X } from 'lucide-react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { AttendanceRecord, DayState } from '@/features/timesheets/types';

import { styles } from './my-timesheet-styles';
import { getDayState, stateColors, toDateKey } from './timesheet-utils';

type WorkingDayPolicy = {
  sunday_off: boolean;
  saturday_off_pattern: string;
} | null;

function DayCellIcon({
  state,
  record,
}: {
  state: DayState;
  record?: AttendanceRecord;
}) {
  if (state === 'leave-approved' || state === 'leave-pending') {
    const leaveBg = state === 'leave-approved' ? '#f97316' : '#eab308';
    return (
      <View style={[styles.leaveIcon, { backgroundColor: leaveBg }]}>
        <X size={12} color="white" strokeWidth={3} />
      </View>
    );
  }
  if (state === 'half_day' && record) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path
          d="M 2 12 A 10 10 0 0 0 22 12 Z"
          fill={record.afternoon_present ? '#22c55e' : '#ef4444'}
          stroke="white"
          strokeWidth={0.5}
        />
        <Path
          d="M 2 12 A 10 10 0 0 1 22 12 Z"
          fill={record.morning_present ? '#22c55e' : '#ef4444'}
          stroke="white"
          strokeWidth={0.5}
        />
      </Svg>
    );
  }
  if (state === 'present') {
    return (
      <View style={styles.presentIcon}>
        <Check size={10} color="white" strokeWidth={3} />
      </View>
    );
  }
  if (state === 'absent') {
    return (
      <View style={styles.absentIcon}>
        <X size={10} color="white" strokeWidth={3} />
      </View>
    );
  }
  if (state === 'holiday') {
    return (
      <View style={styles.holidayIcon}>
        <Text style={styles.holidayIconText}>H</Text>
      </View>
    );
  }
  return null;
}

interface CalendarDayCellProps {
  date: Date;
  attendanceByDate: Map<string, AttendanceRecord>;
  holidaySet: Set<string>;
  workingDayPolicy: WorkingDayPolicy;
  exceptionsMap: Map<string, { type: string }>;
  onDayClick: (date: Date, state: DayState) => void;
}

export function CalendarDayCell({
  date,
  attendanceByDate,
  holidaySet,
  workingDayPolicy,
  exceptionsMap,
  onDayClick,
}: CalendarDayCellProps) {
  const dateKey = toDateKey(date);
  const state = getDayState(
    date,
    attendanceByDate,
    holidaySet,
    workingDayPolicy,
    exceptionsMap,
  );
  const colors = stateColors[state];
  const record = attendanceByDate.get(dateKey);
  const isTodayDate = isToday(date);
  const dayNum = format(date, 'd');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const clickedDate = new Date(date);
  clickedDate.setHours(0, 0, 0, 0);
  const isClickable = clickedDate <= today && state !== 'future';
  const cellBorderWidth = isTodayDate ? 2 : 1;
  const cellBorderColor = isTodayDate ? '#3b82f6' : colors.border;

  return (
    <TouchableOpacity
      style={styles.dayCell}
      onPress={() => isClickable && onDayClick(date, state)}
      activeOpacity={isClickable ? 0.7 : 1}
      disabled={!isClickable}
    >
      <View
        style={[
          styles.dayCellInner,
          {
            backgroundColor: colors.bg,
            borderWidth: cellBorderWidth,
            borderColor: cellBorderColor,
          },
        ]}
      >
        <Text style={[styles.dayNum, { color: colors.text }]}>{dayNum}</Text>
        <View style={styles.dayIconWrap}>
          <DayCellIcon state={state} record={record} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
