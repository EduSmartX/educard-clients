/**
 * Time Slots Editor Screen
 * Define periods, breaks & their times for a class group per day.
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  SLOT_TYPE_LABELS,
  type BulkSlotItem,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  Save,
  Clock,
  BookOpen,
  Copy,
  Check,
  Trash2,
} from 'lucide-react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  useSlots,
  useBulkSaveSlots,
  useClearDaySlots,
} from '@/features/timetable';
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { headerStyles, layoutStyles, bodyStyles, emptyStyles } from '@/styles';

import { SlotCardEditor } from './SlotCardEditor';
import { st } from './slots-editor-styles';
import {
  ALL_DAYS,
  buildDaySlotMap,
  timeIsAfter,
  toApiTime,
  normalizeTime,
} from './slots-editor-utils';

const adminGradient = getRoleGradient('admin');

export default function TimeSlotsEditorScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'TimetableSlotsEditor'>>();
  const { showToast } = useToast();
  const { groupId, groupName } = route.params;
  const decodedName = decodeURIComponent(groupName || 'Group');
  const [activeDay, setActiveDay] = useState(0); // Mon
  const [saveToDays, setSaveToDays] = useState<number[]>([0]); // Days to also save to
  const [slots, setSlots] = useState<BulkSlotItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showTypePickerForIdx, setShowTypePickerForIdx] = useState<
    number | null
  >(null);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Fetch all slots for this group
  const { data: allSlots, isLoading, refetch } = useSlots(groupId);
  const saveMutation = useBulkSaveSlots(groupId);
  const clearMutation = useClearDaySlots(groupId);
  // Build day -> slots map
  const daySlotMap = useMemo(() => buildDaySlotMap(allSlots ?? []), [allSlots]);
  // Days that have saved slots
  const configuredDays = useMemo(() => {
    const set = new Set<number>();
    for (const day of Object.keys(daySlotMap)) {
      if (daySlotMap[Number(day)].length > 0) set.add(Number(day));
    }
    return set;
  }, [daySlotMap]);
  // Load slots when active day changes
  useEffect(() => {
    const saved = daySlotMap[activeDay];
    setSlots(saved ? saved.map(s => ({ ...s })) : []);
  }, [activeDay, daySlotMap]);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  const handleDayChange = (day: number) => {
    setActiveDay(day);
    setSaveToDays([day]);
  };
  const toggleSaveToDay = (day: number) => {
    if (day === activeDay) return; // Always included
    setSaveToDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  };
  const addPeriod = () => {
    const nextNum =
      slots.length > 0 ? Math.max(...slots.map(s => s.slot_number)) + 1 : 1;
    const prev = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        slot_number: nextNum,
        slot_type: 'period',
        start_time: prev?.end_time || '',
        end_time: '',
        label: `Period ${nextNum}`,
      },
    ]);
  };
  const addBreak = (breakType: string) => {
    const nextNum =
      slots.length > 0 ? Math.max(...slots.map(s => s.slot_number)) + 1 : 1;
    const prev = slots[slots.length - 1];
    setSlots([
      ...slots,
      {
        slot_number: nextNum,
        slot_type: breakType,
        start_time: prev?.end_time || '',
        end_time: '',
        label: SLOT_TYPE_LABELS[breakType] || 'Break',
      },
    ]);
  };
  const updateSlot = (
    idx: number,
    field: keyof BulkSlotItem,
    value: string | number,
  ) => {
    // Auto-format time fields: insert colon after 2 digits
    let finalValue = value;
    if (
      (field === 'start_time' || field === 'end_time') &&
      typeof value === 'string'
    ) {
      // Remove non-digit/colon chars
      let cleaned = value.replace(/[^\d:]/g, '');
      // Auto-insert colon: "10" -> "10:", "1030" -> "10:30"
      if (
        (cleaned.length === 3 || cleaned.length === 4) &&
        !cleaned.includes(':')
      ) {
        cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
      }
      finalValue = cleaned.slice(0, 5); // max HH:MM
    }
    setSlots(prev =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: finalValue } : s)),
    );
  };
  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };
  const handleCopyFromDay = (sourceDay: number) => {
    const source = daySlotMap[sourceDay];
    if (!source || source.length === 0) {
      Alert.alert('No Slots', `No slots found for ${DAY_LABELS[sourceDay]}`);
      return;
    }
    setSlots(source.map((s, i) => ({ ...s, slot_number: i + 1 })));
    Alert.alert(
      'Copied',
      `Loaded ${source.length} slots from ${DAY_LABELS[sourceDay]}`,
    );
  };
  const handleSave = () => {
    if (slots.length === 0) {
      Alert.alert('Error', 'Add at least one slot before saving');
      return;
    }
    for (const s of slots) {
      if (!s.start_time || !s.end_time) {
        Alert.alert('Error', `Slot "${s.label}" must have start and end times`);
        return;
      }
      if (!timeIsAfter(s.end_time, s.start_time)) {
        Alert.alert(
          'Error',
          `Slot "${s.label}": end time must be after start time`,
        );
        return;
      }
    }
    saveMutation.mutate(
      {
        days_of_week: saveToDays,
        slots: slots.map(s => ({
          ...s,
          start_time: toApiTime(normalizeTime(s.start_time)),
          end_time: toApiTime(normalizeTime(s.end_time)),
        })),
      },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Saved',
            message: `Slots saved for ${saveToDays.map(d => DAY_SHORT_LABELS[d]).join(', ')}`,
          });
          void refetch();
        },
        onError: (err: unknown) => {
          showToast({
            type: 'error',
            title: 'Error',
            message: extractApiError(err),
          });
        },
      },
    );
  };
  const handleClearDay = () => {
    Alert.alert('Clear Day', `Remove all slots for ${DAY_LABELS[activeDay]}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearMutation.mutate(activeDay, {
            onSuccess: () => {
              setSlots([]);
              void refetch();
            },
            onError: (err: unknown) =>
              showToast({
                type: 'error',
                title: 'Error',
                message: extractApiError(err),
              }),
          });
        },
      },
    ]);
  };
  // Copy from days that have slots
  const copyFromDays = useMemo(
    () =>
      Object.keys(daySlotMap)
        .map(Number)
        .filter(d => d !== activeDay && daySlotMap[d].length > 0)
        .sort((a, b) => a - b),
    [daySlotMap, activeDay],
  );
  return (
    <View style={layoutStyles.container}>
      {/* Header */}
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
              <Text style={headerStyles.title}>Time Slots</Text>
              <Text style={headerStyles.subtitle}>{decodedName}</Text>
            </View>
            <TouchableOpacity
              style={st.saveHeaderBtn}
              onPress={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Save size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      <ScrollView
        style={bodyStyles.scroll}
        contentContainerStyle={bodyStyles.contentLarge}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={['#7c3aed']}
          />
        }
      >
        {/* Editing Day Selector */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text style={st.sectionLabel}>EDITING DAY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            contentContainerStyle={st.dayRow}
          >
            {ALL_DAYS.map(day => {
              const isActive = day === activeDay;
              const hasSlots = configuredDays.has(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    st.dayChip,
                    isActive && st.dayChipActive,
                    !isActive && hasSlots && st.dayChipConfigured,
                  ]}
                  onPress={() => handleDayChange(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      st.dayChipText,
                      isActive && st.dayChipTextActive,
                      !isActive && hasSlots && st.dayChipTextConfigured,
                    ]}
                  >
                    {DAY_SHORT_LABELS[day]}
                  </Text>
                  {hasSlots && !isActive && (
                    <View style={st.configuredDot}>
                      <Check size={8} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
        {/* Also Save To */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={st.alsoSaveHeader}>
            <Text style={st.sectionLabel}>ALSO SAVE TO</Text>
            <TouchableOpacity
              onPress={() =>
                setSaveToDays(
                  [0, 1, 2, 3, 4].includes(activeDay)
                    ? [0, 1, 2, 3, 4]
                    : [activeDay, 0, 1, 2, 3, 4],
                )
              }
            >
              <Text style={st.quickLink}>Mon–Fri</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSaveToDays([...ALL_DAYS])}>
              <Text style={st.quickLink}>All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.dayRow}
          >
            {ALL_DAYS.map(day => {
              const isEditing = day === activeDay;
              const isIncluded = saveToDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    st.saveChip,
                    isEditing && st.saveChipEditing,
                    !isEditing && isIncluded && st.saveChipSelected,
                  ]}
                  onPress={() => toggleSaveToDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      st.saveChipText,
                      isEditing && st.saveChipTextEditing,
                      !isEditing && isIncluded && st.saveChipTextSelected,
                    ]}
                  >
                    {DAY_SHORT_LABELS[day]}
                    {isEditing ? ' ✎' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
        {/* Copy From */}
        {copyFromDays.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text style={st.sectionLabel}>COPY FROM</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={st.dayRow}
            >
              {copyFromDays.map(day => (
                <TouchableOpacity
                  key={day}
                  style={st.copyChip}
                  onPress={() => handleCopyFromDay(day)}
                  activeOpacity={0.7}
                >
                  <Copy size={12} color="#7c3aed" />
                  <Text style={st.copyChipText}>{DAY_LABELS[day]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
        {/* Loading */}
        {isLoading ? (
          <View style={emptyStyles.container}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : (
          <>
            {/* Slot List */}
            <Text style={[st.sectionLabel, st.mt16]}>
              {DAY_LABELS[activeDay]} — {slots.length} SLOT
              {slots.length !== 1 ? 'S' : ''}
            </Text>
            {slots.map((slot, idx) => (
              <Animated.View
                key={`${idx}-${slot.slot_number}`}
                entering={FadeInDown.delay(idx * 40).springify()}
              >
                <SlotCardEditor
                  slot={slot}
                  showTypePicker={showTypePickerForIdx === idx}
                  onToggleTypePicker={() =>
                    setShowTypePickerForIdx(
                      showTypePickerForIdx === idx ? null : idx,
                    )
                  }
                  onCloseTypePicker={() => setShowTypePickerForIdx(null)}
                  onUpdate={(field, value) => updateSlot(idx, field, value)}
                  onRemove={() => removeSlot(idx)}
                />
              </Animated.View>
            ))}
            {/* Add Slot Buttons */}
            <View style={st.addBtnRow}>
              <TouchableOpacity style={st.addPeriodBtn} onPress={addPeriod}>
                <BookOpen size={14} color="#2563eb" />
                <Text style={st.addPeriodText}>+ Period</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.addBreakBtn}
                onPress={() => addBreak('short_break')}
              >
                <Clock size={14} color="#16a34a" />
                <Text style={st.addBreakText}>+ Break</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={st.addBreakBtn}
                onPress={() => addBreak('lunch_break')}
              >
                <Clock size={14} color="#d97706" />
                <Text style={[st.addBreakText, st.addLunchText]}>+ Lunch</Text>
              </TouchableOpacity>
            </View>
            {/* Action Buttons */}
            <View style={st.actionRow}>
              <TouchableOpacity
                style={[st.primaryBtn, saveMutation.isPending && st.dimmed]}
                onPress={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Save size={16} color="#fff" />
                    <Text style={st.primaryBtnText}>
                      Save{' '}
                      {saveToDays.length > 1
                        ? `(${saveToDays.map(d => DAY_SHORT_LABELS[d]).join(', ')})`
                        : DAY_LABELS[activeDay]}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {slots.length > 0 && (
                <TouchableOpacity style={st.clearBtn} onPress={handleClearDay}>
                  <Trash2 size={14} color="#dc2626" />
                  <Text style={st.clearBtnText}>
                    Clear {DAY_SHORT_LABELS[activeDay]}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
