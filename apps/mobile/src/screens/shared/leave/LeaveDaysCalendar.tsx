/**
 * Leave Days Calendar (mobile)
 * Read-only month view that highlights which days of the selected range count
 * as leave vs. holidays/weekends.
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { HolidayInfo } from '@/features/leave';

interface LeaveDaysCalendarProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  holidays: HolidayInfo[];
  accentColor: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

interface MonthWeeks {
  key: string;
  label: string;
  weeks: (Date | null)[][];
}

export function LeaveDaysCalendar({
  startDate,
  endDate,
  holidays,
  accentColor,
}: LeaveDaysCalendarProps) {
  const { months, holidaySet, startTime, endTime } = useMemo(() => {
    const empty = {
      months: [] as MonthWeeks[],
      holidaySet: new Set<string>(),
      startTime: 0,
      endTime: 0,
    };
    if (!startDate || !endDate) return empty;

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    if (end < start) return empty;

    const set = new Set(holidays.map(holiday => holiday.date));
    const list: MonthWeeks[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    let guard = 0;

    while (cursor <= last && guard < 12) {
      guard += 1;
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const firstWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const cells: (Date | null)[] = [];
      for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
      for (let d = 1; d <= daysInMonth; d += 1)
        cells.push(new Date(year, month, d));
      while (cells.length % 7 !== 0) cells.push(null);
      const weeks: (Date | null)[][] = [];
      for (let i = 0; i < cells.length; i += 7)
        weeks.push(cells.slice(i, i + 7));
      list.push({
        key: `${year}-${month}`,
        label: cursor.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        weeks,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return {
      months: list,
      holidaySet: set,
      startTime: start.getTime(),
      endTime: end.getTime(),
    };
  }, [startDate, endDate, holidays]);

  if (months.length === 0) return null;

  return (
    <View>
      {months.map(monthData => (
        <View key={monthData.key} style={styles.monthCard}>
          <Text style={styles.monthLabel}>{monthData.label}</Text>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday, index) => (
              <Text key={`wd-${index}`} style={styles.weekday}>
                {weekday}
              </Text>
            ))}
          </View>
          {monthData.weeks.map((week, weekIndex) => (
            <View key={`w-${weekIndex}`} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                if (!day)
                  return <View key={`d-${dayIndex}`} style={styles.cell} />;
                const time = day.getTime();
                const inRange = time >= startTime && time <= endTime;
                const isHoliday = holidaySet.has(toYmd(day));
                const isLeave = inRange && !isHoliday;
                return (
                  <View
                    key={`d-${dayIndex}`}
                    style={[
                      styles.cell,
                      isLeave && { backgroundColor: accentColor },
                      inRange && isHoliday && styles.holidayCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        isLeave && styles.cellTextLeave,
                        inRange && isHoliday && styles.cellTextHoliday,
                        !inRange && styles.cellTextOutside,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      ))}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendSwatch, { backgroundColor: accentColor }]}
          />
          <Text style={styles.legendText}>Leave day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.holidayCell]} />
          <Text style={styles.legendText}>Holiday / weekend</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthCard: {
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    height: 36,
    margin: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 13,
    color: '#374151',
  },
  cellTextLeave: {
    color: '#ffffff',
    fontWeight: '700',
  },
  holidayCell: {
    backgroundColor: '#fee2e2',
  },
  cellTextHoliday: {
    color: '#b91c1c',
    textDecorationLine: 'line-through',
  },
  cellTextOutside: {
    color: '#cbd5e1',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});
