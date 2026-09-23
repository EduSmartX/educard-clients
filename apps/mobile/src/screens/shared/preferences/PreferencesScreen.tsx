/**
 * Organization Preferences Screen
 * Modern settings-style UI with Yes/No pills, dropdowns, and proper input types
 */

import { Colors, getRoleGradient, extractApiError } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
} from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import type {
  SaturdayOffPattern,
  WorkingDayPolicy,
} from '@/features/holidays/api/holidays-api';
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
import { LinearGradient } from '@/lib/linear-gradient';
import { useToast } from '@/lib/toast-context';
import type { SharedStackNavigation } from '@/navigation/types';
import { isAdminRole } from '@/utils/role-utils';

import { getCategoryConfig, formatCategory } from './_constants';
import { styles } from './_styles';
import { PreferenceItem } from './PreferenceItems';
import { SingleSelectModal, MultiSelectModal } from './PreferenceModals';
import { WorkingDayPolicyCard } from './WorkingDayPolicyCard';

const adminGradient = getRoleGradient('admin');

function PreferenceGroupContent({
  preferences,
  canManage,
  updateMutation,
  tooltipPref,
  setTooltipPref,
  handleUpdate,
  handleReset,
  editingTextPref,
  editTextValue,
  setEditingTextPref,
  setEditTextValue,
  setDropdownPref,
  setMultiSelectPref,
  setMultiSelectValues,
}: {
  preferences: OrganizationPreference[];
  canManage: boolean;
  updateMutation: ReturnType<typeof useUpdatePreference>;
  tooltipPref: string | null;
  setTooltipPref: (v: string | null) => void;
  handleUpdate: (publicId: string, value: string | string[]) => void;
  handleReset: (pref: OrganizationPreference) => void;
  editingTextPref: string | null;
  editTextValue: string;
  setEditingTextPref: (v: string | null) => void;
  setEditTextValue: (v: string) => void;
  setDropdownPref: (v: OrganizationPreference | null) => void;
  setMultiSelectPref: (v: OrganizationPreference | null) => void;
  setMultiSelectValues: (v: string[]) => void;
}) {
  const childrenByParentKey: Record<string, typeof preferences> = {};
  for (const pref of preferences) {
    if (pref.depends_on) {
      if (!childrenByParentKey[pref.depends_on]) {
        childrenByParentKey[pref.depends_on] = [];
      }
      childrenByParentKey[pref.depends_on].push(pref);
    }
  }

  const topLevelPrefs = preferences.filter(p => !p.depends_on);

  let itemIdx = 0;
  return topLevelPrefs.map(pref => {
    const children = childrenByParentKey[pref.key] || [];
    const parentValue = Array.isArray(pref.value)
      ? pref.value[0]
      : (pref.value as string);
    const isParentEnabled = parentValue === 'TRUE';
    const currentIdx = itemIdx++;
    const childrenBorderColor = isParentEnabled ? '#bfdbfe' : '#e5e7eb';
    const childrenOpacity = isParentEnabled ? 1 : 0.4;

    return (
      <View key={pref.public_id}>
        {currentIdx > 0 && <View style={styles.divider} />}
        <PreferenceItem
          pref={pref}
          canManage={canManage}
          isPending={updateMutation.isPending}
          tooltipPref={tooltipPref}
          setTooltipPref={setTooltipPref}
          onUpdate={handleUpdate}
          onReset={handleReset}
          editingTextPref={editingTextPref}
          editTextValue={editTextValue}
          setEditingTextPref={setEditingTextPref}
          setEditTextValue={setEditTextValue}
          setDropdownPref={setDropdownPref}
          setMultiSelectPref={setMultiSelectPref}
          setMultiSelectValues={setMultiSelectValues}
        />
        {children.length > 0 && (
          <View
            style={[
              styles.childrenWrap,
              {
                borderLeftColor: childrenBorderColor,
                opacity: childrenOpacity,
              },
            ]}
            pointerEvents={isParentEnabled ? 'auto' : 'none'}
          >
            {children.map(child => (
              <View key={child.public_id}>
                <View style={styles.divider} />
                <PreferenceItem
                  pref={child}
                  canManage={canManage && isParentEnabled}
                  isPending={updateMutation.isPending}
                  tooltipPref={tooltipPref}
                  setTooltipPref={setTooltipPref}
                  onUpdate={handleUpdate}
                  onReset={handleReset}
                  editingTextPref={editingTextPref}
                  editTextValue={editTextValue}
                  setEditingTextPref={setEditingTextPref}
                  setEditTextValue={setEditTextValue}
                  setDropdownPref={setDropdownPref}
                  setMultiSelectPref={setMultiSelectPref}
                  setMultiSelectValues={setMultiSelectValues}
                />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  });
}

/** Build WDP create payload - extracted to reduce component complexity */
function buildWdpCreatePayload(
  field: string,
  value: boolean | SaturdayOffPattern,
) {
  const today = new Date().toISOString().split('T')[0];
  return {
    sunday_off: field === 'sunday_off' ? (value as boolean) : true,
    saturday_off_pattern:
      field === 'saturday_off_pattern'
        ? (value as SaturdayOffPattern)
        : ('SECOND_AND_FOURTH' as SaturdayOffPattern),
    effective_from: field === 'effective_from' ? (value as string) : today,
  };
}

/** Handle WDP update/create - extracted to reduce component complexity */
async function performWdpUpdate(
  currentPolicy: WorkingDayPolicy | null,
  field: string,
  value: boolean | SaturdayOffPattern,
  updateWdpMutation: ReturnType<typeof useUpdateWorkingDayPolicy>,
  createWdpMutation: ReturnType<typeof useCreateWorkingDayPolicy>,
  showToast: ReturnType<typeof useToast>['showToast'],
) {
  try {
    if (currentPolicy) {
      await updateWdpMutation.mutateAsync({
        id: currentPolicy.public_id,
        data: { [field]: value },
      });
    } else {
      await createWdpMutation.mutateAsync(buildWdpCreatePayload(field, value));
    }
  } catch (e: unknown) {
    showToast({
      type: 'error',
      title: 'Error',
      message: extractApiError(e, 'Failed to update working day policy'),
    });
  }
}

export default function OrgPreferencesScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [tooltipPref, setTooltipPref] = useState<string | null>(null);
  const [dropdownPref, setDropdownPref] =
    useState<OrganizationPreference | null>(null);
  const [multiSelectPref, setMultiSelectPref] =
    useState<OrganizationPreference | null>(null);
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const [editingTextPref, setEditingTextPref] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState('');
  const [changedValues, setChangedValues] = useState<
    Record<string, string | string[]>
  >({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  const { user } = useAuthStore();
  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const { data, isLoading, refetch } = useGroupedPreferences();
  const updateMutation = useUpdatePreference();
  const resetMutation = useResetPreference();

  // Working Day Policy
  const { data: wdpData, refetch: refetchWdp } = useWorkingDayPolicy();
  const createWdpMutation = useCreateWorkingDayPolicy();
  const updateWdpMutation = useUpdateWorkingDayPolicy();
  const currentPolicy = wdpData?.data?.[0] ?? null;
  const groups: GroupedPreference[] = data?.data ?? [];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([refetch(), refetchWdp()]).finally(() =>
      setRefreshing(false),
    );
  }, [refetch, refetchWdp]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      const action = next.has(category) ? 'delete' : 'add';
      next[action](category);
      return next;
    });
  };

  const handleUpdate = (publicId: string, value: string | string[]) => {
    // Stage the change locally; it persists only when the user taps Save.
    setChangedValues(prev => ({ ...prev, [publicId]: value }));
  };

  const handleSaveCategory = async (
    category: string,
    prefs: OrganizationPreference[],
  ) => {
    const changed = prefs.filter(p => p.public_id in changedValues);
    if (changed.length === 0) return;
    setSavingCategory(category);
    try {
      await Promise.all(
        changed.map(p =>
          updateMutation.mutateAsync({
            publicId: p.public_id,
            value: changedValues[p.public_id],
          }),
        ),
      );
      const savedIds = new Set(changed.map(p => p.public_id));
      setChangedValues(prev =>
        Object.fromEntries(
          Object.entries(prev).filter(([k]) => !savedIds.has(k)),
        ),
      );
      showToast({
        type: 'success',
        title: 'Saved',
        message: 'Settings updated successfully',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: extractApiError(err, 'Failed to update settings'),
      });
    } finally {
      setSavingCategory(null);
    }
  };

  const handleCancelCategory = (prefs: OrganizationPreference[]) => {
    const ids = new Set(prefs.map(p => p.public_id));
    setChangedValues(prev =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !ids.has(k))),
    );
  };

  const handleReset = (pref: OrganizationPreference) => {
    Alert.alert(
      'Reset to Default',
      `Reset "${pref.display_name}" to its default value?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetMutation.mutate(pref.public_id);
            setChangedValues(prev =>
              Object.fromEntries(
                Object.entries(prev).filter(([k]) => k !== pref.public_id),
              ),
            );
          },
        },
      ],
    );
  };

  const handleWdpUpdate = (
    field: string,
    value: boolean | SaturdayOffPattern,
  ) =>
    performWdpUpdate(
      currentPolicy,
      field,
      value,
      updateWdpMutation,
      createWdpMutation,
      showToast,
    );

  return (
    <View style={styles.container}>
      <LinearGradient colors={adminGradient} style={styles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={styles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={styles.circle2} />
        <View style={styles.headerContent}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>
                {groups.length + 1} categories
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <View style={styles.flex1}>
          {!canManage && (
            <View style={styles.readOnlyBanner}>
              <Eye size={16} color="#7c3aed" />
              <Text style={styles.readOnlyText}>
                View only — Contact admin to modify settings
              </Text>
            </View>
          )}
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
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
                    <View
                      style={[
                        styles.catIconCircle,
                        { backgroundColor: catConfig.bg },
                      ]}
                    >
                      <CatIcon size={18} color={catConfig.color} />
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catTitle}>
                        {formatCategory(group.category)}
                      </Text>
                      <Text style={styles.catCount}>
                        {group.count} settings
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={Colors.gray[400]} />
                    ) : (
                      <ChevronDown size={20} color={Colors.gray[400]} />
                    )}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.prefList}>
                      <PreferenceGroupContent
                        preferences={group.preferences.map(p =>
                          p.public_id in changedValues
                            ? { ...p, value: changedValues[p.public_id] }
                            : p,
                        )}
                        canManage={canManage}
                        updateMutation={updateMutation}
                        tooltipPref={tooltipPref}
                        setTooltipPref={setTooltipPref}
                        handleUpdate={handleUpdate}
                        handleReset={handleReset}
                        editingTextPref={editingTextPref}
                        editTextValue={editTextValue}
                        setEditingTextPref={setEditingTextPref}
                        setEditTextValue={setEditTextValue}
                        setDropdownPref={setDropdownPref}
                        setMultiSelectPref={setMultiSelectPref}
                        setMultiSelectValues={setMultiSelectValues}
                      />
                      {canManage &&
                        group.preferences.some(
                          p => p.public_id in changedValues,
                        ) && (
                          <View style={styles.categorySaveBar}>
                            <TouchableOpacity
                              style={styles.catCancelBtn}
                              onPress={() =>
                                handleCancelCategory(group.preferences)
                              }
                              disabled={savingCategory === group.category}
                            >
                              <Text style={styles.catCancelBtnText}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.catSaveBtn,
                                savingCategory === group.category &&
                                  styles.catSaveBtnDisabled,
                              ]}
                              onPress={() =>
                                void handleSaveCategory(
                                  group.category,
                                  group.preferences,
                                )
                              }
                              disabled={savingCategory === group.category}
                            >
                              {savingCategory === group.category ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.catSaveBtnText}>
                                  Save Changes
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  )}
                </Animated.View>
              );
            })}

            <WorkingDayPolicyCard
              currentPolicy={currentPolicy}
              canManage={canManage}
              isPending={
                updateWdpMutation.isPending || createWdpMutation.isPending
              }
              onUpdate={handleWdpUpdate}
              animationDelay={groups.length * 80}
            />

            {groups.length === 0 && (
              <View style={styles.emptyContainer}>
                <Settings size={48} color={Colors.gray[300]} />
                <Text style={styles.emptyText}>No preferences configured</Text>
              </View>
            )}

            <View style={styles.bottomSpacer} />
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
    </View>
  );
}
