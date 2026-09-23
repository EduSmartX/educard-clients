/**
 * Monthly attendance calendar — day-by-day status grid with month navigation.
 * Mirrors the web student attendance calendar.
 */

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useAttendanceCalendar } from '@/features/student-portal';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  present: { bg: '#d1fae5', text: '#047857' },
  absent: { bg: '#fee2e2', text: '#b91c1c' },
  half_day: { bg: '#fef3c7', text: '#b45309' },
  half_day_first: { bg: '#fef3c7', text: '#b45309' },
  half_day_second: { bg: '#fef3c7', text: '#b45309' },
  holiday: { bg: '#e0f2fe', text: '#0369a1' },
  weekend: { bg: '#f1f5f9', text: '#94a3b8' },
  not_marked: { bg: '#ffffff', text: '#cbd5e1' },
};

const LEGEND = [
  { label: 'Present', color: '#10b981' },
  { label: 'Absent', color: '#ef4444' },
  { label: 'Half day', color: '#f59e0b' },
  { label: 'Holiday', color: '#0ea5e9' },
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function AttendanceCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const month = cursor.getMonth() + 1;
  const year = cursor.getFullYear();

  const { data: days, isLoading } = useAttendanceCalendar(month, year);

  const statusByDate = useMemo(() => {
    const map: Record<string, string> = {};
    for (const day of days ?? []) {
      map[day.date] = day.status;
    }
    return map;
  }, [days]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: (number | null)[] = Array.from(
      { length: firstWeekday },
      () => null,
    );
    for (let day = 1; day <= daysInMonth; day++) result.push(day);
    return result;
  }, [month, year]);

  const shiftMonth = (offset: number) =>
    setCursor(
      prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );

  return (
    <View style={s.card}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => shiftMonth(-1)}
          style={s.navBtn}
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={18} color="#475569" />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{format(cursor, 'MMMM yyyy')}</Text>
        <TouchableOpacity
          onPress={() => shiftMonth(1)}
          style={s.navBtn}
          accessibilityLabel="Next month"
        >
          <ChevronRight size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      <View style={s.weekRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={`${day}-${index}`} style={s.weekCell}>
            <Text style={s.weekText}>{day}</Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator color="#059669" />
        </View>
      ) : (
        <View style={s.grid}>
          {cells.map((day, index) => {
            if (day === null) {
              return <View key={`blank-${index}`} style={s.dayCell} />;
            }
            const key = `${year}-${pad(month)}-${pad(day)}`;
            const status = statusByDate[key];
            const tone = STATUS_STYLES[status] ?? STATUS_STYLES.not_marked;
            return (
              <View key={key} style={s.dayCell}>
                <View style={[s.dayPill, { backgroundColor: tone.bg }]}>
                  <Text style={[s.dayText, { color: tone.text }]}>{day}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={s.legendRow}>
        {LEGEND.map(item => (
          <View key={item.label} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: item.color }]} />
            <Text style={s.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  monthLabel: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  weekRow: { flexDirection: 'row' },
  weekCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6 },
  weekText: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  dayPill: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  dayText: { fontSize: 12, fontWeight: '700' },
  loading: { paddingVertical: 40, alignItems: 'center' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#64748b' },
});
