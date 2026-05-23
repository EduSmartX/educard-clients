/**
 * Class Timetable Screen
 * Select a class → see weekly timetable grid
 */

import { getRoleGradient } from '@educard/shared';
import {
  DAY_SHORT_LABELS,
  DAY_LABELS,
  SLOT_TYPE_LABELS,
  BREAK_TYPES,
  type ClassTimetableSlot,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock, BookOpen, User, Settings, Plus } from 'lucide-react-native';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useClassTimetable } from '@/features/timetable';
import { useAuthStore } from '@/lib/auth-store';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');
const _SCREEN_WIDTH = Dimensions.get('window').width;

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

export default function TimetableScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classId?: string }>();
  const [selectedClassId, setSelectedClassId] = useState(params.classId ?? '');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dayScrollRef = useRef<ScrollView>(null);

  // Role-based access check
  const { user } = useAuthStore();
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  // Today in 0=Mon format
  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  const { data: classesData, isLoading: classesLoading } = useClasses({ page_size: 200 });
  const {
    data: timetable,
    isLoading: ttLoading,
    refetch,
  } = useClassTimetable(selectedClassId || undefined);

  const classOptions = useMemo(() => {
    interface ClassItem {
      public_id: string;
      name: string;
      class_master?: { name: string } | null;
    }
    return (classesData?.classes ?? []).map((c: ClassItem) => ({
      label: `${c.class_master?.name ?? c.name} - ${c.name}`,
      value: c.public_id,
    }));
  }, [classesData]);

  // Get available days from timetable
  const availableDays = useMemo(() => {
    if (!timetable?.days) return [];
    return Object.keys(timetable.days)
      .map(Number)
      .sort((a, b) => a - b);
  }, [timetable]);

  // Auto-select current day when timetable loads
  useEffect(() => {
    if (availableDays.length > 0 && selectedDay === null) {
      if (availableDays.includes(todayIndex)) {
        setSelectedDay(todayIndex);
        // Scroll to today's tab
        const tabIndex = availableDays.indexOf(todayIndex);
        setTimeout(() => {
          dayScrollRef.current?.scrollTo({ x: Math.max(0, tabIndex * 86 - 40), animated: true });
        }, 300);
      }
    }
  }, [availableDays, selectedDay, todayIndex]);

  // Auto-select first day
  const activeDay = selectedDay ?? availableDays[0] ?? 0;

  const daySlots: ClassTimetableSlot[] = useMemo(() => {
    if (!timetable?.days) return [];
    return timetable.days[activeDay.toString()] || [];
  }, [timetable, activeDay]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderSlotCard = (slot: ClassTimetableSlot, index: number) => {
    const isBreak = BREAK_TYPES.has(slot.slot_type);
    const colors = SLOT_COLORS[slot.slot_type] ?? SLOT_COLORS.period;

    const handleSlotPress = () => {
      if (isBreak || !canManage) return;
      const classLabel = classOptions.find((c) => c.value === selectedClassId)?.label ?? '';
      router.push({
        pathname: '/(shared-screens)/timetable/assign-entry',
        params: {
          slotId: slot.public_id,
          dayOfWeek: activeDay.toString(),
          classId: selectedClassId ?? '',
          entryId: slot.entry_public_id ?? '',
          subjectId: slot.subject_public_id ?? '',
          slotLabel: encodeURIComponent(slot.label),
          className: encodeURIComponent(classLabel),
        },
      });
    };

    return (
      <Animated.View
        key={slot.public_id || index}
        entering={FadeInDown.delay(index * 50)
          .springify()
          .damping(18)}
      >
        <TouchableOpacity
          style={[styles.slotCard, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}
          activeOpacity={isBreak || !canManage ? 1 : 0.7}
          onPress={handleSlotPress}
          disabled={isBreak || !canManage}
        >
          <View style={styles.slotTime}>
            <Clock size={12} color={colors.text} />
            <Text style={[styles.slotTimeText, { color: colors.text }]}>
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </Text>
            <View style={[styles.slotTypeBadge, { backgroundColor: colors.border + '40' }]}>
              <Text style={[styles.slotTypeText, { color: colors.text }]}>
                {SLOT_TYPE_LABELS[slot.slot_type] ?? slot.label}
              </Text>
            </View>
          </View>

          {isBreak ? (
            <Text style={[styles.breakLabel, { color: colors.text }]}>{slot.label}</Text>
          ) : (
            <View style={styles.slotContent}>
              <View style={styles.slotRow}>
                <BookOpen size={14} color={colors.text} />
                <Text style={[styles.slotSubject, { color: colors.text }]}>
                  {slot.subject_name ?? 'No subject assigned'}
                </Text>
              </View>
              {slot.teacher_name && (
                <View style={styles.slotRow}>
                  <User size={14} color="#64748b" />
                  <Text style={styles.slotTeacher}>{slot.teacher_name}</Text>
                </View>
              )}
              {slot.room ? <Text style={styles.slotRoom}>Room: {slot.room}</Text> : null}
            </View>
          )}

          <Text style={styles.slotDuration}>{slot.duration_minutes} min</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Timetable</Text>
              <Text style={headerStyles.subtitle}>Weekly class schedule</Text>
            </View>
            {canManage && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                }}
                onPress={() => router.push('/(shared-screens)/timetable/setup')}
              >
                <Plus size={16} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Setup</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#7c3aed']}
          />
        }
      >
        {/* Class Selector */}
        <View style={styles.selectorCard}>
          <FormDropdown
            label="Select Class"
            value={selectedClassId}
            onChange={setSelectedClassId}
            options={classOptions}
            placeholder={classesLoading ? 'Loading classes...' : 'Choose a class'}
          />
        </View>

        {!selectedClassId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Select a Class</Text>
            <Text style={styles.emptySubtitle}>Choose a class above to view its timetable</Text>
          </View>
        ) : ttLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>Loading timetable...</Text>
          </View>
        ) : !timetable || availableDays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Timetable</Text>
            <Text style={styles.emptySubtitle}>
              No timetable has been set up for this class yet.
            </Text>
            {canManage && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#7c3aed',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginTop: 16,
                }}
                onPress={() => router.push('/(shared-screens)/timetable/setup')}
              >
                <Settings size={16} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                  Set Up Timetable
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {/* Day Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabs}
            >
              {availableDays.map((day) => {
                const isActive = day === activeDay;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayTab, isActive && styles.dayTabActive]}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayTabShort, isActive && styles.dayTabTextActive]}>
                      {DAY_SHORT_LABELS[day]}
                    </Text>
                    <Text style={[styles.dayTabFull, isActive && styles.dayTabTextActive]}>
                      {DAY_LABELS[day]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Slots */}
            {daySlots.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🗓️</Text>
                <Text style={styles.emptyTitle}>No Periods</Text>
                <Text style={styles.emptySubtitle}>
                  No periods scheduled for {DAY_LABELS[activeDay]}
                </Text>
              </View>
            ) : (
              <View style={styles.slotsList}>{daySlots.map(renderSlotCard)}</View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },

  selectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  dayTabs: { paddingBottom: 12, gap: 8 },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    minWidth: 70,
  },
  dayTabActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  dayTabShort: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  dayTabFull: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  dayTabTextActive: { color: '#fff' },

  slotsList: { gap: 10, marginTop: 4 },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  slotTime: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  slotTimeText: { fontSize: 12, fontWeight: '600' },
  slotTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 'auto' },
  slotTypeText: { fontSize: 10, fontWeight: '600' },

  breakLabel: { fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 4 },

  slotContent: { gap: 4 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotSubject: { fontSize: 15, fontWeight: '600' },
  slotTeacher: { fontSize: 13, color: '#64748b' },
  slotRoom: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  slotDuration: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: 4 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 },

  loadingState: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 12 },
});
