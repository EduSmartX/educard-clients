/**
 * Apply Leave Screen - Submit leave requests
 */

import {
  getRoleGradient,
  getRoleThemeColors,
  extractApiError,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { parseISO, isAfter, format } from 'date-fns';
import { ChevronLeft, Send, Info } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SubmitButton } from '@/components/common';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import { SearchableSelect } from '@/components/ui';
import {
  useMyLeaveBalances,
  useCreateLeaveRequest,
  useCalculateWorkingDays,
  type WorkingDaysCalculation,
} from '@/features/leave';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './apply-leave-styles';
import { LeaveDaysCalendar } from './LeaveDaysCalendar';

// Use teacher/employee theme for consistency
const employeeTheme = getRoleThemeColors('employee');
const employeeGradient = getRoleGradient('employee');
type FieldErrors = Record<string, string>;

interface LeaveAllocationSimple {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  display_name: string;
  total_days: string;
}

interface LeaveBalance {
  public_id: string;
  leave_allocation: LeaveAllocationSimple;
  leave_name: string;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
}

export default function ApplyLeaveScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { data: balancesData, isLoading: balancesLoading } =
    useMyLeaveBalances();
  const createMutation = useCreateLeaveRequest();
  const calculateMutation = useCalculateWorkingDays();

  const [form, setForm] = useState({
    leave_balance: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
  const [workingDaysInfo, setWorkingDaysInfo] =
    useState<WorkingDaysCalculation | null>(null);
  const [conflictingLeaves, setConflictingLeaves] = useState<string[]>([]);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Theme accent color for consistent styling
  const accentColor = employeeTheme.accent;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const getLeaveTypeName = (balance: LeaveBalance): string => {
    return (
      balance.leave_name ||
      balance.leave_allocation?.display_name ||
      balance.leave_allocation?.leave_type_name ||
      'Unknown'
    );
  };

  const getLeaveTypeCode = (balance: LeaveBalance): string => {
    return (
      balance.leave_allocation?.leave_type_code ||
      balance.leave_allocation?.leave_type_name ||
      'N/A'
    );
  };

  const balances: LeaveBalance[] = useMemo(() => {
    if (!balancesData?.data) return [];
    return Array.isArray(balancesData.data) ? balancesData.data : [];
  }, [balancesData]);

  const leaveTypeOptions = useMemo(() => {
    return balances
      .filter(b => b.available > 0)
      .map((b, index) => ({
        value: b.public_id || `balance-${index}`,
        label: `${getLeaveTypeName(b)} (${b.available} days available)`,
        name: getLeaveTypeName(b),
        code: getLeaveTypeCode(b),
        available: b.available,
      }));
  }, [balances]);

  // Selected leave balance details
  const selectedBalance = useMemo(() => {
    return balances.find(b => b.public_id === form.leave_balance);
  }, [balances, form.leave_balance]);

  // Calculate working days when dates change (backend is the source of truth)
  useEffect(() => {
    if (form.start_date && form.end_date) {
      const startDate = parseISO(form.start_date);
      const endDate = parseISO(form.end_date);

      if (isAfter(startDate, endDate)) {
        setCalculatedDays(null);
        setWorkingDaysInfo(null);
        setConflictingLeaves([]);
        setCalcError(null);
        return;
      }

      calculateMutation.mutate(
        { startDate: form.start_date, endDate: form.end_date },
        {
          onSuccess: data => {
            const calc = data?.data ?? null;
            setWorkingDaysInfo(calc);
            setCalculatedDays(calc?.working_days ?? calc?.leave_days ?? 0);
            setConflictingLeaves([]);
            setCalcError(null);
          },
          onError: (err: unknown) => {
            setWorkingDaysInfo(null);
            setCalculatedDays(null);
            const conflicts = (
              err as {
                response?: {
                  data?: { data?: { conflicting_leaves?: string[] } };
                };
              }
            )?.response?.data?.data?.conflicting_leaves;
            if (conflicts && conflicts.length > 0) {
              setConflictingLeaves(conflicts);
              setCalcError(null);
              return;
            }
            setConflictingLeaves([]);
            setCalcError(
              extractApiError(
                err,
                "Couldn't calculate working days. Please try again.",
              ),
            );
          },
        },
      );
    } else {
      setCalculatedDays(null);
      setWorkingDaysInfo(null);
      setConflictingLeaves([]);
      setCalcError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.start_date, form.end_date]);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
      setApiError(null);
    },
    [errors],
  );

  const validate = useCallback(() => {
    const errs: FieldErrors = {};

    if (!form.leave_balance) {
      errs.leave_balance = 'Please select a leave type';
    }

    if (!form.start_date) {
      errs.start_date = 'Start date is required';
    }

    if (!form.end_date) {
      errs.end_date = 'End date is required';
    }

    if (form.start_date && form.end_date) {
      const startDate = parseISO(form.start_date);
      const endDate = parseISO(form.end_date);

      if (isAfter(startDate, endDate)) {
        errs.end_date = 'End date must be after start date';
      }
    }

    if (!form.reason || form.reason.trim().length < 5) {
      errs.reason = 'Please provide a reason (at least 5 characters)';
    }

    if (
      selectedBalance &&
      calculatedDays &&
      calculatedDays > selectedBalance.available
    ) {
      errs.leave_balance = `You only have ${selectedBalance.available} days available`;
    }

    if (conflictingLeaves.length > 0) {
      errs.end_date =
        'You already have a leave request that overlaps these dates';
    }

    if (form.start_date && form.end_date && calculatedDays === 0) {
      errs.end_date =
        'Selected dates are all holidays or weekends. Please choose working days to apply leave.';
    }

    if (
      form.start_date &&
      form.end_date &&
      !errs.end_date &&
      calculatedDays === null
    ) {
      errs.end_date =
        calcError ?? 'Please wait for the working days to be calculated';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, selectedBalance, calculatedDays, conflictingLeaves, calcError]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload = {
      leave_balance: form.leave_balance,
      start_date: form.start_date,
      end_date: form.end_date,
      number_of_days: calculatedDays ?? 0,
      reason: form.reason.trim(),
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        navigation.goBack();
      },
      onError: (err: unknown) => {
        setApiError(extractApiError(err, 'Failed to submit leave request'));
      },
    });
  }, [form, validate, createMutation, navigation, calculatedDays]);

  const isSaving = createMutation.isPending;

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={employeeGradient} style={headerStyles.header}>
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
              <Text style={headerStyles.title}>Apply for Leave</Text>
              <Text style={headerStyles.subtitle}>
                Submit your leave request
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        {balancesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={styles.loadingText}>Loading leave balances...</Text>
          </View>
        ) : (
          <View>
            {apiError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{apiError}</Text>
              </View>
            )}

            {/* Leave Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LEAVE TYPE</Text>
              <SearchableSelect
                title="Select Leave Type"
                value={form.leave_balance}
                onValueChange={value => updateField('leave_balance', value)}
                options={leaveTypeOptions}
                placeholder="Select Leave Type"
                searchPlaceholder="Search leave types..."
                emptyText="No leave types available — you may have no balance or have used all your days"
              />
              {errors.leave_balance && (
                <Text style={styles.errorText}>{errors.leave_balance}</Text>
              )}

              {selectedBalance && (
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Available Balance:</Text>
                  <Text style={[styles.balanceValue, { color: accentColor }]}>
                    {selectedBalance.available} /{' '}
                    {selectedBalance.total_allocated} days
                  </Text>
                </View>
              )}
            </View>

            {/* Date Selection - Using reusable FormDatePicker */}
            <View style={styles.section}>
              <View style={styles.dateRow}>
                <View key="start-date-field" style={styles.dateField}>
                  <FormDatePicker
                    label="START DATE"
                    value={form.start_date}
                    onChange={date => {
                      updateField('start_date', date);
                      // Auto-set end date if not set
                      if (!form.end_date && date) {
                        updateField('end_date', date);
                      }
                    }}
                    error={errors.start_date}
                    placeholder="Select"
                    minYear={new Date().getFullYear()}
                    required
                  />
                </View>

                <View key="end-date-field" style={styles.dateField}>
                  <FormDatePicker
                    label="END DATE"
                    value={form.end_date}
                    onChange={date => updateField('end_date', date)}
                    error={errors.end_date}
                    placeholder="Select"
                    minYear={new Date().getFullYear()}
                    required
                  />
                </View>
              </View>

              {calculateMutation.isPending && (
                <View style={styles.calcStatusRow}>
                  <ActivityIndicator size="small" color={accentColor} />
                  <Text style={styles.calcStatusText}>
                    Calculating working days…
                  </Text>
                </View>
              )}
            </View>

            {/* Could not calculate working days */}
            {calcError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{calcError}</Text>
              </View>
            )}

            {/* Overlapping leave conflict */}
            {conflictingLeaves.length > 0 && (
              <View style={styles.conflictBanner}>
                <Text style={styles.conflictTitle}>
                  Overlapping leave request
                </Text>
                <Text style={styles.conflictText}>
                  You already have a pending or approved leave overlapping these
                  dates:
                </Text>
                {conflictingLeaves.map(leave => (
                  <Text key={leave} style={styles.conflictItem}>
                    • {leave}
                  </Text>
                ))}
              </View>
            )}

            {/* Leave days breakdown + holidays */}
            {workingDaysInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>LEAVE DAYS</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Days</Text>
                  <Text style={styles.summaryValue}>
                    {workingDaysInfo.total_days}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Weekends + Holidays</Text>
                  <Text style={styles.summaryValue}>
                    {workingDaysInfo.holidays.length}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Leave Days</Text>
                  <Text
                    style={[
                      styles.summaryTotalValue,
                      calculatedDays === 0 && styles.summaryTotalValueZero,
                    ]}
                  >
                    {workingDaysInfo.working_days}
                  </Text>
                </View>

                {form.start_date && form.end_date && (
                  <View style={styles.calendarWrap}>
                    <LeaveDaysCalendar
                      startDate={form.start_date}
                      endDate={form.end_date}
                      holidays={workingDaysInfo.holidays}
                      accentColor={accentColor}
                    />
                  </View>
                )}

                {calculatedDays === 0 && (
                  <View style={styles.holidayBlock}>
                    <Info size={16} color="#b91c1c" />
                    <Text style={styles.holidayBlockText}>
                      All selected dates are holidays or weekends. You cannot
                      apply leave for non-working days.
                    </Text>
                  </View>
                )}

                {workingDaysInfo.holidays.length > 0 && (
                  <View style={styles.holidayList}>
                    <Text style={styles.holidayListTitle}>
                      Holidays & Non-Working Days
                    </Text>
                    {workingDaysInfo.holidays.map(holiday => {
                      const isWeekend =
                        holiday.type?.toUpperCase() === 'WEEKEND';
                      return (
                        <View key={holiday.date} style={styles.holidayItem}>
                          <Text style={styles.holidayDate}>
                            {format(parseISO(holiday.date), 'dd MMM')}
                          </Text>
                          <Text style={styles.holidayDesc} numberOfLines={1}>
                            {holiday.description || holiday.name || '—'}
                          </Text>
                          <View
                            style={[
                              styles.holidayTypeBadge,
                              isWeekend
                                ? styles.holidayTypeWeekend
                                : styles.holidayTypeOther,
                            ]}
                          >
                            <Text
                              style={[
                                styles.holidayTypeText,
                                isWeekend
                                  ? styles.holidayTypeTextWeekend
                                  : styles.holidayTypeTextOther,
                              ]}
                            >
                              {holiday.type}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>REASON</Text>
              <TextInput
                style={[styles.textArea, errors.reason && styles.fieldError]}
                value={form.reason}
                onChangeText={text => updateField('reason', text)}
                placeholder="Enter reason for leave..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.reason && (
                <Text style={styles.errorText}>{errors.reason}</Text>
              )}
            </View>

            {/* Submit Button - Using reusable SubmitButton component */}
            <SubmitButton
              label="Submit Request"
              onPress={handleSubmit}
              isLoading={isSaving}
              icon={Send}
              color={accentColor}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}
