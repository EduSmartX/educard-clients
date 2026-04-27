/**
 * Employee Schedule / My Timetable Screen
 * Shows the logged-in teacher's weekly timetable
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, BookOpen, User, Calendar } from 'lucide-react-native';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { useMyTimetable } from '@/features/timetable';
import {
  DAY_SHORT_LABELS,
  DAY_LABELS,
  SLOT_TYPE_LABELS,
  BREAK_TYPES,
  type TimetableEntry,
} from '@/features/timetable/types';
import { headerStyles, layoutStyles, emptyStyles } from '@/styles';

const empGradient = getRoleGradient('employee');

const SLOT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  period: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  lunch_break: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  short_break: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  assembly: { bg: '#fae8ff', border: '#e879f9', text: '#86198f' },
  free_period: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  special: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
};

function formatTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function EmployeeScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dayScrollRef = useRef<ScrollView>(null);

  const todayIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const { data: timetable, isLoading, refetch } = useMyTimetable();

  const availableDays = useMemo(() => {
    if (!timetable?.days) return [];
    return Object.keys(timetable.days)
      .map(Number)
      .sort((a, b) => a - b);
  }, [timetable]);

  useEffect(() => {
    if (availableDays.length > 0 && selectedDay === null) {
      const day = availableDays.includes(todayIndex) ? todayIndex : availableDays[0];
      setSelectedDay(day);
      const tabIndex = availableDays.indexOf(day);
      setTimeout(() => {
        dayScrollRef.current?.scrollTo({ x: Math.max(0, tabIndex * 78 - 40), animated: true });
      }, 100);
    }
  }, [availableDays, selectedDay, todayIndex]);

  const activeDay = selectedDay ?? availableDays[0] ?? 0;

  const daySlots: TimetableEntry[] = useMemo(() => {
    if (!timetable?.days) return [];
    return timetable.days[activeDay.toString()] || [];
  }, [timetable, activeDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderSlotCard = (slot: TimetableEntry, index: number) => {
    const isBreak = BREAK_TYPES.has(slot.slot_type);
    const c = SLOT_COLORS[slot.slot_type] || SLOT_COLORS.period;

    return (
      <View
        key={slot.public_id || index}
        style={[styles.slotCard, { backgroundColor: c.bg, borderLeftColor: c.border }]}
      >
        <View style={styles.slotTime}>
          <Clock size={12} color={c.text} />
          <Text style={[styles.slotTimeText, { color: c.text }]}>
            {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
          </Text>
          <View style={[styles.slotTypeBadge, { backgroundColor: c.border + '40' }]}>
            <Text style={[styles.slotTypeText, { color: c.text }]}>
              {SLOT_TYPE_LABELS[slot.slot_type] || slot.slot_label}
            </Text>
          </View>
        </View>

        {isBreak ? (
          <Text style={[styles.breakLabel, { color: c.text }]}>{slot.slot_label}</Text>
        ) : (
          <View style={styles.slotContent}>
            <View style={styles.slotRow}>
              <BookOpen size={14} color={c.text} />
              <Text style={[styles.slotSubject, { color: c.text }]}>
                {slot.subject_name || 'No subject assigned'}
              </Text>
            </View>
            <View style={styles.slotRow}>
              <User size={14} color="#64748b" />
              <Text style={styles.slotClass}>{slot.class_name}</Text>
            </View>
            {slot.room ? <Text style={styles.slotRoom}>Room: {slot.room}</Text> : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <LinearGradient colors={empGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <View style={{ width: 40 }} />
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>My Schedule</Text>
              <Text style={headerStyles.subtitle}>
                {timetable?.teacher_name || 'Weekly timetable'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      {/* Day tabs */}
      {availableDays.length > 0 && (
        <View style={styles.dayTabContainer}>
          <ScrollView
            ref={dayScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayTabScroll}
          >
            {availableDays.map((day) => {
              const isActive = day === activeDay;
              const isToday = day === todayIndex;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayTab, isActive && styles.dayTabActive]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                    {DAY_SHORT_LABELS[day]}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={emptyStyles.container}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={emptyStyles.subtitle}>Loading timetable…</Text>
          </View>
        ) : daySlots.length === 0 ? (
          <View style={emptyStyles.container}>
            <Calendar size={48} color="#94a3b8" />
            <Text style={emptyStyles.title}>No Classes</Text>
            <Text style={emptyStyles.subtitle}>
              {availableDays.length === 0
                ? 'No timetable has been assigned yet.'
                : `No slots for ${DAY_LABELS[activeDay]}.`}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.dayTitle}>
              {DAY_LABELS[activeDay]} — {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
            </Text>
            {daySlots.map(renderSlotCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayTabContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dayTabScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dayTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    minWidth: 64,
  },
  dayTabActive: { backgroundColor: '#6366f1' },
  dayTabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  dayTabTextActive: { color: '#fff' },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 4,
  },
  dayTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  slotCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  slotTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  slotTimeText: { fontSize: 12, fontWeight: '600' },
  slotTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  slotTypeText: { fontSize: 10, fontWeight: '700' },
  breakLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },
  slotContent: { gap: 4 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotSubject: { fontSize: 15, fontWeight: '700', flex: 1 },
  slotClass: { fontSize: 13, color: '#64748b' },
  slotRoom: { fontSize: 12, color: '#94a3b8', marginTop: 2, marginLeft: 22 },
});
