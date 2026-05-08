/**
 * Organization Preferences Screen
 * Modern settings-style UI with Yes/No pills, dropdowns, and proper input types
 */

import { Colors, getRoleGradient, extractApiError } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  RotateCcw,
  Check,
  Info,
  X,
  BookOpen,
  Clock,
  Bell,
  Shield,
  Users,
  HelpCircle,
  Calendar,
  Eye,
} from 'lucide-react-native';
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  type TextInput as TextInputType,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import type { SaturdayOffPattern } from '@/features/holidays/api/holidays-api';
import {
  useWorkingDayPolicy,
  useCreateWorkingDayPolicy,
  useUpdateWorkingDayPolicy,
} from '@/features/holidays/hooks/use-holidays';
import {
  useGroupedPreferences,
  useUpdatePreference,
  useResetPreference,
  type OrganizationPreference,
  type GroupedPreference,
} from '@/features/preferences';
import { useAuthStore } from '@/lib/auth-store';
import { isAdminRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: any; bg: string; color: string }> = {
  attendance: { icon: Clock, bg: '#dbeafe', color: '#2563eb' },
  leave: { icon: BookOpen, bg: '#dcfce7', color: '#16a34a' },
  notification: { icon: Bell, bg: '#fef3c7', color: '#d97706' },
  email: { icon: Bell, bg: '#fef3c7', color: '#d97706' },
  security: { icon: Shield, bg: '#fce7f3', color: '#db2777' },
  general: { icon: Settings, bg: '#ede9fe', color: '#7c3aed' },
  organization: { icon: Users, bg: '#e0f2fe', color: '#0284c7' },
  student: { icon: Users, bg: '#e0f2fe', color: '#0284c7' },
};

const getCategoryConfig = (category: string) => {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_CONFIG.general;
};

/**
 * Determine the display labels for a radio/boolean-like preference.
 * Returns [falseLabel, trueLabel, falseValue, trueValue] or null if not boolean-like.
 */
const getRadioLabels = (
  pref: OrganizationPreference
): { falseLabel: string; trueLabel: string; falseVal: string; trueVal: string } | null => {
  if (pref.field_type === 'radio') {
    // Radio with applicable_values like ["Present", "Absent"] or ["TRUE", "FALSE"]
    if (pref.applicable_values?.length === 2) {
      const vals = pref.applicable_values;
      const upper0 = vals[0].toUpperCase();
      const upper1 = vals[1].toUpperCase();
      // Determine which is "positive" and which is "negative"
      if (upper0 === 'TRUE' || upper0 === 'YES' || upper0 === 'PRESENT') {
        return { trueLabel: vals[0], falseLabel: vals[1], trueVal: vals[0], falseVal: vals[1] };
      }
      if (upper1 === 'TRUE' || upper1 === 'YES' || upper1 === 'PRESENT') {
        return { trueLabel: vals[1], falseLabel: vals[0], trueVal: vals[1], falseVal: vals[0] };
      }
      // Default: first = positive
      return { trueLabel: vals[0], falseLabel: vals[1], trueVal: vals[0], falseVal: vals[1] };
    }
    // Radio without applicable_values — default Yes/No
    return { trueLabel: 'Yes', falseLabel: 'No', trueVal: 'TRUE', falseVal: 'FALSE' };
  }
  return null;
};

/** Check if current value is the "true" / positive option */
const isPositiveValue = (pref: OrganizationPreference): boolean => {
  const val = String(pref.value).toUpperCase();
  return val === 'TRUE' || val === 'YES' || val === 'PRESENT';
};

