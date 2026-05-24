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
  X,
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
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
import { useToast } from '@/lib/toast-context';
import { isAdminRole } from '@/utils/role-utils';

import {
  getCategoryConfig,
  formatDropdownValue,
  getRadioLabels,
  isPositiveValue,
  formatCategory,
} from './constants';
import { SingleSelectModal, MultiSelectModal, SaturdayPatternModal } from './PreferenceModals';
import { styles } from './styles';

const adminGradient = getRoleGradient('admin');

const SATURDAY_OPTIONS: { label: string; value: SaturdayOffPattern }[] = [
  { label: 'No Saturdays Off', value: 'NONE' },
  { label: '2nd Saturday Off', value: 'SECOND_ONLY' },
  { label: '2nd & 4th Saturday Off', value: 'SECOND_AND_FOURTH' },
  { label: 'All Saturdays Off', value: 'ALL' },
];

const getSaturdayLabel = (val: SaturdayOffPattern) =>
  SATURDAY_OPTIONS.find((o) => o.value === val)?.label ?? val;

export default function OrgPreferencesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [tooltipPref, setTooltipPref] = useState<string | null>(null);
  const [dropdownPref, setDropdownPref] = useState<OrganizationPreference | null>(null);
  const [multiSelectPref, setMultiSelectPref] = useState<OrganizationPreference | null>(null);
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const [editingTextPref, setEditingTextPref] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState('');

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
  const [saturdayDropdownOpen, setSaturdayDropdownOpen] = useState(false);

  const currentPolicy = wdpData?.data?.[0] ?? null;
  const groups: GroupedPreference[] = data?.data ?? [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([refetch(), refetchWdp()]).finally(() => setRefreshing(false));
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
        onError: (err: unknown) => {
          showToast({
            type: 'error',
            title: 'Error',
            message: extractApiError(err, 'Failed to update preference'),
          });
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

  const handleWdpUpdate = async (field: string, value: boolean | SaturdayOffPattern) => {
    try {
      if (currentPolicy) {
        await updateWdpMutation.mutateAsync({
          id: currentPolicy.public_id,
          data: { [field]: value },
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        const defaultSundayOff = field === 'sunday_off' ? (value as boolean) : true;
        const defaultSatPattern =
          field === 'saturday_off_pattern' ? (value as SaturdayOffPattern) : 'SECOND_AND_FOURTH';
        const defaultEffectiveFrom = field === 'effective_from' ? (value as string) : today;
        await createWdpMutation.mutateAsync({
          sunday_off: defaultSundayOff,
          saturday_off_pattern: defaultSatPattern,
          effective_from: defaultEffectiveFrom,
        });
      }
    } catch (e: unknown) {
      showToast({
        type: 'error',
        title: 'Error',
        message: extractApiError(e, 'Failed to update working day policy'),
      });
    }
  };

  // ── Tooltip badge ──
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

  // ── Yes/No pill buttons ──
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

  // ── Choice dropdown ──
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
          <Text style={styles.dropdownText}>{formatDropdownValue(currentVal) || 'Select...'}</Text>
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

  // ── Multi-choice ──
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
            {values.length > 0 ? values.map(formatDropdownValue).join(', ') : 'Select...'}
          </Text>
          <ChevronDown size={16} color={Colors.gray[500]} />
        </TouchableOpacity>
        {values.length > 0 && (
          <View style={styles.chipRow}>
            {values.map((v) => (
              <View key={v} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{formatDropdownValue(v)}</Text>
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

  // ── Choice pills for 2-option choices ──
  const renderChoicePills = (pref: OrganizationPreference) => {
    const vals = pref.applicable_values ?? [];
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

  // ── Render a single preference based on type ──
  const renderPreference = (pref: OrganizationPreference) => {
    if (pref.field_type === 'radio') return renderRadioPills(pref);
    if (pref.field_type === 'choice' && pref.applicable_values) {
      if (pref.applicable_values.length === 2) return renderChoicePills(pref);
      return renderChoice(pref);
    }
    if (pref.field_type === 'multi-choice') return renderMultiChoice(pref);
    return renderTextInput(pref);
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
        <View style={{ flex: 1 }}>
          {!canManage && (
            <View style={styles.readOnlyBanner}>
              <Eye size={16} color="#7c3aed" />
              <Text style={styles.readOnlyText}>View only — Contact admin to modify settings</Text>
            </View>
          )}
          <KeyboardAwareScrollView
            ref={scrollRef as any}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            extraScrollHeight={20}
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
                        onPress={() => {
                          if (canManage) void handleWdpUpdate('sunday_off', true);
                        }}
                        disabled={
                          updateWdpMutation.isPending || createWdpMutation.isPending || !canManage
                        }
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
                        onPress={() => {
                          if (canManage) void handleWdpUpdate('sunday_off', false);
                        }}
                        disabled={
                          updateWdpMutation.isPending || createWdpMutation.isPending || !canManage
                        }
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
                        {currentPolicy
                          ? getSaturdayLabel(currentPolicy.saturday_off_pattern)
                          : 'Select...'}
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

            {groups.length === 0 && (
              <View style={styles.emptyContainer}>
                <Settings size={48} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No preferences configured</Text>
              </View>
            )}

            <View style={{ height: 200 }} />
          </KeyboardAwareScrollView>
        </View>
      )}

      {/* Single-select modal */}
      <SingleSelectModal
        pref={dropdownPref}
        onClose={() => setDropdownPref(null)}
        onSelect={handleUpdate}
      />

      {/* Multi-select modal */}
      <MultiSelectModal
        pref={multiSelectPref}
        values={multiSelectValues}
        setValues={setMultiSelectValues}
        onClose={() => setMultiSelectPref(null)}
        onSave={handleUpdate}
      />

      {/* Saturday pattern modal */}
      <SaturdayPatternModal
        visible={saturdayDropdownOpen}
        onClose={() => setSaturdayDropdownOpen(false)}
        options={SATURDAY_OPTIONS}
        currentPattern={currentPolicy?.saturday_off_pattern}
        onSelect={(value) => void handleWdpUpdate('saturday_off_pattern', value)}
      />
    </View>
  );
}
