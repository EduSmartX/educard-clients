/**
 * Student Fees Screen
 * Fee summary + payment history
 */

import { format } from 'date-fns';
import { IndianRupee, CheckCircle } from 'lucide-react-native';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';

import { Screen, Header } from '@/components/layout';
import { colors } from '@/constants/colors';
import { useFeeSummary, useFeePayments, type FeePayment } from '@/features/student-portal';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ParentFeesScreen() {
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useFeeSummary();
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useFeePayments();

  const refresh = () => {
    refetchSummary();
    refetchPayments();
  };
  const isLoading = summaryLoading || paymentsLoading;

  return (
    <Screen>
      <Header title="Fees" showBack={false} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
      >
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        ) : (
          <View className="px-4 pb-6 pt-4">
            {/* Summary Cards */}
            {summary && (
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-xl border-l-4 border-l-blue-400 bg-white p-4">
                  <Text className="text-[10px] text-gray-500">Total Fee</Text>
                  <Text className="mt-1 text-xl font-bold text-gray-800">
                    {formatCurrency(summary.total_fee)}
                  </Text>
                </View>
                <View className="flex-1 rounded-xl border-l-4 border-l-emerald-400 bg-white p-4">
                  <Text className="text-[10px] text-gray-500">Paid</Text>
                  <Text className="mt-1 text-xl font-bold text-emerald-600">
                    {formatCurrency(summary.total_paid)}
                  </Text>
                </View>
                <View className="flex-1 rounded-xl border-l-4 border-l-amber-400 bg-white p-4">
                  <Text className="text-[10px] text-gray-500">Due</Text>
                  <Text className="mt-1 text-xl font-bold text-amber-600">
                    {formatCurrency(summary.total_due)}
                  </Text>
                </View>
              </View>
            )}

            {/* Payment History */}
            <Text className="mb-3 mt-6 text-sm font-semibold text-gray-600">
              💳 Payment History
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
                      {p.description || 'Payment'}
                    </Text>
                    <Text className="mt-0.5 text-xs text-gray-400">
                      {format(new Date(p.payment_date), 'd MMM yyyy')} • {p.payment_mode}
                    </Text>
                  </View>
                  <Text className="text-sm font-bold text-emerald-600">
                    {formatCurrency(p.amount)}
                  </Text>
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
