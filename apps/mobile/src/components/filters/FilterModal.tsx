/**
 * FilterModal - Beautiful colorful filter bottom sheet
 * Supports select chips, toggle switches with vibrant colors
 */

import { X, RotateCcw, SlidersHorizontal } from 'lucide-react-native';
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { SearchableSelect } from '@/components/ui';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { LinearGradient } from '@/lib/linear-gradient';

// ── Color palette for chips ──────────────────────────────────────
const CHIP_COLORS = [
  { bg: '#ede9fe', active: '#7c3aed', text: '#6d28d9', activeBg: '#7c3aed' }, // violet
  { bg: '#e0e7ff', active: '#4f46e5', text: '#4338ca', activeBg: '#4f46e5' }, // indigo
  { bg: '#dbeafe', active: '#2563eb', text: '#1d4ed8', activeBg: '#2563eb' }, // blue
  { bg: '#ccfbf1', active: '#0d9488', text: '#0f766e', activeBg: '#0d9488' }, // teal
  { bg: '#dcfce7', active: '#16a34a', text: '#15803d', activeBg: '#16a34a' }, // green
  { bg: '#fef3c7', active: '#d97706', text: '#b45309', activeBg: '#d97706' }, // amber
  { bg: '#fce7f3', active: '#db2777', text: '#be185d', activeBg: '#db2777' }, // pink
];

// Switch a select from chips to a searchable dropdown past this many options.
const SEARCHABLE_THRESHOLD = 5;

// ── Types ────────────────────────────────────────────────────────
export interface FilterOption {
  value: string;
  label: string;
  icon?: string; // emoji
}

export interface FilterField {
  name: string;
  label: string;
  type: 'select' | 'toggle' | 'date';
  options?: FilterOption[];
  icon?: string; // emoji for section header
  placeholder?: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, unknown>) => void;
  fields: FilterField[];
  currentFilters: Record<string, unknown>;
  title?: string;
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  fields,
  currentFilters,
  title = 'Filters',
}: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<Record<string, unknown>>({});
  const wasVisible = useRef(false);

  // Seed local state only when the sheet opens; callers may pass a new
  // `currentFilters` reference every render, which must not wipe selections.
  useEffect(() => {
    if (visible && !wasVisible.current) {
      setLocalFilters({ ...currentFilters });
    }
    wasVisible.current = visible;
  }, [visible, currentFilters]);

  const activeCount = useMemo(() => {
    return Object.values(localFilters).filter(
      v => v !== '' && v !== undefined && v !== false,
    ).length;
  }, [localFilters]);

  const handleSelectOption = (fieldName: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [fieldName]: prev[fieldName] === value ? '' : value,
    }));
  };

  const handleToggle = (fieldName: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleReset = () => {
    setLocalFilters({});
    onApply({});
  };

  const handleApply = () => {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(localFilters)) {
      if (v !== '' && v !== undefined && v !== false) {
        cleaned[k] = v;
      }
    }
    onApply(cleaned);
    onClose();
  };

  const getChipColor = (sectionIdx: number) =>
    CHIP_COLORS[sectionIdx % CHIP_COLORS.length];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.dragHandleWrap}>
          <View style={styles.dragHandle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SlidersHorizontal size={20} color="#6366f1" />
            <Text style={styles.headerTitle}>{title}</Text>
            {activeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Filter Sections */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {fields.map((field, sectionIdx) => {
            const colors = getChipColor(sectionIdx);

            if (field.type === 'toggle') {
              return (
                <View key={field.name} style={styles.toggleSection}>
                  <Text style={styles.toggleLabel}>
                    {field.icon ? `${field.icon}  ` : ''}
                    {field.label}
                  </Text>
                  <Switch
                    value={!!localFilters[field.name]}
                    onValueChange={() => handleToggle(field.name)}
                    trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                    thumbColor={
                      localFilters[field.name] ? '#7c3aed' : '#94a3b8'
                    }
                  />
                </View>
              );
            }

            if (field.type === 'date') {
              return (
                <View key={field.name} style={styles.section}>
                  <FormDatePicker
                    label={`${field.icon ? `${field.icon}  ` : ''}${field.label}`}
                    value={(localFilters[field.name] as string) ?? ''}
                    onChange={v =>
                      setLocalFilters(prev => ({ ...prev, [field.name]: v }))
                    }
                    placeholder={field.placeholder}
                  />
                </View>
              );
            }

            // select type — chips for short lists, searchable dropdown when long
            const selectOptions = (field.options ?? []).filter(
              o => o.value !== '',
            );
            return (
              <View key={field.name} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {field.icon ? `${field.icon}  ` : ''}
                  {field.label}
                </Text>
                {selectOptions.length > SEARCHABLE_THRESHOLD ? (
                  <SearchableSelect
                    value={(localFilters[field.name] as string) ?? ''}
                    onValueChange={v =>
                      setLocalFilters(prev => ({ ...prev, [field.name]: v }))
                    }
                    options={[
                      { value: '', label: `All ${field.label}` },
                      ...selectOptions.map(o => ({
                        value: o.value,
                        label: o.label,
                      })),
                    ]}
                    placeholder={`All ${field.label}`}
                    searchPlaceholder={`Search ${field.label.toLowerCase()}...`}
                    emptyText={`No ${field.label.toLowerCase()} found`}
                  />
                ) : (
                  <View style={styles.chipRow}>
                    {selectOptions.map(opt => {
                      const isActive = localFilters[field.name] === opt.value;
                      const chipStyle: ViewStyle = {
                        backgroundColor: isActive ? colors.activeBg : colors.bg,
                        borderColor: isActive ? colors.active : 'transparent',
                      };
                      const chipTextStyle: TextStyle = {
                        color: isActive ? '#fff' : colors.text,
                        fontWeight: isActive ? '700' : '500',
                      };
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          activeOpacity={0.7}
                          onPress={() =>
                            handleSelectOption(field.name, opt.value)
                          }
                          style={[styles.chip, chipStyle]}
                        >
                          {opt.icon && (
                            <Text style={styles.chipIcon}>{opt.icon}</Text>
                          )}
                          <Text style={[styles.chipText, chipTextStyle]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <RotateCcw size={16} color="#64748b" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleApply} style={styles.applyBtnWrap}>
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyBtn}
            >
              <Text style={styles.applyText}>
                Apply{activeCount > 0 ? ` (${activeCount})` : ''}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 4,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  applyBtnWrap: {
    flex: 1,
  },
  applyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
