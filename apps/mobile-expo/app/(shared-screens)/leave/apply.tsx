/**
 * Apply Leave Screen - Submit leave requests
 */

import { getRoleGradient, getRoleThemeColors, extractApiError } from '@educard/shared';
import { parseISO, differenceInDays, isAfter } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Calendar, ChevronDown, X, Check, Info } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
import { headerStyles, layoutStyles } from '@/styles';

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                      <Text style={[styles.optionLabel, isSelected && { color: accentColor }]}>
                        {option.name}
                      </Text>
                      <Text style={styles.optionSubtext}>{option.available} days available</Text>
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
  const router = useRouter();
  const { data: balancesData, isLoading: balancesLoading } = useMyLeaveBalances();
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
      .filter((b) => b.available > 0)
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
    return balances.find((b) => b.public_id === form.leave_balance);
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
          onSuccess: (data) => {
            setCalculatedDays(data?.data?.working_days ?? 1);
          },
          onError: () => {
            // Fallback to simple calculation
            const days = differenceInDays(endDate, startDate) + 1;
            setCalculatedDays(days > 0 ? days : 1);
          },
        }
      );
    } else {
      setCalculatedDays(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.start_date, form.end_date]);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
      setApiError(null);
    },
    [errors]
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

    if (selectedBalance && calculatedDays && calculatedDays > selectedBalance.available) {
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
        router.back();
      },
      onError: (err: unknown) => {
        setApiError(extractApiError(err, 'Failed to submit leave request'));
      },
    });
  }, [form, validate, createMutation, router, calculatedDays]);

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Apply for Leave</Text>
              <Text style={headerStyles.subtitle}>Submit your leave request</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={[styles.formScroll, { flex: 1 }]}
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
                style={[styles.selectField, errors.leave_balance && styles.fieldError]}
                onPress={() => setShowLeaveTypePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar size={20} color="#94a3b8" />
                <Text style={[styles.selectText, !form.leave_balance && styles.placeholderText]}>
                  {selectedBalance ? getLeaveTypeName(selectedBalance) : 'Select Leave Type'}
                </Text>
                <ChevronDown size={20} color="#94a3b8" />
              </TouchableOpacity>
              {errors.leave_balance && <Text style={styles.errorText}>{errors.leave_balance}</Text>}

              {selectedBalance && (
                <View style={styles.balanceInfo}>
                  <Text style={styles.balanceLabel}>Available Balance:</Text>
                  <Text style={[styles.balanceValue, { color: accentColor }]}>
                    {selectedBalance.available} / {selectedBalance.total_allocated} days
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
                    onChange={(date) => {
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
                    onChange={(date) => updateField('end_date', date)}
                    error={errors.end_date}
                    placeholder="Select"
                    minYear={new Date().getFullYear()}
                    required
                  />
                </View>
              </View>

              {calculatedDays !== null && (
                <View
                  style={[styles.daysCalculated, { backgroundColor: employeeTheme.accentLight }]}
                >
                  <Text style={[styles.daysLabel, { color: employeeTheme.accentDark }]}>
                    Working Days:
                  </Text>
                  <Text style={[styles.daysValue, { color: employeeTheme.accent }]}>
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
                onChangeText={(text) => updateField('reason', text)}
                placeholder="Enter reason for leave..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
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
        onSelect={(value) => updateField('leave_balance', value)}
        accentColor={accentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorBannerText: {
    color: '#991b1b',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  fieldError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  daysCalculated: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f0fdf4',
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  daysLabel: {
    fontSize: 13,
    color: '#166534',
  },
  daysValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 100,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  optionsList: {
    maxHeight: 350,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  optionItemSelected: {
    backgroundColor: '#f5f3ff',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: '#7c3aed',
  },
  optionSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    margin: 20,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
});
