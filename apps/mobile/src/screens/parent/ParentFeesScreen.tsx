/**
 * Student Fees Screen
 * Fee summary + components (opt-in/opt-out) + payment history
 */

import { format } from 'date-fns';
import { CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';

import {
  DonutChart,
  ChartLegend,
  type ChartSegment,
} from '@/components/charts';
import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { colors } from '@/constants/colors';
import {
  useFeeSummary,
  useFeePayments,
  useFeeComponents,
  useFeeOptIn,
  useFeeOptOut,
  type FeePayment,
  type FeeComponent,
} from '@/features/student-portal';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ParentFeesScreen() {
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useFeeSummary();
  const {
    data: payments,
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useFeePayments();
  const {
    data: components,
    isLoading: componentsLoading,
    refetch: refetchComponents,
  } = useFeeComponents();
  const optIn = useFeeOptIn();
  const optOut = useFeeOptOut();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchPayments(),
      refetchComponents(),
    ]);
    setRefreshing(false);
  }, [refetchSummary, refetchPayments, refetchComponents]);
  const isLoading = summaryLoading || paymentsLoading || componentsLoading;

  const paidPct =
    summary && Number(summary.total_amount) > 0
      ? Math.round(
          (Number(summary.amount_paid) / Number(summary.total_amount)) * 100,
        )
      : 0;
  const feeSegments: ChartSegment[] = summary
    ? [
        { label: 'Paid', value: Number(summary.amount_paid), color: '#10b981' },
        { label: 'Due', value: Number(summary.balance_due), color: '#ef4444' },
      ]
    : [];

  const mandatoryComponents = (components ?? []).filter(
    (c: FeeComponent) => c.component_type === 'mandatory',
  );
  const optionalComponents = (components ?? []).filter(
    (c: FeeComponent) => c.component_type === 'optional',
  );

  return (
    <Screen safeArea={false} statusBarStyle="light">
      <ScreenHeader title="Fees" showBack={false} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        ) : (
          <View className="px-4 pb-6 pt-4">
            {/* Summary Cards */}
            {summary && (
              <>
                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-xl border-l-4 border-l-blue-400 bg-white p-4">
                    <Text className="text-[10px] text-gray-500">Total Fee</Text>
                    <Text className="mt-1 text-xl font-bold text-gray-800">
                      {formatCurrency(Number(summary.total_amount))}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl border-l-4 border-l-emerald-400 bg-white p-4">
                    <Text className="text-[10px] text-gray-500">Paid</Text>
                    <Text className="mt-1 text-xl font-bold text-emerald-600">
                      {formatCurrency(Number(summary.amount_paid))}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl border-l-4 border-l-amber-400 bg-white p-4">
                    <Text className="text-[10px] text-gray-500">Due</Text>
                    <Text className="mt-1 text-xl font-bold text-amber-600">
                      {formatCurrency(Number(summary.balance_due))}
                    </Text>
                  </View>
                </View>

                {/* Fees pie chart — same as dashboard */}
                <View className="mt-4 rounded-2xl bg-white p-4">
                  <Text className="mb-2 text-center text-[13px] font-bold text-gray-700">
                    Fees
                  </Text>
                  {Number(summary.total_amount) > 0 ? (
                    <>
                      <View className="items-center">
                        <DonutChart
                          data={feeSegments}
                          size={128}
                          thickness={16}
                          centerValue={`${paidPct}%`}
                          centerLabel="Paid"
                        />
                      </View>
                      <View className="mt-3">
                        <ChartLegend data={feeSegments} showValues />
                      </View>
                      {summary.due_date && (
                        <Text className="mt-3 text-[10px] text-gray-400">
                          Due:{' '}
                          {format(new Date(summary.due_date), 'd MMM yyyy')}
                        </Text>
                      )}
                      {summary.is_overdue && (
                        <View className="mt-2 self-start rounded-md bg-red-100 px-2 py-0.5">
                          <Text className="text-[10px] font-medium text-red-600">
                            Overdue
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text className="py-4 text-center text-[13px] text-gray-400">
                      No data yet
                    </Text>
                  )}
                </View>
              </>
            )}

            {/* Fee Components */}
            <Text className="mb-3 mt-6 text-sm font-semibold text-gray-600">
              Fee Components
            </Text>
            {components && components.length > 0 ? (
              <>
                {/* Mandatory */}
                {mandatoryComponents.length > 0 && (
                  <>
                    <Text className="mb-2 text-xs font-medium uppercase tracking-wide text-blue-600">
                      Mandatory
                    </Text>
                    {mandatoryComponents.map((c: FeeComponent) => (
                      <View
                        key={c.public_id}
                        className="mb-2 flex-row items-center rounded-xl border border-gray-100 bg-white p-4"
                      >
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-gray-800">
                            {c.name}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-gray-700">
                          {formatCurrency(Number(c.amount))}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Optional */}
                {optionalComponents.length > 0 && (
                  <>
                    <Text className="mb-2 mt-3 text-xs font-medium uppercase tracking-wide text-purple-600">
                      Optional
                    </Text>
                    {optionalComponents.map((c: FeeComponent) => (
                      <View
                        key={c.public_id}
                        className="mb-2 rounded-xl border border-gray-100 bg-white p-4"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-800">
                              {c.name}
                            </Text>
                            <View className="mt-1 flex-row items-center gap-2">
                              <View
                                className={`h-2 w-2 rounded-full ${c.is_selected ? 'bg-emerald-500' : 'bg-gray-300'}`}
                              />
                              <Text
                                className={`text-[10px] ${c.is_selected ? 'text-emerald-600' : 'text-gray-400'}`}
                              >
                                {c.is_selected ? 'Included' : 'Not included'}
                              </Text>
                              {c.approval_status === 'pending' && (
                                <View className="rounded-md bg-amber-100 px-1.5 py-0.5">
                                  <Text className="text-[9px] font-medium text-amber-700">
                                    Pending
                                  </Text>
                                </View>
                              )}
                              {c.approval_status === 'approved' && (
                                <View className="rounded-md bg-emerald-100 px-1.5 py-0.5">
                                  <Text className="text-[9px] font-medium text-emerald-700">
                                    Approved
                                  </Text>
                                </View>
                              )}
                              {c.approval_status === 'rejected' && (
                                <View className="rounded-md bg-red-100 px-1.5 py-0.5">
                                  <Text className="text-[9px] font-medium text-red-700">
                                    Rejected
                                  </Text>
                                </View>
                              )}
                            </View>
                            {c.admin_note ? (
                              <Text className="mt-1 text-[10px] italic text-gray-400">
                                Admin: {c.admin_note}
                              </Text>
                            ) : null}
                          </View>
                          <View className="items-end">
                            <Text className="text-sm font-semibold text-gray-700">
                              {formatCurrency(Number(c.amount))}
                            </Text>
                            {c.can_request_change &&
                              activeId !== c.public_id && (
                                <TouchableOpacity
                                  className="mt-1 flex-row items-center gap-1 rounded-md border border-gray-200 px-2 py-1"
                                  onPress={() => setActiveId(c.public_id)}
                                >
                                  {c.is_selected ? (
                                    <ToggleLeft
                                      size={12}
                                      color={colors.gray[500]}
                                    />
                                  ) : (
                                    <ToggleRight
                                      size={12}
                                      color={colors.primary[500]}
                                    />
                                  )}
                                  <Text className="text-[10px] text-gray-600">
                                    {c.is_selected ? 'Opt Out' : 'Opt In'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                          </View>
                        </View>
                        {activeId === c.public_id && (
                          <View className="mt-3 border-t border-gray-100 pt-3">
                            <TextInput
                              placeholder="Reason for request..."
                              value={note}
                              onChangeText={setNote}
                              className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                            />
                            <View className="mt-2 flex-row gap-2">
                              <TouchableOpacity
                                className="flex-1 items-center rounded-md bg-primary-500 py-2"
                                disabled={
                                  !note.trim() ||
                                  optIn.isPending ||
                                  optOut.isPending
                                }
                                onPress={() => {
                                  const action = c.is_selected ? optOut : optIn;
                                  action.mutate(
                                    {
                                      publicId: c.public_id,
                                      requestNote: note.trim(),
                                    },
                                    {
                                      onSuccess: () => {
                                        Alert.alert(
                                          'Success',
                                          c.is_selected
                                            ? 'Opt-out request submitted'
                                            : 'Opt-in request submitted',
                                        );
                                        setActiveId(null);
                                        setNote('');
                                      },
                                      onError: () =>
                                        Alert.alert('Error', 'Request failed'),
                                    },
                                  );
                                }}
                              >
                                <Text className="text-xs font-medium text-white">
                                  Submit
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="flex-1 items-center rounded-md border border-gray-200 py-2"
                                onPress={() => {
                                  setActiveId(null);
                                  setNote('');
                                }}
                              >
                                <Text className="text-xs text-gray-600">
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <View className="items-center rounded-xl bg-gray-50 py-6">
                <Text className="text-sm text-gray-400">No fee components</Text>
              </View>
            )}

            {/* Payment History */}
            <Text className="mb-3 mt-6 text-sm font-semibold text-gray-600">
              Payment History
            </Text>
            {payments && payments.length > 0 ? (
              payments.map((p: FeePayment) => (
                <View
                  key={p.public_id}
                  className="mb-2 flex-row items-center rounded-xl border border-gray-100 bg-white p-4"
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle size={20} color={colors.success[500]} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      {formatCurrency(Number(p.amount))}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-400">
                      {format(new Date(p.payment_date), 'd MMM yyyy')}
                      {p.payment_mode ? ` • ${p.payment_mode}` : ''}
                    </Text>
                  </View>
                  {p.receipt_number && (
                    <Text className="text-[10px] text-gray-400">
                      #{p.receipt_number}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View className="items-center rounded-xl bg-gray-50 py-8">
                <Text className="text-sm text-gray-400">No payments yet</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
