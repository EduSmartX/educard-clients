/**
 * Teacher Timetable Screen
 * View timetable for a specific teacher with day-by-day vertical layout.
 * - Subject color coding
 * - Current period highlighting
 * - Teacher selector dropdown
 */

import {
  DAY_LABELS,
  getRoleGradient,
  getSlotStatus,
  SLOT_STATUS,
  SUBJECT_COLOR_PALETTE,
  type TimetableEntry,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, BookOpen, MapPin } from 'lucide-react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { FormDropdown } from '@/components/forms';
import { useManageableUsers } from '@/hooks/use-manageable-users';
import { useMyTimetable, useTeacherTimetable } from '@/features/timetable';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import { formatTime } from '@/utils/format-time';
import { isAdminRole } from '@/utils/role-utils';

const gradient = getRoleGradient('admin');

export default function TeacherTimetableScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  });
  const [refreshing, setRefreshing] = useState(false);

  // Fetch manageable users for teacher dropdown (only for admins)
  const { data: manageableUsers, isLoading: usersLoading } = useManageableUsers('staff', isAdmin);

  // Fetch timetable
  const {
    data: teacherTimetable,
    isLoading: ttLoading,
    refetch: refetchTeacher,
  } = useTeacherTimetable(selectedTeacherId || undefined);

  const { data: myTimetable, isLoading: myLoading, refetch: refetchMy } = useMyTimetable();

  const timetableData = selectedTeacherId ? teacherTimetable : myTimetable;
  const isLoading = selectedTeacherId ? ttLoading : myLoading;

  // Teacher options from manageable users
  const teacherOptions = useMemo(() => {
    return (manageableUsers ?? []).map((u) => ({
      label: u.full_name,
      value: u.public_id,
    }));
  }, [manageableUsers]);

  const dropdownLoading = usersLoading;

  // Auto-select first teacher (only for admins)
  useEffect(() => {
    if (isAdmin && !selectedTeacherId && teacherOptions.length > 0) {
      setSelectedTeacherId(teacherOptions[0].value);
    }
  }, [teacherOptions, selectedTeacherId, isAdmin]);

  // Day entries
  const dayEntries: TimetableEntry[] = useMemo(() => {
    if (!timetableData?.days) return [];
    const entries = timetableData.days[String(selectedDay)] ?? [];
    return [...entries].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timetableData, selectedDay]);

  // Current day check
  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const isToday = selectedDay === todayIndex;

  // Available days
  const availableDays = useMemo(() => {
    if (!timetableData?.days) return [0, 1, 2, 3, 4, 5];
    return Object.keys(timetableData.days)
      .map(Number)
      .sort((a, b) => a - b);
  }, [timetableData]);

  // Unique classes for legend & color mapping
  const classNames = useMemo(() => {
    return [
      ...new Set(
        dayEntries.map((e) => e.class_name).filter((name): name is string => Boolean(name))
      ),
    ];
  }, [dayEntries]);

  // Build a color map keyed by class_name using shared palette
  const classColorMap = useMemo(() => {
    const map = new Map<string, string>();
    classNames.forEach((name, idx) => {
      map.set(name, SUBJECT_COLOR_PALETTE[idx % SUBJECT_COLOR_PALETTE.length].hex);
    });
    return map;
  }, [classNames]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedTeacherId) await refetchTeacher();
    else await refetchMy();
    setRefreshing(false);
  };

  return (
    <View style={layoutStyles.screen}>
      {/* Header */}
      <LinearGradient colors={gradient} style={headerStyles.gradient}>
        <View style={headerStyles.content}>
          <View style={headerStyles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={headerStyles.backBtn}>
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={headerStyles.title}>Teacher Timetable</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        {/* Teacher Dropdown (admins only) */}
        {isAdmin && (
          <View style={styles.dropdownSection}>
            <FormDropdown
              label="Select Teacher"
              options={teacherOptions}
              value={selectedTeacherId}
              onChange={setSelectedTeacherId}
              placeholder="Choose a teacher..."
              loading={dropdownLoading}
              searchable
            />
          </View>
        )}

        {/* Teacher Name Banner */}
        {timetableData?.teacher_name && !isLoading && (
          <View style={styles.teacherBanner}>
            <View style={styles.teacherAvatar}>
              <Text style={styles.teacherAvatarText}>
                {timetableData.teacher_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.teacherName}>{timetableData.teacher_name}</Text>
          </View>
        )}

        {/* Day Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
          {availableDays.map((day) => {
            const isActive = day === selectedDay;
            const isTodayDay = day === todayIndex;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayPill,
                  isActive && styles.dayPillActive,
                  isTodayDay && !isActive && styles.dayPillToday,
                ]}
              >
                <Text style={[styles.dayPillText, isActive && styles.dayPillTextActive]}>
                  {(DAY_LABELS[day] ?? `Day ${day}`).slice(0, 3)}
                </Text>
                {isTodayDay && (
                  <View style={[styles.todayDot, isActive && styles.todayDotActive]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Loading */}
        {isLoading && (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}

        {/* Empty state */}
        {!isLoading && dayEntries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏖️</Text>
            <Text style={styles.emptyTitle}>No Classes</Text>
            <Text style={styles.emptySubtitle}>
              No scheduled classes on {DAY_LABELS[selectedDay]}.
            </Text>
          </View>
        )}

        {/* Period rows */}
        {!isLoading && dayEntries.length > 0 && (
          <View style={styles.periodsContainer}>
            {dayEntries.map((entry, index) => {
              const status = isToday
                ? getSlotStatus(entry.start_time, entry.end_time)
                : SLOT_STATUS.UPCOMING;
              const isCurrent = isToday && status === SLOT_STATUS.CURRENT;
              const isPast = isToday && status === SLOT_STATUS.PAST;
              const isBreak = entry.slot_type === 'short_break' || entry.slot_type === 'long_break';

              const classColor = classColorMap.get(entry.class_name ?? '') ?? '#6366f1';

              if (isBreak) {
                return (
                  <Animated.View
                    key={`break-${entry.start_time}`}
                    entering={FadeInDown.delay(index * 50)}
                    style={styles.breakRow}
                  >
                    <Text style={styles.breakText}>
                      ☕ {entry.slot_label || 'Break'} • {formatTime(entry.start_time)} –{' '}
                      {formatTime(entry.end_time)}
                    </Text>
                  </Animated.View>
                );
              }

              return (
                <Animated.View
                  key={entry.public_id || `period-${entry.start_time}`}
                  entering={FadeInDown.delay(index * 50)}
                  style={[
                    styles.periodRow,
                    { borderLeftColor: classColor },
                    isCurrent && styles.periodRowCurrent,
                    isPast && styles.periodRowPast,
                  ]}
                >
                  {/* Period number */}
                  <View style={[styles.periodBadge, { backgroundColor: classColor + '20' }]}>
                    <Text style={[styles.periodBadgeText, { color: classColor }]}>
                      {entry.slot_label?.replace(/\D/g, '') || index + 1}
                    </Text>
                  </View>

                  {/* Content */}
                  <View style={styles.periodContent}>
                    <View style={styles.periodTimeRow}>
                      <Clock size={12} color="#6b7280" />
                      <Text style={styles.periodTime}>
                        {formatTime(entry.start_time)} – {formatTime(entry.end_time)}
                      </Text>
                    </View>

                    <Text style={[styles.periodSubject, { color: classColor }]}>
                      {entry.subject_name || 'Unassigned'}
                    </Text>

                    <View style={styles.periodMeta}>
                      <BookOpen size={12} color="#9ca3af" />
                      <Text style={styles.periodClass}>{entry.class_name}</Text>
                      {!!entry.room && (
                        <>
                          <MapPin size={12} color="#9ca3af" />
                          <Text style={styles.periodClass}>{entry.room}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Status badge */}
                  {isCurrent && (
                    <View style={styles.nowBadge}>
                      <Text style={styles.nowBadgeText}>NOW</Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Class legend */}
        {!isLoading && classNames.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>CLASSES</Text>
            <View style={styles.legendItems}>
              {classNames.map((name) => {
                const color = classColorMap.get(name) ?? '#6366f1';
                return (
                  <View key={name} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: color }]} />
                    <Text style={styles.legendText}>{name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { paddingBottom: 40 },
  dropdownSection: { paddingHorizontal: 16, paddingTop: 16 },
  teacherBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  teacherName: { marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#4338ca' },
  daySelector: { marginTop: 16, paddingLeft: 16 },
  dayPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dayPillToday: {
    borderColor: '#a5b4fc',
  },
  dayPillText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  dayPillTextActive: { color: '#fff' },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginTop: 3,
  },
  todayDotActive: { backgroundColor: '#fff' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  periodsContainer: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  breakText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  periodRowCurrent: {
    backgroundColor: '#f0fdf4',
    shadowOpacity: 0.08,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  periodRowPast: { opacity: 0.5 },
  periodBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBadgeText: { fontSize: 16, fontWeight: '800' },
  periodContent: { flex: 1, marginLeft: 12 },
  periodTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  periodTime: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  periodSubject: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  periodMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  periodClass: { fontSize: 12, color: '#6b7280' },
  nowBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  nowBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  legend: {
    marginHorizontal: 16,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 8,
  },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#374151', fontWeight: '500' },
});
