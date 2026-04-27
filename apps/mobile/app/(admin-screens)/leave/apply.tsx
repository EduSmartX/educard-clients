/**
 * Leave Apply Screen
 * Employee applies for leave by selecting a balance, dates, and reason.
 */

import { Colors, getRoleGradient, extractApiError } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Send, Calendar, FileText } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {
  FormInput,
  FormSection,
  FormError,
  FormDropdown,
  FormDatePicker,
} from '@/components/forms';
import {
  useMyLeaveBalances,
  useCreateLeaveRequest,
  useCalculateWorkingDays,
} from '@/features/leave';
import { headerStyles, layoutStyles, buttonStyles } from '@/styles';
import { addDateRangeError } from '@/utils/validation';

const empGradient = getRoleGradient('employee');
type FieldErrors = Record<string, string>;

export default function LeaveApplyScreen() {
  const router = useRouter();
  const { data: balancesData, isLoading: balancesLoading } = useMyLeaveBalances();
  const createMutation = useCreateLeaveRequest();
  const calcDaysMutation = useCalculateWorkingDays();

  const [form, setForm] = useState({
    leave_balance: '',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [calculatedDays, setCalculatedDays] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const balanceOptions = useMemo(
    () =>
      (balancesData?.data || []).map((b) => ({
        value: b.public_id,
        label: `${b.leave_name} (${b.available} days available)`,
      })),
    [balancesData]
  );

  const selectedBalance = useMemo(
    () => (balancesData?.data || []).find((b) => b.public_id === form.leave_balance),
    [balancesData, form.leave_balance]
  );

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Auto-calculate working days when both dates are set
        if ((field === 'start_date' || field === 'end_date') && next.start_date && next.end_date) {
          calcDaysMutation.mutate(
            { startDate: next.start_date, endDate: next.end_date },
            {
              onSuccess: (res) => setCalculatedDays(res.working_days),
              onError: () => setCalculatedDays(null),
            }
          );
        }
        return next;
      });
      if (errors[field])
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
    },
    [errors, calcDaysMutation]
  );

  const validate = useCallback(() => {
    const errs: FieldErrors = {};
    if (!form.leave_balance) errs.leave_balance = 'Select a leave type';
    if (!form.start_date) errs.start_date = 'Start date is required';
    if (!form.end_date) errs.end_date = 'End date is required';
    addDateRangeError(errs, form.start_date, form.end_date, 'end_date', 'Start date', 'End date');
    if (!form.reason.trim()) errs.reason = 'Reason is required';
    if (selectedBalance && calculatedDays && calculatedDays > selectedBalance.available)
      errs.leave_balance = `Only ${selectedBalance.available} days available`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form, selectedBalance, calculatedDays]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    setApiError(null);

    createMutation.mutate(
      {
        leave_balance: form.leave_balance,
        start_date: form.start_date,
        end_date: form.end_date,
        number_of_days: calculatedDays || 1,
        reason: form.reason.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Leave request submitted successfully.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (err: any) => {
          setApiError(extractApiError(err, 'Failed to submit leave request'));
        },
      }
    );
  }, [form, calculatedDays, validate, createMutation, router]);

  const isSaving = createMutation.isPending;

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={empGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Apply for Leave</Text>
              <Text style={headerStyles.subtitle}>Submit a new request</Text>
            </View>
            <TouchableOpacity
              style={[headerStyles.primaryBtn, isSaving && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#7c3aed" />
              ) : (
                <Send size={20} color="#7c3aed" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

          <View>
            <FormSection title="Leave Type" icon="📋">
              <FormDropdown
                label="Leave Balance"
                required
                options={balanceOptions}
                value={form.leave_balance}
                onChange={(v) => updateField('leave_balance', v)}
                error={errors.leave_balance}
                placeholder="Select leave type"
                searchable
                loading={balancesLoading}
              />
              {selectedBalance && (
                <View style={styles.balanceCard}>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Total</Text>
                    <Text style={styles.balanceValue}>{selectedBalance.total_allocated}</Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Used</Text>
                    <Text style={[styles.balanceValue, { color: '#dc2626' }]}>
                      {selectedBalance.used}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Pending</Text>
                    <Text style={[styles.balanceValue, { color: '#f59e0b' }]}>
                      {selectedBalance.pending}
                    </Text>
                  </View>
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Available</Text>
                    <Text style={[styles.balanceValue, { color: '#059669' }]}>
                      {selectedBalance.available}
                    </Text>
                  </View>
                </View>
              )}
            </FormSection>
          </View>

          <View>
            <FormSection title="Dates" icon="📅">
              <FormDatePicker
                label="Start Date"
                required
                value={form.start_date}
                onChange={(v) => updateField('start_date', v)}
                error={errors.start_date}
                placeholder="Select start date"
              />
              <FormDatePicker
                label="End Date"
                required
                value={form.end_date}
                onChange={(v) => updateField('end_date', v)}
                error={errors.end_date}
                placeholder="Select end date"
              />
              {calculatedDays !== null && (
                <View style={styles.daysChip}>
                  <Calendar size={14} color="#6366f1" />
                  <Text style={styles.daysChipText}>
                    {calculatedDays} working day{calculatedDays !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </FormSection>
          </View>

          <View>
            <FormSection title="Details" icon="📝">
              <FormInput
                label="Reason"
                required
                value={form.reason}
                onChangeText={(v) => updateField('reason', v)}
                error={errors.reason}
                placeholder="Enter reason for leave"
                multiline
                numberOfLines={4}
              />
            </FormSection>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40, gap: 8 },
  balanceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceRow: { alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  balanceValue: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  daysChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  daysChipText: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
});
