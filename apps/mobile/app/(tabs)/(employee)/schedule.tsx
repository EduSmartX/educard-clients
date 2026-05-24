/**
 * Employee Schedule Screen
 * Teacher's weekly timetable showing all assigned classes
 */

import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, BookOpen, Building2, Users } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/layout';
import { useMyTimetable } from '@/features/timetable';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface TimetableEntry {
  public_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_label: string;
  slot_type: string;
  class_name: string;
  subject_name: string | null;
  room: string;
  notes: string;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = Number.parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function TimeSlotCard({ entry }: { entry: TimetableEntry }) {
  const isBreak = entry.slot_type === 'break' || entry.slot_type === 'lunch';

  if (isBreak) {
    return (
      <View style={styles.breakCard}>
        <Text style={styles.breakLabel}>{entry.slot_label}</Text>
        <Text style={styles.breakTime}>
          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.slotCard}>
      <View style={styles.slotTimeContainer}>
        <Clock size={14} color="#6b7280" />
        <Text style={styles.slotTime}>
          {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
        </Text>
      </View>

      <View style={styles.slotContent}>
        <View style={styles.slotHeader}>
          <View style={styles.subjectBadge}>
            <BookOpen size={14} color="#3b82f6" />
            <Text style={styles.subjectName}>{entry.subject_name ?? 'Free Period'}</Text>
          </View>
        </View>

        <View style={styles.slotDetails}>
          <View style={styles.detailItem}>
            <Building2 size={12} color="#6b7280" />
            <Text style={styles.detailText}>{entry.class_name}</Text>
          </View>
          {!!entry.room && (
            <View style={styles.detailItem}>
              <Users size={12} color="#6b7280" />
              <Text style={styles.detailText}>{entry.room}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function EmployeeScheduleScreen() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday (0) to index, Mon-Sat (1-6) to 0-5
    return today === 0 ? 0 : today - 1;
  });
  const [refreshing, setRefreshing] = useState(false);

  const { data: timetableData, isLoading, refetch } = useMyTimetable();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const selectedDayName = DAYS_OF_WEEK[selectedDayIndex];

  const dayEntries = useMemo(() => {
    if (!timetableData?.days) return [];
    // The API returns days keyed by day name (e.g., "Monday", "Tuesday")
    const entries = timetableData.days[selectedDayName] || [];
    // Sort by start_time
    return [...entries].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timetableData, selectedDayName]);

  const totalClasses = useMemo(() => {
    if (!timetableData?.days) return 0;
    let count = 0;
    Object.values(timetableData.days).forEach((dayEntries: TimetableEntry[]) => {
      count += dayEntries.filter((e) => e.slot_type !== 'break' && e.slot_type !== 'lunch').length;
    });
    return count;
  }, [timetableData]);

  return (
    <Screen scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6', '#a78bfa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Calendar size={24} color="white" />
            </View>
            <Text style={styles.headerTitle}>My Schedule</Text>
            <Text style={styles.headerSubtitle}>{totalClasses} classes this week</Text>
          </View>
        </LinearGradient>

        {/* Day Selector */}
        <View style={styles.daySelector}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorContent}
          >
            {SHORT_DAYS.map((day, index) => {
              const isSelected = index === selectedDayIndex;
              const today = new Date().getDay();
              const isToday = (today === 0 ? 6 : today - 1) === index;

              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => setSelectedDayIndex(index)}
                >
                  <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                    {day}
                  </Text>
                  {isToday && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          <Text style={styles.dayTitle}>{selectedDayName}</Text>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          )}
          {!isLoading && dayEntries.length === 0 && (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Classes</Text>
              <Text style={styles.emptyText}>
                You don't have any classes scheduled for {selectedDayName}.
              </Text>
            </View>
          )}
          {!isLoading &&
            dayEntries.length > 0 &&
            dayEntries.map((entry, index) => (
              <Animated.View
                key={entry.public_id || index}
                entering={FadeInDown.delay(index * 80).springify()}
              >
                <TimeSlotCard entry={entry} />
              </Animated.View>
            ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { alignItems: 'center' },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  daySelector: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  daySelectorContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 52,
  },
  dayButtonSelected: {
    backgroundColor: '#6366f1',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayButtonTextSelected: {
    color: 'white',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f97316',
    marginTop: 4,
  },
  content: { padding: 16 },
  dayTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 16 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 8 },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  slotTime: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  slotContent: {},
  slotHeader: { marginBottom: 8 },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subjectName: { fontSize: 14, fontWeight: '600', color: '#3b82f6' },
  slotDetails: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#6b7280' },
  breakCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  breakLabel: { fontSize: 13, fontWeight: '600', color: '#d97706' },
  breakTime: { fontSize: 11, color: '#92400e', marginTop: 2 },
});
