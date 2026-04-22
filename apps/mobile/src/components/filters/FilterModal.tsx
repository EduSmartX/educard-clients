/**
 * FilterModal - Beautiful colorful filter bottom sheet
 * Supports select chips, toggle switches with vibrant colors
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { X, RotateCcw, SlidersHorizontal } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ── Types ────────────────────────────────────────────────────────
export interface FilterOption {
  value: string;
  label: string;
  icon?: string; // emoji
}

export interface FilterField {
  name: string;
  label: string;
  type: 'select' | 'toggle';
  options?: FilterOption[];
  icon?: string; // emoji for section header
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
  fields: FilterField[];
  currentFilters: Record<string, any>;
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
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (visible) {
      setLocalFilters({ ...currentFilters });
    }
  }, [visible, currentFilters]);

  const activeCount = useMemo(() => {
    return Object.values(localFilters).filter(
      (v) => v !== '' && v !== undefined && v !== false
    ).length;
  }, [localFilters]);

  const handleSelectOption = (fieldName: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName] === value ? '' : value,
    }));
  };

  const handleToggle = (fieldName: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  const handleApply = () => {
    const cleaned: Record<string, any> = {};
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
                <Animated.View
                  key={field.name}
                  entering={FadeInDown.delay(sectionIdx * 80)}
                  style={styles.toggleSection}
                >
                  <Text style={styles.toggleLabel}>
                    {field.icon ? `${field.icon}  ` : ''}
                    {field.label}
                  </Text>
                  <Switch
                    value={!!localFilters[field.name]}
                    onValueChange={() => handleToggle(field.name)}
                    trackColor={{ false: '#e2e8f0', true: '#c4b5fd' }}
                    thumbColor={localFilters[field.name] ? '#7c3aed' : '#94a3b8'}
                  />
                </Animated.View>
              );
            }

            // select type
            const selectOptions = (field.options || []).filter(
              (o) => o.value !== ''
            );

            return (
              <Animated.View
                key={field.name}
                entering={FadeInDown.delay(sectionIdx * 80)}
                style={styles.section}
              >
                <Text style={styles.sectionTitle}>
                  {field.icon ? `${field.icon}  ` : ''}
                  {field.label}
                </Text>
                <View style={styles.chipRow}>
                  {selectOptions.map((opt) => {
                    const isActive = localFilters[field.name] === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.7}
                        onPress={() =>
                          handleSelectOption(field.name, opt.value)
                        }
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isActive
                              ? colors.activeBg
                              : colors.bg,
                            borderColor: isActive
                              ? colors.active
                              : 'transparent',
                          },
                        ]}
                      >
                        {opt.icon && (
                          <Text style={styles.chipIcon}>{opt.icon}</Text>
                        )}
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isActive ? '#fff' : colors.text,
                              fontWeight: isActive ? '700' : '500',
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
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
