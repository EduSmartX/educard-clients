/**
 * FormTimePicker - Modal time picker with hour/minute selection
 * Uses 12-hour format for display, stores as HH:MM (24h) internally.
 */

import { Clock, X, Check } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FormTimePickerProps {
  readonly label: string;
  readonly value: string; // HH:MM format (24h)
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly disabled?: boolean;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

/** Convert 24h HH:MM to display string */
function formatTimeDisplay(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Convert 12h selection to 24h HH:MM */
function to24h(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  let h24 = hour12;
  if (period === 'AM' && hour12 === 12) h24 = 0;
  else if (period === 'PM' && hour12 !== 12) h24 = hour12 + 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Parse 24h HH:MM to 12h components */
function parse24h(time: string): {
  hour12: number;
  minute: number;
  period: 'AM' | 'PM';
} {
  if (!time) return { hour12: 9, minute: 0, period: 'AM' };
  const [h, m] = time.split(':').map(Number);
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return { hour12, minute: m, period };
}

export function FormTimePicker({
  label,
  value,
  onChange,
  placeholder = 'Select time',
  required = false,
  error,
  disabled = false,
}: FormTimePickerProps) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const parsed = useMemo(() => parse24h(value), [value]);
  const [selectedHour, setSelectedHour] = useState(parsed.hour12);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(
    parsed.period,
  );

  const openPicker = () => {
    if (disabled) return;
    const p = parse24h(value);
    setSelectedHour(p.hour12);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
    setVisible(true);
  };

  const handleConfirm = () => {
    const timeStr = to24h(selectedHour, selectedMinute, selectedPeriod);
    onChange(timeStr);
    setVisible(false);
  };

  const handleClear = () => {
    onChange('');
    setVisible(false);
  };

  return (
    <View style={styles.container}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Clock size={16} color={value ? '#7c3aed' : '#94a3b8'} />
        <Text style={[styles.triggerText, !value && styles.placeholder]}>
          {value ? formatTimeDisplay(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + 20 }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={12}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {selectedHour}:{String(selectedMinute).padStart(2, '0')}{' '}
                {selectedPeriod}
              </Text>
            </View>

            {/* Hour Selection */}
            <Text style={styles.sectionLabel}>Hour</Text>
            <View style={styles.grid}>
              {HOURS_12.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.gridItem,
                    selectedHour === h && styles.gridItemSelected,
                  ]}
                  onPress={() => setSelectedHour(h)}
                >
                  <Text
                    style={[
                      styles.gridText,
                      selectedHour === h && styles.gridTextSelected,
                    ]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minute Selection */}
            <Text style={styles.sectionLabel}>Minute</Text>
            <FlatList
              data={MINUTES}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.toString()}
              contentContainerStyle={styles.minuteList}
              renderItem={({ item: m }) => (
                <TouchableOpacity
                  style={[
                    styles.minuteItem,
                    selectedMinute === m && styles.minuteItemSelected,
                  ]}
                  onPress={() => setSelectedMinute(m)}
                >
                  <Text
                    style={[
                      styles.minuteText,
                      selectedMinute === m && styles.minuteTextSelected,
                    ]}
                  >
                    :{String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* AM/PM Toggle */}
            <View style={styles.periodRow}>
              <TouchableOpacity
                style={[
                  styles.periodBtn,
                  selectedPeriod === 'AM' && styles.periodBtnActive,
                ]}
                onPress={() => setSelectedPeriod('AM')}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === 'AM' && styles.periodTextActive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.periodBtn,
                  selectedPeriod === 'PM' && styles.periodBtnActive,
                ]}
                onPress={() => setSelectedPeriod('PM')}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === 'PM' && styles.periodTextActive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {value ? (
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirm}
              >
                <Check size={18} color="#fff" />
                <Text style={styles.confirmText}>Confirm</Text>
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
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  required: { color: '#ef4444' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  triggerError: { borderColor: '#ef4444' },
  triggerDisabled: { opacity: 0.5, backgroundColor: '#f8fafc' },
  triggerText: { fontSize: 15, color: '#1e293b', flex: 1 },
  placeholder: { color: '#94a3b8' },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  preview: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  previewText: { fontSize: 28, fontWeight: '700', color: '#7c3aed' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridItem: {
    width: '14%',
    aspectRatio: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  gridItemSelected: { backgroundColor: '#7c3aed' },
  gridText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  gridTextSelected: { color: '#fff' },
  minuteList: { gap: 8, marginBottom: 16 },
  minuteItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  minuteItemSelected: { backgroundColor: '#7c3aed' },
  minuteText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  minuteTextSelected: { color: '#fff' },
  periodRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: '#7c3aed' },
  periodText: { fontSize: 16, fontWeight: '700', color: '#475569' },
  periodTextActive: { color: '#fff' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearBtn: { padding: 12 },
  clearText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
