/**
 * Today's Schedule Component
 * Reusable schedule display for both Admin and Employee dashboards
 */

import { getSubjectColor } from '@educard/shared';
import { Clock, ChevronRight, AlertCircle } from 'lucide-react-native';
import { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';

import type { TimetableEntry } from '@/features/timetable';

// Day labels (0=Monday, 6=Sunday)
const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface TodayScheduleProps {
  timetableData:
    | { days: Record<number | string, TimetableEntry[]> }
    | undefined;
  isLoading?: boolean;
  maxDisplay?: number;
  onViewAll?: () => void;
}

export function TodaySchedule({
  timetableData,
  isLoading = false,
  maxDisplay = 4,
  onViewAll,
}: TodayScheduleProps) {
  const todayDayNum = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const todayClasses = useMemo((): TimetableEntry[] => {
    if (!timetableData?.days) return [];
    const entries =
      timetableData.days[todayDayNum] ||
      timetableData.days[String(todayDayNum)] ||
      [];
    return [...entries].sort((a, b) => {
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      return timeA.localeCompare(timeB);
    });
  }, [timetableData, todayDayNum]);

  const getClassStatus = useCallback((entry: TimetableEntry) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = (entry.start_time || '00:00')
      .split(':')
      .map(Number);
    const [endH, endM] = (entry.end_time || '00:00').split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= endMinutes) return 'completed';
    if (currentMinutes >= startMinutes && currentMinutes < endMinutes)
      return 'ongoing';
    return 'upcoming';
  }, []);

  const currentOrNextEntry = useMemo(() => {
    for (const entry of todayClasses) {
      const status = getClassStatus(entry);
      if (status === 'ongoing' || status === 'upcoming') {
        return { entry, status };
      }
    }
    return null;
  }, [todayClasses, getClassStatus]);

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (isLoading) {
    return (
      <Animated.View
        entering={FadeInDown.delay(550).springify().damping(15)}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#059669" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </Animated.View>
    );
  }

  if (todayClasses.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(550).springify().damping(15)}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Today&apos;s Schedule — {DAY_LABELS[todayDayNum]}
        </Text>
        <Text style={styles.seeAll}>{todayClasses.length} classes</Text>
      </View>

      {currentOrNextEntry && (
        <View style={styles.nextClassBanner}>
          <View style={styles.nextClassIconBg}>
            {currentOrNextEntry.status === 'ongoing' ? (
              <AlertCircle size={20} color="#059669" />
            ) : (
              <Clock size={20} color="#059669" />
            )}
          </View>
          <View style={styles.nextClassContent}>
            <Text style={styles.nextClassLabel}>
              {currentOrNextEntry.status === 'ongoing'
                ? 'Currently Teaching'
                : 'Next Class'}
            </Text>
            <Text style={styles.nextClassSubject}>
              {currentOrNextEntry.entry.subject_name ??
                currentOrNextEntry.entry.slot_label}
            </Text>
            <Text style={styles.nextClassMeta}>
              {currentOrNextEntry.entry.class_name} •{' '}
              {formatTime(currentOrNextEntry.entry.start_time)} -{' '}
              {formatTime(currentOrNextEntry.entry.end_time)}
            </Text>
          </View>
          <View
            style={[
              styles.nextClassBadge,
              currentOrNextEntry.status === 'ongoing' &&
                styles.nextClassBadgeLive,
            ]}
          >
            <Text
              style={[
                styles.nextClassBadgeText,
                currentOrNextEntry.status === 'ongoing' &&
                  styles.nextClassBadgeTextLive,
              ]}
            >
              {currentOrNextEntry.status === 'ongoing' ? 'Live' : 'Up Next'}
            </Text>
          </View>
        </View>
      )}

      {todayClasses.slice(0, maxDisplay).map((entry, index) => {
        const status = getClassStatus(entry);
        const isCurrentOrNext =
          currentOrNextEntry?.entry.public_id === entry.public_id;
        const subjectColor = getSubjectColor(
          entry.subject_name ?? entry.slot_label ?? 'default',
        );

        return (
          <Animated.View
            key={entry.public_id || index}
            entering={SlideInRight.delay(600 + index * 60)
              .springify()
              .damping(16)}
          >
            <View
              style={[
                styles.scheduleCard,
                isCurrentOrNext && styles.scheduleCardActive,
              ]}
            >
              <View
                style={[
                  styles.scheduleBar,
                  { backgroundColor: subjectColor.hex },
                ]}
              />
              <View style={styles.scheduleTimeBox}>
                <Text
                  style={[
                    styles.scheduleTime,
                    isCurrentOrNext && styles.scheduleTimeActive,
                  ]}
                >
                  {formatTime(entry.start_time)}
                </Text>
              </View>
              <View style={styles.scheduleContent}>
                <Text
                  style={[
                    styles.scheduleSubject,
                    isCurrentOrNext && styles.scheduleSubjectActive,
                  ]}
                >
                  {entry.subject_name ?? entry.slot_label}
                </Text>
                <Text style={styles.scheduleClass}>
                  {entry.class_name}
                  {entry.room && ` • Room ${entry.room}`}
                </Text>
              </View>
              <View
                style={[
                  styles.scheduleStatus,
                  status === 'completed' && styles.scheduleStatusCompleted,
                  status === 'ongoing' && styles.scheduleStatusOngoing,
                ]}
              >
                <Text
                  style={[
                    styles.scheduleStatusText,
                    status === 'completed' &&
                      styles.scheduleStatusTextCompleted,
                    status === 'ongoing' && styles.scheduleStatusTextOngoing,
                  ]}
                >
                  {status === 'completed' && '✓'}
                  {status === 'ongoing' && '●'}
                  {status !== 'completed' && status !== 'ongoing' && '○'}
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      })}

      {todayClasses.length > maxDisplay && (
        <TouchableOpacity style={styles.viewMoreBtn} onPress={onViewAll}>
          <Text style={styles.viewMoreText}>
            View all {todayClasses.length} classes
          </Text>
          <ChevronRight size={16} color="#059669" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.2,
  },
  seeAll: { fontSize: 13, color: '#10b981', fontWeight: '700' },
  nextClassBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  nextClassIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextClassContent: {
    flex: 1,
  },
  nextClassLabel: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextClassSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 2,
  },
  nextClassMeta: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 2,
  },
  nextClassBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextClassBadgeLive: {
    backgroundColor: '#059669',
  },
  nextClassBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  nextClassBadgeTextLive: {
    color: '#fff',
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0fdf4',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduleCardActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  scheduleBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  scheduleTimeBox: {
    width: 60,
    marginRight: 10,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  scheduleTimeActive: {
    color: '#059669',
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  scheduleSubjectActive: {
    color: '#065f46',
  },
  scheduleClass: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  scheduleStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleStatusCompleted: {
    backgroundColor: '#dcfce7',
  },
  scheduleStatusOngoing: {
    backgroundColor: '#ecfdf5',
  },
  scheduleStatusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  scheduleStatusTextCompleted: {
    color: '#16a34a',
  },
  scheduleStatusTextOngoing: {
    color: '#059669',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginRight: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
  },
});
