import { Plus, Send } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  type DimensionValue,
} from 'react-native';

import { getErrorMessage } from '@/api/client';
import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { FormDropdown, FormDatePicker } from '@/components/forms';
import { colors } from '@/constants/colors';
import {
  useStudentLeaveBalance,
  useStudentLeaveRequests,
  useApplyStudentLeave,
  type StudentLeaveRequest,
} from '@/features/student-leave';
import { useToast } from '@/lib/toast-context';

const STATUS_STYLES: Record<
  string,
  { badge: string; text: string; emoji: string }
> = {
  pending: {
    badge: 'bg-warning-100',
    text: 'text-warning-700',
    emoji: '\u23f3',
  },
  approved: {
    badge: 'bg-success-100',
    text: 'text-success-700',
    emoji: '\u2705',
  },
  rejected: {
    badge: 'bg-danger-100',
    text: 'text-danger-700',
    emoji: '\u274c',
  },
  cancelled: {
    badge: 'bg-gray-100',
    text: 'text-gray-600',
    emoji: '\ud83d\udeab',
  },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function computeDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export default function StudentLeaveScreen() {
  const { showToast } = useToast();
  const { data: balance, isLoading: balanceLoading } = useStudentLeaveBalance();
  const { data: requests, isLoading: requestsLoading } =
    useStudentLeaveRequests();
  const applyLeave = useApplyStudentLeave();

  const [showForm, setShowForm] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const days = computeDays(startDate, endDate);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setSelectedBalance('');
    setStartDate('');
    setEndDate('');
    setReason('');
  }, []);

  const handleApply = useCallback(() => {
    if (
      !selectedBalance ||
      !startDate ||
      !endDate ||
      days <= 0 ||
      !reason.trim()
    ) {
      showToast({ type: 'error', title: 'Please fill all fields' });
      return;
    }
    applyLeave.mutate(
      {
        leave_balance: selectedBalance,
        start_date: startDate,
        end_date: endDate,
        number_of_days: days,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Leave request submitted for approval',
          });
          resetForm();
        },
        onError: err => {
          showToast({
            type: 'error',
            title: 'Failed to submit leave request',
            message: getErrorMessage(err, ''),
          });
        },
      },
    );
  }, [
    selectedBalance,
    startDate,
    endDate,
    days,
    reason,
    applyLeave,
    showToast,
    resetForm,
  ]);

  const hasBalance = !!balance && balance.length > 0;
  const leaveOptions = (balance ?? []).map(b => ({
    value: b.public_id,
    label: `${b.leave_name} (${Number(b.available)} available)`,
  }));

  return (
    <Screen safeArea={false} statusBarStyle="light">
      <ScreenHeader title="Leave" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Balance cards */}
        {balanceLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : !hasBalance ? (
          <View className="items-center rounded-2xl border border-dashed border-gray-300 py-8">
            <Text className="text-3xl">{'\ud83c\udf31'}</Text>
            <Text className="mt-2 text-sm text-gray-500">
              No leave allocation found
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {balance.map(b => {
              const total = Number(b.total_allocated);
              const pct = total > 0 ? (Number(b.available) / total) * 100 : 0;
              const fillWidth: DimensionValue = `${pct}%`;
              return (
                <View
                  key={b.public_id}
                  className="rounded-2xl border border-gray-100 bg-white p-4"
                >
                  <Text className="text-xs font-medium text-gray-500">
                    {b.leave_name}
                  </Text>
                  <View className="mt-2 flex-row items-end justify-between">
                    <Text className="text-2xl font-bold text-gray-800">
                      {Number(b.available)}
                    </Text>
                    <Text className="text-xs text-gray-400">
                      / {total} days
                    </Text>
                  </View>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <View style={[styles.progressFill, { width: fillWidth }]} />
                  </View>
                  {Number(b.pending) > 0 && (
                    <Text className="mt-1 text-[10px] text-warning-500">
                      {Number(b.pending)} pending
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Apply Leave toggle */}
        {hasBalance && !showForm && (
          <TouchableOpacity
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-primary-600 py-3"
            onPress={() => setShowForm(true)}
          >
            <Plus size={18} color="#ffffff" />
            <Text className="text-base font-semibold text-white">
              Apply Leave
            </Text>
          </TouchableOpacity>
        )}

        {/* Apply Leave form */}
        {showForm && hasBalance && (
          <View className="mt-4 rounded-2xl border border-primary-200 bg-primary-50 p-4">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              Apply for Leave
            </Text>

            <FormDropdown
              label="Leave Type"
              placeholder="Select leave type"
              options={leaveOptions}
              value={selectedBalance}
              onChange={setSelectedBalance}
              required
            />

            <FormDatePicker
              label="Start Date"
              placeholder="Select start date"
              value={startDate}
              onChange={d => {
                setStartDate(d);
                if (endDate && endDate < d) setEndDate('');
              }}
              required
            />

            <FormDatePicker
              label="End Date"
              placeholder="Select end date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate || undefined}
              required
            />

            {days > 0 && (
              <Text className="mb-2 text-xs text-gray-500">
                Duration:{' '}
                <Text className="font-bold text-gray-700">
                  {days} day{days !== 1 ? 's' : ''}
                </Text>
              </Text>
            )}

            <Text className="mb-1 text-xs font-medium text-gray-600">
              Reason
            </Text>
            <TextInput
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              placeholder="Why are you applying for leave?"
              placeholderTextColor={colors.gray[400]}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View className="mt-4 flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-primary-600 py-3"
                disabled={applyLeave.isPending}
                onPress={handleApply}
                style={applyLeave.isPending ? styles.dimmed : undefined}
              >
                <Send size={16} color="#ffffff" />
                <Text className="font-semibold text-white">
                  {applyLeave.isPending ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-xl border border-gray-300 px-4 py-3"
                onPress={resetForm}
              >
                <Text className="font-medium text-gray-600">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Leave requests */}
        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">
            {'\ud83d\udccb'} Leave Requests
          </Text>
          {requestsLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : !requests || requests.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-4xl">{'\ud83c\udf08'}</Text>
              <Text className="mt-2 text-sm text-gray-500">
                No leave requests yet
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {requests.map((req: StudentLeaveRequest) => {
                const style =
                  STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
                return (
                  <View
                    key={req.public_id}
                    className="flex-row items-start gap-3 rounded-xl border border-gray-100 bg-white p-3"
                  >
                    <Text className="text-xl">{style.emoji}</Text>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 text-sm font-medium text-gray-800">
                          {req.leave_name}
                        </Text>
                        <View
                          className={`rounded-full px-2 py-0.5 ${style.badge}`}
                        >
                          <Text
                            className={`text-xs font-medium capitalize ${style.text}`}
                          >
                            {req.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="mt-0.5 text-xs text-gray-500">
                        {formatDate(req.start_date)} {'\u2014'}{' '}
                        {formatDate(req.end_date)} ({req.number_of_days} day
                        {req.number_of_days !== 1 ? 's' : ''})
                      </Text>
                      {!!req.reason && (
                        <Text className="mt-1 text-xs italic text-gray-400">
                          {req.reason}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.info[500],
  },
  dimmed: {
    opacity: 0.6,
  },
});
