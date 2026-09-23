/**
 * TimesheetTabContent - calendar grid (Calendar tab) or week cards (Submit Weekly tab).
 * Extracted from my-submissions to keep the screen under the 500-line limit.
 */

import { format } from 'date-fns';
import { View, Text, ActivityIndicator } from 'react-native';

import { TimesheetWeekCard } from '@/features/timesheets/components/TimesheetWeekCard';
import type {
  AttendanceRecord,
  DayState,
  WeekBlock,
} from '@/features/timesheets/types';

import { CalendarDayCell } from './CalendarDayCell';
import { styles } from './my-timesheet-styles';
import { WEEKDAYS_SHORT, toDateKey } from './timesheet-utils';

type WorkingDayPolicy = {
  sunday_off: boolean;
  saturday_off_pattern: string;
} | null;

interface TimesheetTabContentProps {
  activeTab: 'calendar' | 'weeks';
  currentDate: Date;
  monthDays: Date[];
  leadingEmptyDays: unknown[];
  attendanceByDate: Map<string, AttendanceRecord>;
  holidaySet: Set<string>;
  workingDayPolicy: WorkingDayPolicy;
  exceptionsMap: Map<string, { type: string }>;
  onDayClick: (date: Date, state: DayState) => void;
  monthWeeks: { start: Date; end: Date; id: string }[];
  weeks: WeekBlock[];
  loadingWeeks: boolean;
  onExpandToggle: (start: Date, end: Date) => void;
  onToggleAttendance: (
    weekId: string,
    date: string,
    field: 'morning_present' | 'afternoon_present',
  ) => void;
  onSubmitWeek: (week: WeekBlock) => void;
  onReturnToDraft: (week: WeekBlock) => void;
  isSubmitting: boolean;
  isReturningToDraft: boolean;
}

export function TimesheetTabContent({
  activeTab,
  currentDate,
  monthDays,
  leadingEmptyDays,
  attendanceByDate,
  holidaySet,
  workingDayPolicy,
  exceptionsMap,
  onDayClick,
  monthWeeks,
  weeks,
  loadingWeeks,
  onExpandToggle,
  onToggleAttendance,
  onSubmitWeek,
  onReturnToDraft,
  isSubmitting,
  isReturningToDraft,
}: TimesheetTabContentProps) {
  if (activeTab === 'calendar') {
    return (
      <>
        <View style={styles.tipGreen}>
          <Text style={styles.tipTextGreen}>
            💡 Tap on a day to submit or edit your attendance. Submit weekly
            from the Submit Weekly tab.
          </Text>
        </View>
        <View style={styles.calendarCard}>
          <View style={styles.weekdayRow}>
            {WEEKDAYS_SHORT.map((day, idx) => {
              const dayColor = idx === 0 ? '#ef4444' : '#6b7280';
              return (
                <View key={day + idx} style={styles.weekdayCell}>
                  <Text style={[styles.weekdayText, { color: dayColor }]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.calendarGrid}>
            {leadingEmptyDays.map((_, i) => (
              <View key={'e' + i} style={styles.emptyDay} />
            ))}
            {monthDays.map(d => (
              <CalendarDayCell
                key={toDateKey(d)}
                date={d}
                attendanceByDate={attendanceByDate}
                holidaySet={holidaySet}
                workingDayPolicy={workingDayPolicy}
                exceptionsMap={exceptionsMap}
                onDayClick={onDayClick}
              />
            ))}
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <View style={styles.tipBlue}>
        <Text style={styles.tipTextBlue}>
          💡 Tap on a week to view and submit your timesheet. Timesheets are
          submitted weekly.
        </Text>
      </View>
      <Text style={styles.weeksHeading}>
        Weeks in {format(currentDate, 'MMMM yyyy')}
      </Text>
      {loadingWeeks && (
        <View style={styles.loadingWeeks}>
          <ActivityIndicator size="small" color="#0d9488" />
        </View>
      )}
      {monthWeeks.map(weekInfo => (
        <TimesheetWeekCard
          key={weekInfo.id}
          weekInfo={weekInfo}
          week={weeks.find(w => w.id === weekInfo.id)}
          onExpandToggle={onExpandToggle}
          onToggleAttendance={onToggleAttendance}
          onSubmit={onSubmitWeek}
          onReturnToDraft={onReturnToDraft}
          isSubmitting={isSubmitting}
          isReturningToDraft={isReturningToDraft}
        />
      ))}
    </>
  );
}
