/**
 * Apply Leave Screen - Submit leave requests
 */

import {
  getRoleGradient,
  getRoleThemeColors,
  extractApiError,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { parseISO, differenceInDays, isAfter } from 'date-fns';
import {
  ChevronLeft,
  Send,
  Calendar,
  ChevronDown,
  X,
  Check,
  Info,
} from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SubmitButton } from '@/components/common';
import { FormDatePicker } from '@/components/forms/FormDatePicker';
import {
  useMyLeaveBalances,
  useCreateLeaveRequest,
  useCalculateWorkingDays,
} from '@/features/leave';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';

import { styles } from './apply-leave-styles';

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

interface LeaveTypeOption {
  value: string;
  label: string;
  name: string;
  code: string;
  available: number;
}

function LeaveTypePickerModal({
  visible,
  onClose,
  options,
  selectedValue,
  onSelect,
  accentColor,
}: {
  visible: boolean;
  onClose: () => void;
  options: LeaveTypeOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  accentColor: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Select Leave Type</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {options.length === 0 ? (
            <View style={styles.emptyState}>
              <Info size={40} color="#9ca3af" />
              <Text style={styles.emptyText}>No leave types available</Text>
              <Text style={styles.emptySubtext}>
                You either have no leave balance or have used all your days
              </Text>
            </View>
          ) : (
            <FlatList
              data={options}
              keyExtractor={(item, index) => item.value || `option-${index}`}
              style={styles.optionsList}
              renderItem={({ item: option }) => {
                const isSelected = option.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected && { backgroundColor: `${accentColor}10` },
                    ]}
                    onPress={() => {
                      onSelect(option.value);
                      onClose();
                    }}
                  >
                    <View style={styles.optionContent}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && { color: accentColor },
                        ]}
                      >
                        {option.name}
                      </Text>
                      <Text style={styles.optionSubtext}>
                        {option.available} days available
                      </Text>
                    </View>
                    {isSelected && <Check size={20} color={accentColor} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
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
  const [showLeaveTypePicker, setShowLeaveTypePicker] = useState(false);

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

  // Calculate working days when dates change
  useEffect(() => {
    if (form.start_date && form.end_date) {
      const startDate = parseISO(form.start_date);
      const endDate = parseISO(form.end_date);

      if (isAfter(startDate, endDate)) {
        setCalculatedDays(null);
        return;
      }

      calculateMutation.mutate(
        { startDate: form.start_date, endDate: form.end_date },
        {
          onSuccess: data => {
            setCalculatedDays(data?.data?.working_days ?? 1);
          },
          onError: () => {
            // Fallback to simple calculation
            const days = differenceInDays(endDate, startDate) + 1;
            setCalculatedDays(days > 0 ? days : 1);
          },
        },
      );
    } else {
      setCalculatedDays(null);
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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, selectedBalance, calculatedDays]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const payload = {
      leave_balance: form.leave_balance,
      start_date: form.start_date,
      end_date: form.end_date,
      number_of_days: calculatedDays ?? 1,
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
              <TouchableOpacity
                style={[
                  styles.selectField,
                  errors.leave_balance && styles.fieldError,
                ]}
                onPress={() => setShowLeaveTypePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={20} color="#94a3b8" />
                <Text
                  style={[
                    styles.selectText,
                    !form.leave_balance && styles.placeholderText,
                  ]}
                >
                  {selectedBalance
                    ? getLeaveTypeName(selectedBalance)
                    : 'Select Leave Type'}
                </Text>
                <ChevronDown size={20} color="#94a3b8" />
              </TouchableOpacity>
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

              {calculatedDays !== null && (
                <View
                  style={[
                    styles.daysCalculated,
                    { backgroundColor: employeeTheme.accentLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.daysLabel,
                      { color: employeeTheme.accentDark },
                    ]}
                  >
                    Working Days:
                  </Text>
                  <Text
                    style={[styles.daysValue, { color: employeeTheme.accent }]}
                  >
                    {calculatedDays} days
                  </Text>
                </View>
              )}
            </View>

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

      {/* Leave Type Picker Modal */}
      <LeaveTypePickerModal
        visible={showLeaveTypePicker}
        onClose={() => setShowLeaveTypePicker(false)}
        options={leaveTypeOptions}
        selectedValue={form.leave_balance}
        onSelect={value => updateField('leave_balance', value)}
        accentColor={accentColor}
      />
    </View>
  );
}