export default function OrgPreferencesScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [tooltipPref, setTooltipPref] = useState<string | null>(null);
  const [dropdownPref, setDropdownPref] = useState<OrganizationPreference | null>(null);
  const [multiSelectPref, setMultiSelectPref] = useState<OrganizationPreference | null>(null);
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const [editingTextPref, setEditingTextPref] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState('');

  // Role-based access check
  const { user } = useAuthStore();
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const { data, isLoading, refetch } = useGroupedPreferences();
  const updateMutation = useUpdatePreference();
  const resetMutation = useResetPreference();

  // Working Day Policy
  const { data: wdpData, refetch: refetchWdp } = useWorkingDayPolicy();
  const createWdpMutation = useCreateWorkingDayPolicy();
  const updateWdpMutation = useUpdateWorkingDayPolicy();
  const [wdpExpanded, setWdpExpanded] = useState(false);

  const currentPolicy = wdpData?.data?.[0] ?? null;

  const groups: GroupedPreference[] = data?.data || [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetch(), refetchWdp()]).finally(() => setRefreshing(false));
  }, [refetch, refetchWdp]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleUpdate = (publicId: string, value: string | string[]) => {
    updateMutation.mutate(
      { publicId, value },
      {
        onError: (err: any) => {
          Alert.alert('Error', extractApiError(err, 'Failed to update preference'));
        },
      }
    );
  };

  const handleReset = (pref: OrganizationPreference) => {
    Alert.alert('Reset to Default', `Reset "${pref.display_name}" to its default value?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => resetMutation.mutate(pref.public_id),
      },
    ]);
  };

  // ── Tooltip badge (always shown, colorful) ──
  const renderTooltip = (pref: OrganizationPreference) => {
    if (!pref.description) return null;
    const isOpen = tooltipPref === pref.public_id;
    return (
      <>
        <TouchableOpacity
          onPress={() => setTooltipPref(isOpen ? null : pref.public_id)}
          hitSlop={10}
          style={styles.tooltipBadge}
        >
          <HelpCircle size={16} color="#7c3aed" />
        </TouchableOpacity>
        {isOpen && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.tooltip}>
            <View style={styles.tooltipArrow} />
            <Text style={styles.tooltipText}>{pref.description}</Text>
          </Animated.View>
        )}
      </>
    );
  };

  // ── Yes/No pill buttons (for radio / boolean fields) ──
  const renderRadioPills = (pref: OrganizationPreference) => {
    const labels = getRadioLabels(pref);
    if (!labels) return renderTextInput(pref);

    const isPositive = isPositiveValue(pref);

    return (
      <View style={styles.prefRow}>
        <View style={styles.prefLabelRow}>
          {renderTooltip(pref)}
          <Text style={styles.prefName}>{pref.display_name}</Text>
        </View>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[
              styles.pill,
              isPositive && styles.pillActiveGreen,
              !canManage && styles.pillDisabled,
            ]}
            onPress={() => canManage && handleUpdate(pref.public_id, labels.trueVal)}
            disabled={updateMutation.isPending || !canManage}
            activeOpacity={canManage ? 0.7 : 1}
          >
            <Text style={[styles.pillText, isPositive && styles.pillTextActive]}>
              {labels.trueLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pill,
              !isPositive && styles.pillActiveRed,
              !canManage && styles.pillDisabled,
            ]}
            onPress={() => canManage && handleUpdate(pref.public_id, labels.falseVal)}
            disabled={updateMutation.isPending || !canManage}
            activeOpacity={canManage ? 0.7 : 1}
          >
            <Text style={[styles.pillText, !isPositive && styles.pillTextActive]}>
              {labels.falseLabel}
            </Text>
          </TouchableOpacity>
        </View>
        {canManage && (
          <TouchableOpacity onPress={() => handleReset(pref)} style={styles.resetLink}>
            <RotateCcw size={11} color={Colors.gray[400]} />
            <Text style={styles.resetLinkText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Choice dropdown (single select) ──
  const renderChoice = (pref: OrganizationPreference) => {
    const currentVal = String(pref.value);
    return (
      <View style={styles.prefRow}>
        <View style={styles.prefLabelRow}>
          {renderTooltip(pref)}
          <Text style={styles.prefName}>{pref.display_name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.dropdown, !canManage && { opacity: 0.6 }]}
          onPress={() => canManage && setDropdownPref(pref)}
          activeOpacity={canManage ? 0.7 : 1}
          disabled={!canManage}
        >
          <Text style={styles.dropdownText}>{currentVal || 'Select...'}</Text>
          <ChevronDown size={16} color={Colors.gray[500]} />
        </TouchableOpacity>
        {canManage && (
          <TouchableOpacity onPress={() => handleReset(pref)} style={styles.resetLink}>
            <RotateCcw size={11} color={Colors.gray[400]} />
            <Text style={styles.resetLinkText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Multi-choice (multi-select dropdown) ──
  const renderMultiChoice = (pref: OrganizationPreference) => {
    const values = Array.isArray(pref.value) ? pref.value : [];
    return (
      <View style={styles.prefRow}>
        <View style={styles.prefLabelRow}>
          {renderTooltip(pref)}
          <Text style={styles.prefName}>{pref.display_name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.dropdown, !canManage && { opacity: 0.6 }]}
          onPress={() => {
            if (!canManage) return;
            setMultiSelectPref(pref);
            setMultiSelectValues([...values]);
          }}
          activeOpacity={canManage ? 0.7 : 1}
          disabled={!canManage}
        >
          <Text style={styles.dropdownText} numberOfLines={1}>
            {values.length > 0 ? values.join(', ') : 'Select...'}
          </Text>
          <ChevronDown size={16} color={Colors.gray[500]} />
        </TouchableOpacity>
        {values.length > 0 && (
          <View style={styles.chipRow}>
            {values.map((v) => (
              <View key={v} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{v}</Text>
              </View>
            ))}
          </View>
        )}
        {canManage && (
          <TouchableOpacity onPress={() => handleReset(pref)} style={styles.resetLink}>
            <RotateCcw size={11} color={Colors.gray[400]} />
            <Text style={styles.resetLinkText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Text / Number input ──
  const renderTextInput = (pref: OrganizationPreference) => {
    const isEditing = editingTextPref === pref.public_id;
    const currentVal = String(pref.value);
    const isNumber = pref.field_type === 'number';

    return (
      <View style={styles.prefRow}>
        <View style={styles.prefLabelRow}>
          {renderTooltip(pref)}
          <Text style={styles.prefName}>{pref.display_name}</Text>
        </View>
        {isEditing && canManage ? (
          <View style={styles.textEditRow}>
            <TextInput
              style={styles.textInput}
              value={editTextValue}
              onChangeText={setEditTextValue}
              autoFocus
              keyboardType={isNumber ? 'numeric' : 'default'}
              placeholder={`Enter ${pref.display_name.toLowerCase()}`}
              placeholderTextColor={Colors.gray[400]}
              onFocus={(e) => {
                // Scroll to make input visible above keyboard
                setTimeout(() => {
                  (e.target as any)?.measureInWindow?.(
                    (_x: number, y: number, _w: number, h: number) => {
                      scrollRef.current?.scrollTo({ y: y - 200, animated: true });
                    }
                  );
                }, 300);
              }}
              onSubmitEditing={() => {
                handleUpdate(pref.public_id, editTextValue);
                setEditingTextPref(null);
              }}
            />
            <TouchableOpacity
              style={styles.textSaveBtn}
              onPress={() => {
                handleUpdate(pref.public_id, editTextValue);
                setEditingTextPref(null);
                Keyboard.dismiss();
              }}
            >
              <Check size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.textCancelBtn}
              onPress={() => {
                setEditingTextPref(null);
                Keyboard.dismiss();
              }}
            >
              <X size={16} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.textValueBox, !canManage && { opacity: 0.6 }]}
            onPress={() => {
              if (!canManage) return;
              setEditingTextPref(pref.public_id);
              setEditTextValue(currentVal);
            }}
            activeOpacity={canManage ? 0.7 : 1}
            disabled={!canManage}
          >
            <Text style={[styles.textValue, !currentVal && styles.textPlaceholder]}>
              {currentVal || (canManage ? 'Tap to set value' : 'Not set')}
            </Text>
          </TouchableOpacity>
        )}
        {canManage && (
          <TouchableOpacity onPress={() => handleReset(pref)} style={styles.resetLink}>
            <RotateCcw size={11} color={Colors.gray[400]} />
            <Text style={styles.resetLinkText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Render a single preference based on type ──
  const renderPreference = (pref: OrganizationPreference) => {
    // Radio fields → Yes/No or Present/Absent pills
    if (pref.field_type === 'radio') return renderRadioPills(pref);
    // Choice with applicable values → dropdown or pills if only 2 options
    if (pref.field_type === 'choice' && pref.applicable_values) {
      if (pref.applicable_values.length === 2) {
        // Show as pill selector for 2-option choices
        return renderChoicePills(pref);
      }
      return renderChoice(pref);
    }
    // Multi-choice → multi-select dropdown
    if (pref.field_type === 'multi-choice') return renderMultiChoice(pref);
    // Everything else → text/number input
    return renderTextInput(pref);
  };

  // ── Choice pills for 2-option choices ──
  const renderChoicePills = (pref: OrganizationPreference) => {
    const vals = pref.applicable_values || [];
    const currentVal = String(pref.value);
    return (
      <View style={styles.prefRow}>
        <View style={styles.prefLabelRow}>
          {renderTooltip(pref)}
          <Text style={styles.prefName}>{pref.display_name}</Text>
        </View>
        <View style={styles.pillRow}>
          {vals.map((val) => {
            const isActive = val === currentVal;
            return (
              <TouchableOpacity
                key={val}
                style={[
                  styles.pill,
                  isActive && styles.pillActiveBlue,
                  !canManage && styles.pillDisabled,
                ]}
                onPress={() => canManage && handleUpdate(pref.public_id, val)}
                disabled={updateMutation.isPending || !canManage}
                activeOpacity={canManage ? 0.7 : 1}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{val}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {canManage && (
          <TouchableOpacity onPress={() => handleReset(pref)} style={styles.resetLink}>
            <RotateCcw size={11} color={Colors.gray[400]} />
            <Text style={styles.resetLinkText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ── Working Day Policy handlers ──
  const SATURDAY_OPTIONS: { label: string; value: SaturdayOffPattern }[] = [
    { label: 'No Saturdays Off', value: 'NONE' },
    { label: '2nd Saturday Off', value: 'SECOND_ONLY' },
    { label: '2nd & 4th Saturday Off', value: 'SECOND_AND_FOURTH' },
    { label: 'All Saturdays Off', value: 'ALL' },
  ];

  const getSaturdayLabel = (val: SaturdayOffPattern) =>
    SATURDAY_OPTIONS.find((o) => o.value === val)?.label ?? val;

  const handleWdpUpdate = async (field: string, value: any) => {
    try {
      if (currentPolicy) {
        await updateWdpMutation.mutateAsync({
          id: currentPolicy.public_id,
          data: { [field]: value },
        });
      } else {
        // Create new policy with defaults
        const today = new Date().toISOString().split('T')[0];
        await createWdpMutation.mutateAsync({
          sunday_off: field === 'sunday_off' ? value : true,
          saturday_off_pattern: field === 'saturday_off_pattern' ? value : 'SECOND_AND_FOURTH',
          effective_from: field === 'effective_from' ? value : today,
        });
      }
    } catch (e: unknown) {
      Alert.alert('Error', extractApiError(e, 'Failed to update working day policy'));
    }
  };

  const [saturdayDropdownOpen, setSaturdayDropdownOpen] = useState(false);

  const renderWorkingDayPolicyCard = () => (
    <Animated.View
      entering={FadeInDown.delay(groups.length * 80).duration(400)}
      style={styles.categoryCard}
    >
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => setWdpExpanded(!wdpExpanded)}
        activeOpacity={0.7}
      >
        <View style={[styles.catIconCircle, { backgroundColor: '#fef3c7' }]}>
          <Calendar size={18} color="#d97706" />
        </View>
        <View style={styles.catInfo}>
          <Text style={styles.catTitle}>Working Day Policy</Text>
          <Text style={styles.catCount}>Sunday & Saturday rules</Text>
        </View>
        {wdpExpanded ? (
          <ChevronUp size={20} color={Colors.gray[400]} />
        ) : (
          <ChevronDown size={20} color={Colors.gray[400]} />
        )}
      </TouchableOpacity>

      {wdpExpanded && (
        <View style={styles.prefList}>
          {/* Sunday Off */}
          <View style={styles.prefRow}>
            <View style={styles.prefLabelRow}>
              <Text style={styles.prefName}>Sunday Off</Text>
            </View>
            <View style={styles.pillRow}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  currentPolicy?.sunday_off !== false && styles.pillActiveGreen,
                  !canManage && styles.pillDisabled,
                ]}
                onPress={() => canManage && handleWdpUpdate('sunday_off', true)}
                disabled={updateWdpMutation.isPending || createWdpMutation.isPending || !canManage}
                activeOpacity={canManage ? 0.7 : 1}
              >
                <Text
                  style={[
                    styles.pillText,
                    currentPolicy?.sunday_off !== false && styles.pillTextActive,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.pill,
                  currentPolicy?.sunday_off === false && styles.pillActiveRed,
                  !canManage && styles.pillDisabled,
                ]}
                onPress={() => canManage && handleWdpUpdate('sunday_off', false)}
                disabled={updateWdpMutation.isPending || createWdpMutation.isPending || !canManage}
                activeOpacity={canManage ? 0.7 : 1}
              >
                <Text
                  style={[
                    styles.pillText,
                    currentPolicy?.sunday_off === false && styles.pillTextActive,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Saturday Off Pattern */}
          <View style={styles.prefRow}>
            <View style={styles.prefLabelRow}>
              <Text style={styles.prefName}>Saturday Off Pattern</Text>
            </View>
            <TouchableOpacity
              style={[styles.dropdown, !canManage && { opacity: 0.6 }]}
              onPress={() => canManage && setSaturdayDropdownOpen(true)}
              activeOpacity={canManage ? 0.7 : 1}
              disabled={!canManage}
            >
              <Text style={styles.dropdownText}>
                {currentPolicy ? getSaturdayLabel(currentPolicy.saturday_off_pattern) : 'Select...'}
              </Text>
              <ChevronDown size={16} color={Colors.gray[500]} />
            </TouchableOpacity>
          </View>

          {currentPolicy?.effective_from && (
            <>
              <View style={styles.divider} />
              <View style={styles.prefRow}>
                <View style={styles.prefLabelRow}>
                  <Text style={styles.prefName}>Effective From</Text>
                </View>
                <Text style={{ fontSize: 14, color: Colors.gray[600] }}>
                  {currentPolicy.effective_from}
                </Text>
              </View>
            </>
          )}

          {!currentPolicy && (
            <View style={{ padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: Colors.gray[400], textAlign: 'center' }}>
                No policy set yet. Choose options above to create one.
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );

  const renderSaturdayModal = () => (
    <Modal
      visible={saturdayDropdownOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setSaturdayDropdownOpen(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setSaturdayDropdownOpen(false)}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Saturday Off Pattern</Text>
          <ScrollView style={styles.modalList}>
            {SATURDAY_OPTIONS.map((opt) => {
              const isSelected = currentPolicy?.saturday_off_pattern === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => {
                    handleWdpUpdate('saturday_off_pattern', opt.value);
                    setSaturdayDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color={Colors.primary[500]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const formatCategory = (cat: string) =>
    cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Single-select modal ──
  const renderDropdownModal = () => {
    if (!dropdownPref) return null;
    const values = dropdownPref.applicable_values || [];
    const currentVal = String(dropdownPref.value);
    return (
      <Modal visible transparent animationType="slide" onRequestClose={() => setDropdownPref(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownPref(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{dropdownPref.display_name}</Text>
            <ScrollView style={styles.modalList}>
              {values.map((val) => {
                const isSelected = val === currentVal;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      handleUpdate(dropdownPref.public_id, val);
                      setDropdownPref(null);
                    }}
                  >
                    <Text
                      style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                    >
                      {val}
                    </Text>
                    {isSelected && <Check size={18} color="#16a34a" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  // ── Multi-select modal ──
  const renderMultiSelectModal = () => {
    if (!multiSelectPref) return null;
    const values = multiSelectPref.applicable_values || [];
    return (
      <Modal
        visible
        transparent
        animationType="slide"
        onRequestClose={() => setMultiSelectPref(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMultiSelectPref(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{multiSelectPref.display_name}</Text>
            <ScrollView style={styles.modalList}>
              {values.map((val) => {
                const isSelected = multiSelectValues.includes(val);
                return (
                  <TouchableOpacity
                    key={val}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      setMultiSelectValues((prev) =>
                        isSelected ? prev.filter((v) => v !== val) : [...prev, val]
                      );
                    }}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={12} color="#fff" />}
                    </View>
                    <Text
                      style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => {
                handleUpdate(multiSelectPref.public_id, multiSelectValues.join(','));
                setMultiSelectPref(null);
              }}
            >
              <Text style={styles.modalSaveBtnText}>
                Save ({multiSelectValues.length} selected)
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={adminGradient} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>{groups.length + 1} categories</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Read-only banner for teachers */}
          {!canManage && (
            <View style={styles.readOnlyBanner}>
              <Eye size={16} color="#7c3aed" />
              <Text style={styles.readOnlyText}>View only — Contact admin to modify settings</Text>
            </View>
          )}
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {groups.map((group, groupIdx) => {
              const isExpanded = expandedCategories.has(group.category);
              const catConfig = getCategoryConfig(group.category);
              const CatIcon = catConfig.icon;
              return (
                <Animated.View
                  key={group.category}
                  entering={FadeInDown.delay(groupIdx * 80).duration(400)}
                  style={styles.categoryCard}
                >
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleCategory(group.category)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catIconCircle, { backgroundColor: catConfig.bg }]}>
                      <CatIcon size={18} color={catConfig.color} />
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catTitle}>{formatCategory(group.category)}</Text>
                      <Text style={styles.catCount}>{group.count} settings</Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={Colors.gray[400]} />
                    ) : (
                      <ChevronDown size={20} color={Colors.gray[400]} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.prefList}>
                      {group.preferences.map((pref, idx) => (
                        <View key={pref.public_id}>
                          {idx > 0 && <View style={styles.divider} />}
                          {renderPreference(pref)}
                        </View>
                      ))}
                    </View>
                  )}
                </Animated.View>
              );
            })}

            {/* Working Day Policy Card */}
            {renderWorkingDayPolicyCard()}

            {groups.length === 0 && (
              <View style={styles.emptyContainer}>
                <Settings size={48} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No preferences configured</Text>
              </View>
            )}

            {/* Extra space so keyboard doesn't cover last items */}
            <View style={{ height: 200 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {renderDropdownModal()}
      {renderMultiSelectModal()}
      {renderSaturdayModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingTop: 44, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: { zIndex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Read-only banner
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  readOnlyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7c3aed',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },

  // Category card
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  catIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: { flex: 1, marginLeft: 14 },
  catTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  catCount: { fontSize: 12, color: Colors.gray[500], marginTop: 2 },

  // Preferences list
  prefList: { paddingHorizontal: 16, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },

  // Single preference row
  prefRow: { paddingVertical: 12 },
  prefLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  prefName: { fontSize: 14, fontWeight: '600', color: '#334155', flex: 1 },

  // Tooltip badge (colorful, always at start)
  tooltipBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltip: {
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -5,
    left: 18,
    width: 10,
    height: 10,
    backgroundColor: '#faf5ff',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#ddd6fe',
    transform: [{ rotate: '45deg' }],
  },
  tooltipText: { fontSize: 12, color: '#6b21a8', lineHeight: 17 },

  // Reset link
  resetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  resetLinkText: { fontSize: 11, color: Colors.gray[400] },

  // Yes/No pill buttons
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  pillActiveGreen: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  pillActiveRed: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  pillActiveBlue: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  pillDisabled: { opacity: 0.6 },
  pillText: { fontSize: 14, fontWeight: '600', color: Colors.gray[500] },
  pillTextActive: { color: '#1e293b' },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  dropdownText: { fontSize: 14, color: '#334155', flex: 1 },

  // Multi-choice chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  selectedChip: {
    backgroundColor: '#ede9fe',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedChipText: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },

  // Text input
  textEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    color: '#334155',
  },
  textSaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCancelBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textValueBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  textValue: { fontSize: 14, color: '#334155' },
  textPlaceholder: { color: Colors.gray[400] },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  modalDesc: { fontSize: 13, color: Colors.gray[500], marginBottom: 12, lineHeight: 18 },
  modalList: { maxHeight: 300 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionSelected: { backgroundColor: '#f0fdf4' },
  modalOptionText: { fontSize: 15, color: '#334155', flex: 1 },
  modalOptionTextSelected: { color: '#16a34a', fontWeight: '600' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  modalSaveBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  modalSaveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: Colors.gray[400], marginTop: 12 },
});
