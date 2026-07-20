/**
 * FormDatePicker - Full modal date picker with year/month/day selection
 * Supports backdated years (1950+) for DOB fields
 */

import { Calendar, X, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Platform,
  useWindowDimensions,
} from 'react-native';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
  minDate?: string;
  maxDate?: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function FormDatePicker({
  label,
  value,
  onChange,
  error,
  required,
  placeholder = 'Select date',
  disabled,
  minYear = 1950,
  maxYear,
  minDate,
  maxDate,
}: FormDatePickerProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const currentYear = new Date().getFullYear();
  const effectiveMaxYear = maxYear ?? currentYear + 5;
  const calendarPadding = viewportWidth < 360 ? 12 : 20;
  const daySize = Math.max(34, Math.min(54, Math.floor((viewportWidth - calendarPadding * 2) / 7)));
  const monthCellWidth = (viewportWidth - calendarPadding * 2 - 20) / 3;

  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'calendar' | 'year' | 'month'>('calendar');

  // Parse current value or default to today
  const parsed = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      if (y && m && d) return { year: y, month: m - 1, day: d };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const [selectedYear, setSelectedYear] = useState(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState(parsed.month);
  const [selectedDay, setSelectedDay] = useState(parsed.day);

  const openPicker = () => {
    if (disabled) return;
    setViewYear(parsed.year);
    setViewMonth(parsed.month);
    setSelectedYear(parsed.year);
    setSelectedMonth(parsed.month);
    setSelectedDay(parsed.day);
    setMode('calendar');
    setVisible(true);
  };

  const confirmDate = () => {
    onChange(`${selectedYear}-${pad(selectedMonth + 1)}-${pad(selectedDay)}`);
    setVisible(false);
  };

  const clearDate = () => {
    onChange('');
    setVisible(false);
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
  };

  const isDayDisabled = (day: number): boolean => {
    const dateStr = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const selectYear = (year: number) => {
    setViewYear(year);
    setSelectedYear(year);
    setMode('month');
  };

  const selectMonth = (month: number) => {
    setViewMonth(month);
    setSelectedMonth(month);
    setMode('calendar');
  };

  // Year list (descending for easy backdated selection)
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = effectiveMaxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, effectiveMaxYear]);

  const isSelected = (day: number) =>
    day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  const yearListRef = useRef<FlatList>(null);

  const displayValue = value
    ? `${pad(Number.parseInt(value.split('-')[2]))} ${SHORT_MONTHS[Number.parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}`
    : '';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.inputRow, error && styles.inputError, disabled && styles.inputDisabled]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Calendar size={18} color={error ? '#ef4444' : '#94a3b8'} />
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayValue || placeholder}
        </Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
      )}

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={12}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Selected date preview */}
            <View style={styles.previewRow}>
              <Text style={styles.previewText}>
                {pad(selectedDay)} {MONTHS[selectedMonth]} {selectedYear}
              </Text>
            </View>

            {mode === 'calendar' && (
              <>
                {/* Month/Year nav */}
                <View style={styles.navRow}>
                  <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                    <ChevronLeft size={20} color="#334155" />
                  </TouchableOpacity>

                  <View style={styles.navCenter}>
                    <TouchableOpacity onPress={() => setMode('month')} style={styles.navLabelBtn}>
                      <Text style={styles.navLabel}>{MONTHS[viewMonth]}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMode('year')} style={styles.navLabelBtn}>
                      <Text style={styles.navLabel}>{viewYear}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                    <ChevronRight size={20} color="#334155" />
                  </TouchableOpacity>
                </View>

                {/* Weekday headers */}
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((d) => (
                    <Text key={d} style={[styles.weekDay, { width: daySize }]}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Days grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((day, idx) =>
                    day ? (
                      <TouchableOpacity
                        key={`day-${viewYear}-${viewMonth}-${day}`}
                        style={[
                          styles.dayCell,
                          { width: daySize, height: daySize, borderRadius: daySize / 2 },
                          isSelected(day) ? styles.dayCellSelected : undefined,
                          isToday(day) && !isSelected(day) ? styles.dayCellToday : undefined,
                          isDayDisabled(day) ? styles.dayCellDisabled : undefined,
                        ]}
                        onPress={() => !isDayDisabled(day) && selectDay(day)}
                        activeOpacity={isDayDisabled(day) ? 1 : 0.6}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected(day) && styles.dayTextSelected,
                            isToday(day) && !isSelected(day) && styles.dayTextToday,
                            isDayDisabled(day) && styles.dayTextDisabled,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        key={`empty-${viewYear}-${viewMonth}-${idx}`}
                        style={[
                          styles.dayCell,
                          { width: daySize, height: daySize, borderRadius: daySize / 2 },
                        ]}
                      />
                    )
                  )}
                </View>
              </>
            )}

            {mode === 'year' && (
              <FlatList<number>
                ref={yearListRef}
                data={years}
                keyExtractor={String}
                style={styles.yearList}
                initialScrollIndex={Math.max(0, years.indexOf(viewYear) - 2)}
                getItemLayout={(_data, index: number) => ({
                  length: 48,
                  offset: 48 * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.yearItem, item === viewYear && styles.yearItemActive]}
                    onPress={() => selectYear(item)}
                  >
                    <Text style={[styles.yearText, item === viewYear && styles.yearTextActive]}>
                      {item}
                    </Text>
                    {item === viewYear && <Check size={18} color="#0d9488" />}
                  </TouchableOpacity>
                )}
              />
            )}

            {mode === 'month' && (
              <View style={styles.monthGrid}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.monthItem,
                      { width: monthCellWidth },
                      idx === viewMonth && styles.monthItemActive,
                    ]}
                    onPress={() => selectMonth(idx)}
                  >
                    <Text style={[styles.monthText, idx === viewMonth && styles.monthTextActive]}>
                      {SHORT_MONTHS[idx]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Footer buttons */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={clearDate} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDate} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  required: { color: '#ef4444' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2', borderWidth: 2 },
  inputDisabled: { opacity: 0.5 },
  inputText: { flex: 1, fontSize: 15, color: '#1e293b' },
  placeholder: { color: '#94a3b8' },
  labelError: { color: '#dc2626' },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4, marginLeft: 4 },
  hint: { fontSize: 12, color: '#94a3b8', marginTop: 4, marginLeft: 4 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '75%',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },

  previewRow: {
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
  },
  previewText: { fontSize: 16, fontWeight: '600', color: '#0d9488' },

  // Nav
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: { padding: 8 },
  navCenter: { flexDirection: 'row', gap: 6 },
  navLabelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  navLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },

  // Weekday
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  weekDay: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // Days
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellSelected: { backgroundColor: '#0d9488' },
  dayCellToday: { borderWidth: 1.5, borderColor: '#0d9488' },
  dayCellDisabled: { opacity: 0.3 },
  dayText: { fontSize: 14, color: '#334155' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  dayTextToday: { color: '#0d9488', fontWeight: '600' },
  dayTextDisabled: { color: '#cbd5e1' },

  // Year list
  yearList: { maxHeight: 300, paddingHorizontal: 20 },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 10,
  },
  yearItemActive: { backgroundColor: '#f0fdfa' },
  yearText: { fontSize: 16, color: '#334155' },
  yearTextActive: { color: '#0d9488', fontWeight: '700' },

  // Month grid
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  monthItem: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  monthItemActive: { backgroundColor: '#0d9488' },
  monthText: { fontSize: 15, fontWeight: '500', color: '#334155' },
  monthTextActive: { color: '#fff', fontWeight: '700' },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  clearBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0d9488',
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
