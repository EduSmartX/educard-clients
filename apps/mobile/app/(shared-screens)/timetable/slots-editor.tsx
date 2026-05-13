/**
 * Time Slots Editor Screen
 * Define periods, breaks & their times for a class group per day
 * Matches web app's Time Slots Tab functionality
 *
 * Flow:
 *  1. Select a day (Mon-Sun)
 *  2. Add/edit/remove periods & breaks with start/end times
 *  3. Optionally select "Also save to" additional days
 *  4. Save — bulk-saves all slots for the selected days
 */
import { getRoleGradient, extractApiError } from '@educard/shared';
import {
  DAY_LABELS,
  DAY_SHORT_LABELS,
  SLOT_TYPE_LABELS,
  BREAK_TYPES,
  type TimetableSlot,
  type BulkSlotItem,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Trash2, Save, Clock, BookOpen, Copy, Check } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useSlots, useBulkSaveSlots, useClearDaySlots } from '@/features/timetable';
import { headerStyles, layoutStyles, bodyStyles, emptyStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const SLOT_TYPE_OPTIONS = Object.entries(SLOT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const SLOT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  period: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  lunch_break: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  short_break: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  assembly: { bg: '#fae8ff', border: '#e879f9', text: '#86198f' },
  free_period: { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569' },
  special: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
};
function toInputTime(apiTime: string): string {
  if (!apiTime) return '';
  return apiTime.slice(0, 5); // "HH:MM:SS" -> "HH:MM"
}
function toApiTime(inputTime: string): string {
  if (!inputTime) return '';
  return inputTime.length === 5 ? `${inputTime}:00` : inputTime;
}
function formatTimeDisplay(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}
function buildDaySlotMap(allSlots: TimetableSlot[]): Record<number, BulkSlotItem[]> {
  const map: Record<number, BulkSlotItem[]> = {};
  for (const s of allSlots) {
    const item: BulkSlotItem = {
      slot_number: s.slot_number,
      slot_type: s.slot_type,
      start_time: toInputTime(s.start_time),
      end_time: toInputTime(s.end_time),
      label: s.label,
    };
    for (const day of s.days_of_week) {
      if (!map[day]) map[day] = [];
      if (
        !map[day].some(
          (x) => x.slot_number === item.slot_number && x.start_time === item.start_time
        )
      ) {
        map[day].push(item);
      }
    }
  }
  for (const day of Object.keys(map)) {
    map[Number(day)].sort((a, b) => a.slot_number - b.slot_number);
  }
  return map;
}
export default function TimeSlotsEditorScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const decodedName = decodeURIComponent(groupName || 'Group');
  const [activeDay, setActiveDay] = useState(0); // Mon
  const [saveToDays, setSaveToDays] = useState<number[]>([0]); // Days to also save to
  const [slots, setSlots] = useState<BulkSlotItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showTypePickerForIdx, setShowTypePickerForIdx] = useState<number | null>(null);
  // Fetch all slots for this group
  const { data: allSlots = [], isLoading, refetch } = useSlots(groupId);
  const saveMutation = useBulkSaveSlots(groupId);
  const clearMutation = useClearDaySlots(groupId);
  // Build day -> slots map
  const daySlotMap = useMemo(() => buildDaySlotMap(allSlots), [allSlots]);
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
    setSlots(saved ? saved.map((s) => ({ ...s })) : []);
  }, [activeDay, daySlotMap]);
  const onRefresh = async () => {
    setRefreshing(true);
    await void refetch();
    setRefreshing(false);
  };
  const handleDayChange = (day: number) => {
    setActiveDay(day);
    setSaveToDays([day]);
  };
  const toggleSaveToDay = (day: number) => {
    if (day === activeDay) return; // Always included
    setSaveToDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };
  const addPeriod = () => {
    const nextNum = slots.length > 0 ? Math.max(...slots.map((s) => s.slot_number)) + 1 : 1;
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
  const addBreak = (breakType: string = 'short_break') => {
    const nextNum = slots.length > 0 ? Math.max(...slots.map((s) => s.slot_number)) + 1 : 1;
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
  const updateSlot = (idx: number, field: keyof BulkSlotItem, value: string | number) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };
  const removeSlot = (idx: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleCopyFromDay = (sourceDay: number) => {
    const source = daySlotMap[sourceDay];
    if (!source || source.length === 0) {
      Alert.alert('No Slots', `No slots found for ${DAY_LABELS[sourceDay]}`);
      return;
    }
    setSlots(source.map((s, i) => ({ ...s, slot_number: i + 1 })));
    Alert.alert('Copied', `Loaded ${source.length} slots from ${DAY_LABELS[sourceDay]}`);
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
      if (s.end_time <= s.start_time) {
        Alert.alert('Error', `Slot "${s.label}": end time must be after start time`);
        return;
      }
    }
    saveMutation.mutate(
      {
        days_of_week: saveToDays,
        slots: slots.map((s) => ({
          ...s,
          start_time: toApiTime(s.start_time),
          end_time: toApiTime(s.end_time),
        })),
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Saved',
            `Slots saved for ${saveToDays.map((d) => DAY_SHORT_LABELS[d]).join(', ')}`
          );
          void refetch();
        },
        onError: (err: unknown) => {
          Alert.alert('Error', extractApiError(err));
        },
      }
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
            onError: (err: unknown) => Alert.alert('Error', extractApiError(err)),
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
        .filter((d) => d !== activeDay && daySlotMap[d].length > 0)
        .sort(),
    [daySlotMap, activeDay]
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
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
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={st.dayRow}
          >
            {ALL_DAYS.map((day) => {
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
                  [0, 1, 2, 3, 4].includes(activeDay) ? [0, 1, 2, 3, 4] : [activeDay, 0, 1, 2, 3, 4]
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
            {ALL_DAYS.map((day) => {
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
              {copyFromDays.map((day) => (
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
            <Text style={[st.sectionLabel, { marginTop: 16 }]}>
              {DAY_LABELS[activeDay]} — {slots.length} SLOT{slots.length !== 1 ? 'S' : ''}
            </Text>
            {slots.map((slot, idx) => {
              const colors = SLOT_COLORS[slot.slot_type] || SLOT_COLORS.period;
              const isBreak = BREAK_TYPES.has(slot.slot_type);
              return (
                <Animated.View
                  key={`${idx}-${slot.slot_number}`}
                  entering={FadeInDown.delay(idx * 40).springify()}
                >
                  <View
                    style={[
                      st.slotCard,
                      { backgroundColor: colors.bg, borderLeftColor: colors.border },
                    ]}
                  >
                    {/* Row 1: Type + Label + Delete */}
                    <View style={st.slotTopRow}>
                      <TouchableOpacity
                        style={[st.typeBadge, { backgroundColor: colors.border + '40' }]}
                        onPress={() =>
                          setShowTypePickerForIdx(showTypePickerForIdx === idx ? null : idx)
                        }
                      >
                        {isBreak ? (
                          <Clock size={12} color={colors.text} />
                        ) : (
                          <BookOpen size={12} color={colors.text} />
                        )}
                        <Text style={[st.typeText, { color: colors.text }]}>
                          {SLOT_TYPE_LABELS[slot.slot_type] || slot.slot_type}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[st.labelInput, { color: colors.text }]}
                        value={slot.label}
                        onChangeText={(v) => updateSlot(idx, 'label', v)}
                        placeholder="Label"
                        placeholderTextColor="#94a3b8"
                      />
                      <TouchableOpacity style={st.deleteBtn} onPress={() => removeSlot(idx)}>
                        <Trash2 size={14} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                    {/* Type Picker (shown inline) */}
                    {showTypePickerForIdx === idx && (
                      <View style={st.typePicker}>
                        {SLOT_TYPE_OPTIONS.map((opt) => (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              st.typeOption,
                              slot.slot_type === opt.value && st.typeOptionActive,
                            ]}
                            onPress={() => {
                              updateSlot(idx, 'slot_type', opt.value);
                              if (BREAK_TYPES.has(opt.value)) {
                                updateSlot(idx, 'label', opt.label);
                              }
                              setShowTypePickerForIdx(null);
                            }}
                          >
                            <Text
                              style={[
                                st.typeOptionText,
                                slot.slot_type === opt.value && st.typeOptionTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    {/* Row 2: Times */}
                    <View style={st.timeRow}>
                      <View style={st.timeField}>
                        <Text style={st.timeLabel}>Start</Text>
                        <TextInput
                          style={st.timeInput}
                          value={slot.start_time}
                          onChangeText={(v) => updateSlot(idx, 'start_time', v)}
                          placeholder="09:00"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                      </View>
                      <Text style={st.timeArrow}>→</Text>
                      <View style={st.timeField}>
                        <Text style={st.timeLabel}>End</Text>
                        <TextInput
                          style={st.timeInput}
                          value={slot.end_time}
                          onChangeText={(v) => updateSlot(idx, 'end_time', v)}
                          placeholder="10:00"
                          placeholderTextColor="#cbd5e1"
                          keyboardType="numbers-and-punctuation"
                          maxLength={5}
                        />
                      </View>
                      {slot.start_time && slot.end_time && (
                        <Text style={[st.timePreview, { color: colors.text }]}>
                          {formatTimeDisplay(slot.start_time)} – {formatTimeDisplay(slot.end_time)}
                        </Text>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            })}
            {/* Add Slot Buttons */}
            <View style={st.addBtnRow}>
              <TouchableOpacity style={st.addPeriodBtn} onPress={addPeriod}>
                <BookOpen size={14} color="#2563eb" />
                <Text style={st.addPeriodText}>+ Period</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.addBreakBtn} onPress={() => addBreak('short_break')}>
                <Clock size={14} color="#16a34a" />
                <Text style={st.addBreakText}>+ Break</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.addBreakBtn} onPress={() => addBreak('lunch_break')}>
                <Clock size={14} color="#d97706" />
                <Text style={[st.addBreakText, { color: '#d97706' }]}>+ Lunch</Text>
              </TouchableOpacity>
            </View>
            {/* Action Buttons */}
            <View style={st.actionRow}>
              <TouchableOpacity
                style={[st.primaryBtn, saveMutation.isPending && { opacity: 0.6 }]}
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
                        ? `(${saveToDays.map((d) => DAY_SHORT_LABELS[d]).join(', ')})`
                        : DAY_LABELS[activeDay]}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {slots.length > 0 && (
                <TouchableOpacity style={st.clearBtn} onPress={handleClearDay}>
                  <Trash2 size={14} color="#dc2626" />
                  <Text style={st.clearBtnText}>Clear {DAY_SHORT_LABELS[activeDay]}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  saveHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  // Day selector chips
  dayRow: { gap: 6, paddingBottom: 4 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  dayChipConfigured: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  dayChipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  dayChipTextActive: { color: '#fff' },
  dayChipTextConfigured: { color: '#16a34a' },
  configuredDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Also Save To chips
  alsoSaveHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  quickLink: { fontSize: 11, fontWeight: '600', color: '#7c3aed' },
  saveChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  saveChipEditing: {
    backgroundColor: '#f5f3ff',
    borderColor: '#c4b5fd',
  },
  saveChipSelected: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  saveChipText: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  saveChipTextEditing: { color: '#7c3aed' },
  saveChipTextSelected: { color: '#fff' },
  // Copy from chips
  copyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  copyChipText: { fontSize: 11, fontWeight: '600', color: '#7c3aed' },
  // Slot card
  slotCard: {
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: { fontSize: 10, fontWeight: '700' },
  labelInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(220,38,38,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Inline type picker
  typePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeOptionActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  typeOptionText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  typeOptionTextActive: { color: '#fff' },
  // Time row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 9, fontWeight: '600', color: '#94a3b8', marginBottom: 2 },
  timeInput: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  timeArrow: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginTop: 12 },
  timePreview: { fontSize: 10, fontWeight: '500', marginTop: 12, flexShrink: 1 },
  // Add buttons
  addBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  addPeriodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: 12,
  },
  addPeriodText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  addBreakBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBreakText: { fontSize: 13, fontWeight: '600', color: '#16a34a' },
  // Action buttons
  actionRow: { gap: 10, marginTop: 16 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
});
