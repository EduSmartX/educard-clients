/**
 * Student Attendance Screen
 * Summary stats + monthly breakdown
 */

import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';

import { Screen, Header } from '@/components/layout';
import { colors } from '@/constants/colors';
import { useAttendanceSummary } from '@/features/student-portal';

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: typeof CheckCircle;
}) {
  return (
    <View className="flex-1 rounded-xl border border-gray-100 bg-white p-4">
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={color} />
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
      <Text className="mt-2 text-2xl font-bold text-gray-800">{value}</Text>
    </View>
  );
}

export default function ParentAttendanceScreen() {
  const { data: summary, isLoading, refetch } = useAttendanceSummary();

  return (
    <Screen>
      <Header title="Attendance" showBack={false} />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void refetch()} />}
      >
        {isLoading ? (
          <View className="items-center py-20">
            <ActivityIndicator color={colors.primary[500]} />
          </View>
        ) : summary ? (
          <View className="px-4 pb-6 pt-4">
            {/* Overall Percentage */}
            <View
              className="items-center rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 p-6"
              style={{ backgroundColor: colors.success[500] }}
            >
              <Text className="text-4xl font-bold text-white">
                {summary.percentage.toFixed(1)}%
              </Text>
              <Text className="mt-1 text-sm text-white/80">Overall Attendance</Text>
            </View>

            {/* Stats Row */}
            <View className="mt-4 flex-row gap-3">
              <StatCard
                label="Present"
                value={summary.present}
                color={colors.success[500]}
                icon={CheckCircle}
              />
              <StatCard
                label="Absent"
                value={summary.absent}
                color={colors.danger[500]}
                icon={XCircle}
              />
              <StatCard
                label="Late"
                value={summary.late}
                color={colors.warning[500]}
                icon={Clock}
              />
            </View>

            {/* Monthly Breakdown */}
            <Text className="mb-3 mt-6 text-sm font-semibold text-gray-600">
              📊 Monthly Breakdown
            </Text>
            {summary.monthly_breakdown?.map((m) => {
              const pct = m.total > 0 ? (m.present / m.total) * 100 : 0;
              return (
                <View key={m.month} className="mb-2 rounded-xl border border-gray-100 bg-white p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-gray-700">{m.month}</Text>
                    <Text
                      className={`text-sm font-bold ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                    <View
                      className={`h-full rounded-full ${pct >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                  <View className="mt-1.5 flex-row gap-3">
                    <Text className="text-[10px] text-gray-400">Present: {m.present}</Text>
                    <Text className="text-[10px] text-gray-400">Absent: {m.absent}</Text>
                    <Text className="text-[10px] text-gray-400">Total: {m.total}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="items-center py-20">
            <Text className="text-3xl">📭</Text>
            <Text className="mt-2 text-sm text-gray-500">No attendance data</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
