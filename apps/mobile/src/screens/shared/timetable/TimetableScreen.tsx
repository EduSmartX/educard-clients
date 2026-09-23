/**
 * Class Timetable Screen
 * Select a class → see weekly timetable grid
 */

import {
  getRoleGradient,
  getSubjectColor,
  DAY_SHORT_LABELS,
  DAY_LABELS,
  SLOT_TYPE_LABELS,
  BREAK_TYPES,
  extractApiError,
  type ClassTimetableSlot,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  Clock,
  BookOpen,
  User,
  Settings,
  CalendarRange,
  Plus,
  Copy,
  X,
} from 'lucide-react-native';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useClassTimetable, useCreateEntry } from '@/features/timetable';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';
import { showToast } from '@/utils/toast';

const adminGradient = getRoleGradient('admin');

const SLOT_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  period: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  lunch_break: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  short_break: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  assembly: { bg: '#fae8ff', border: '#e879f9', text: '#86198f' },
  free_period: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  special: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
};

function formatTime(t: string) {
  const [h, m] = t.split(':');
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function TimetableScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'Timetable'>>();
  const params = route.params ?? {};
  const [selectedClassId, setSelectedClassId] = useState(params.classId ?? '');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const dayScrollRef = useRef<ScrollView>(null);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Role-based access check
  const { user } = useAuthStore();
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const createEntry = useCreateEntry();
  const [copySource, setCopySource] = useState<{
    subjectPublicId: string;
    subjectName: string;
  } | null>(null);

  // Today in 0=Mon format
  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;

  const { data: classesData, isLoading: classesLoading } = useClasses({
    page_size: 200,
  });
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
          dayScrollRef.current?.scrollTo({
            x: Math.max(0, tabIndex * 86 - 40),
            animated: true,
          });
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
    let colors: { bg: string; border: string; text: string };

    if (!isBreak && slot.subject_name) {
      // Use subject-specific color for assigned periods
      const subjectColor = getSubjectColor(slot.subject_name);
      colors = {
        bg: subjectColor.light,
        border: subjectColor.hex,
        text: subjectColor.hex,
      };
    } else {
      colors = SLOT_COLORS[slot.slot_type] ?? SLOT_COLORS.period;
    }

    const handlePaste = async () => {
      if (!copySource) return;
      if (slot.subject_public_id) {
        showToast('info', 'Slot already has a subject — skipped');
        return;
      }
      try {
        await createEntry.mutateAsync({
          slot_public_id: slot.public_id,
          day_of_week: activeDay,
          class_public_id: selectedClassId,
          assignment_type: 'subject',
          subject_public_id: copySource.subjectPublicId,
        });
      } catch (err) {
        showToast('error', extractApiError(err));
      }
    };

    const handleSlotPress = () => {
      if (isBreak || !canManage) return;
      if (copySource) {
        void handlePaste();
        return;
      }
      const classLabel =
        classOptions.find(c => c.value === selectedClassId)?.label ?? '';
      navigation.navigate('TimetableAssignEntry', {
        slotId: slot.public_id,
        dayOfWeek: activeDay.toString(),
        classId: selectedClassId ?? '',
        entryId: slot.entry_public_id ?? '',
        subjectId: slot.subject_public_id ?? '',
        slotLabel: encodeURIComponent(slot.label),
        className: encodeURIComponent(classLabel),
      });
    };

    const handleSlotLongPress = () => {
      if (isBreak || !canManage) return;
      if (slot.subject_public_id && slot.subject_name) {
        setCopySource({
          subjectPublicId: slot.subject_public_id,
          subjectName: slot.subject_name,
        });
        showToast(
          'info',
          `Copying "${slot.subject_name}" — tap slots to paste`,
        );
      }
    };

    return (
      <Animated.View
        key={slot.public_id || index}
        entering={FadeInDown.delay(index * 50)
          .springify()
          .damping(18)}
      >
        <TouchableOpacity
          style={[
            styles.slotCard,
            { backgroundColor: colors.bg, borderLeftColor: colors.border },
            !!copySource &&
              copySource.subjectPublicId === slot.subject_public_id &&
              styles.slotCardCopied,
          ]}
          activeOpacity={isBreak || !canManage ? 1 : 0.7}
          onPress={handleSlotPress}
          onLongPress={handleSlotLongPress}
          delayLongPress={300}
          disabled={isBreak || !canManage}
        >
          <View style={styles.slotTime}>
            <Clock size={12} color={colors.text} />
            <Text style={[styles.slotTimeText, { color: colors.text }]}>
              {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
            </Text>
            <View
              style={[
                styles.slotTypeBadge,
                { backgroundColor: colors.border + '40' },
              ]}
            >
              <Text style={[styles.slotTypeText, { color: colors.text }]}>
                {SLOT_TYPE_LABELS[slot.slot_type] ?? slot.label}
              </Text>
            </View>
          </View>

          {isBreak ? (
            <Text style={[styles.breakLabel, { color: colors.text }]}>
              {slot.label}
            </Text>
          ) : (
            <View style={styles.slotContent}>
              {slot.subject_name ? (
                <>
                  <View style={styles.slotRow}>
                    <BookOpen size={14} color={colors.text} />
                    <Text style={[styles.slotSubject, { color: colors.text }]}>
                      {slot.subject_name}
                    </Text>
                  </View>
                  {!!slot.teacher_name && (
                    <View style={styles.slotRow}>
                      <User size={14} color="#64748b" />
                      <Text style={styles.slotTeacher}>
                        {slot.teacher_name}
                      </Text>
                    </View>
                  )}
                  {slot.room ? (
                    <Text style={styles.slotRoom}>Room: {slot.room}</Text>
                  ) : null}
                </>
              ) : canManage ? (
                <View style={styles.addSubjectPill}>
                  {copySource ? (
                    <>
                      <Copy size={16} color="#7c3aed" />
                      <Text style={styles.addSubjectText}>Tap to paste</Text>
                    </>
                  ) : (
                    <>
                      <Plus size={16} color="#7c3aed" />
                      <Text style={styles.addSubjectText}>Add subject</Text>
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.slotRow}>
                  <BookOpen size={14} color={colors.text} />
                  <Text style={[styles.slotSubject, { color: colors.text }]}>
                    No subject assigned
                  </Text>
                </View>
              )}
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Timetable</Text>
              <Text style={headerStyles.subtitle}>Weekly class schedule</Text>
            </View>
            {canManage && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() => navigation.navigate('TimetableTeacher')}
                >
                  <User size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() =>
                    navigation.navigate('TimetableOverrideDay', {
                      classId: selectedClassId || '',
                    })
                  }
                >
                  <CalendarRange size={16} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() => navigation.navigate('TimetableSetup')}
                >
                  <Settings size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            {!canManage && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => navigation.navigate('TimetableTeacher')}
              >
                <User size={16} color="#fff" />
                <Text style={styles.headerBtnText}>Teacher Timetable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {copySource && (
        <View style={styles.copyBanner}>
          <Copy size={16} color="#fff" />
          <Text style={styles.copyBannerText} numberOfLines={1}>
            Copying “{copySource.subjectName}” — tap empty slots to paste
          </Text>
          <TouchableOpacity
            style={styles.copyBannerBtn}
            onPress={() => setCopySource(null)}
          >
            <X size={14} color="#7c3aed" />
            <Text style={styles.copyBannerBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

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
            placeholder={
              classesLoading ? 'Loading classes...' : 'Choose a class'
            }
          />
        </View>

        {!selectedClassId && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Select a Class</Text>
            <Text style={styles.emptySubtitle}>
              Choose a class above to view its timetable
            </Text>
          </View>
        )}
        {selectedClassId && ttLoading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>Loading timetable...</Text>
          </View>
        )}
        {selectedClassId &&
          !ttLoading &&
          (!timetable || availableDays.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Timetable</Text>
              <Text style={styles.emptySubtitle}>
                No timetable has been set up for this class yet.
              </Text>
              {canManage && (
                <TouchableOpacity
                  style={styles.setupBtn}
                  onPress={() => navigation.navigate('TimetableSetup')}
                >
                  <Settings size={16} color="#fff" />
                  <Text style={styles.setupBtnText}>Set Up Timetable</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        {selectedClassId &&
          !ttLoading &&
          timetable &&
          availableDays.length > 0 && (
            <>
              {/* Day Tabs */}
              <ScrollView
                ref={dayScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayTabs}
              >
                {availableDays.map(day => {
                  const isActive = day === activeDay;
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayTab, isActive && styles.dayTabActive]}
                      onPress={() => setSelectedDay(day)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayTabShort,
                          isActive && styles.dayTabTextActive,
                        ]}
                      >
                        {DAY_SHORT_LABELS[day]}
                      </Text>
                      <Text
                        style={[
                          styles.dayTabFull,
                          isActive && styles.dayTabTextActive,
                        ]}
                      >
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
                <View style={styles.slotsList}>
                  {daySlots.map((slot, index) => renderSlotCard(slot, index))}
                </View>
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

  copyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  copyBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  copyBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyBannerBtnText: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  slotCardCopied: { borderWidth: 1.5, borderColor: '#7c3aed' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

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
    minWidth: 56,
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
  slotTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  slotTimeText: { fontSize: 12, fontWeight: '600' },
  slotTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  slotTypeText: { fontSize: 10, fontWeight: '600' },

  breakLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 4,
  },

  slotContent: { gap: 4 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotSubject: { fontSize: 15, fontWeight: '600' },
  slotTeacher: { fontSize: 13, color: '#64748b' },
  slotRoom: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  addSubjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#c4b5fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addSubjectText: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
  slotDuration: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  setupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  setupBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  loadingState: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 12 },
});
