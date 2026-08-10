/**
 * Student Attendance Screen
 * Summary stats + monthly breakdown
 */

import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import {
  DonutChart,
  ChartLegend,
  type ChartSegment,
} from '@/components/charts';
import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { colors } from '@/constants/colors';
import { useAttendanceSummary } from '@/features/student-portal';

import { AttendanceCalendar } from './attendance/AttendanceCalendar';

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly color: string;
  readonly icon: typeof CheckCircle;
}) {
  return (
    <View
      style={styles.statCard}
      className="rounded-xl border border-gray-200 bg-white p-4"
    >
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={color} />
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
      <Text className="mt-2 text-2xl font-bold text-gray-800">{value}</Text>
    </View>
  );
}

export default function ParentAttendanceScreen() {
  const {
    data: summary,
    isLoading,
    isRefetching,
    refetch,
  } = useAttendanceSummary();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="items-center py-20">
          <ActivityIndicator color={colors.primary[500]} />
        </View>
      );
    }
    if (!summary) {
      return (
        <View className="items-center py-20">
          <Text className="text-3xl">📭</Text>
          <Text className="mt-2 text-sm text-gray-500">No attendance data</Text>
        </View>
      );
    }
    const cm = summary.current_month;
    const segments: ChartSegment[] = [
      { label: 'Present', value: cm.present_days, color: colors.success[500] },
      { label: 'Absent', value: cm.absent_days, color: colors.danger[500] },
      { label: 'Half Day', value: cm.half_days, color: colors.warning[500] },
    ];
    const growthLabel = `${summary.growth_rate > 0 ? '+' : ''}${summary.growth_rate.toFixed(0)}%`;
    return (
      <View className="px-4 pb-6 pt-5">
        <Text className="mb-3 text-base font-bold text-gray-800">
          This Month
        </Text>
        {/* This-month donut */}
        <View className="items-center rounded-2xl border border-gray-200 bg-white p-5">
          <DonutChart
            data={segments}
            size={168}
            thickness={22}
            centerValue={`${cm.percentage.toFixed(0)}%`}
            centerLabel="Attendance"
          />
          <ChartLegend data={segments} showValues style={styles.legend} />
        </View>

        {/* Stats Row */}
        <View className="mt-4 flex-row flex-wrap gap-3">
          <StatCard
            label="Present"
            value={cm.present_days}
            color={colors.success[500]}
            icon={CheckCircle}
          />
          <StatCard
            label="Absent"
            value={cm.absent_days}
            color={colors.danger[500]}
            icon={XCircle}
          />
          <StatCard
            label="Half Day"
            value={cm.half_days}
            color={colors.warning[500]}
            icon={Clock}
          />
        </View>

        <Text className="mb-3 mt-8 text-base font-bold text-gray-800">
          Monthly Report
        </Text>
        <AttendanceCalendar />

        {/* Overview */}
        <Text className="mb-3 mt-8 text-base font-bold text-gray-800">
          Overview
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <StatCard
            label="Academic Year"
            value={`${summary.academic_year_percentage.toFixed(0)}%`}
            color={colors.primary[500]}
            icon={CheckCircle}
          />
          <StatCard
            label="Last Month"
            value={`${summary.previous_month_percentage.toFixed(0)}%`}
            color={colors.warning[500]}
            icon={Clock}
          />
          <StatCard
            label="Growth"
            value={growthLabel}
            color={
              summary.growth_rate >= 0
                ? colors.success[500]
                : colors.danger[500]
            }
            icon={CheckCircle}
          />
        </View>
      </View>
    );
  };

  return (
    <Screen safeArea={false} statusBarStyle="light" backgroundColor="#f8fafc">
      <ScreenHeader
        title="Attendance"
        subtitle="Monthly attendance and trends"
        showBack={false}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { marginTop: 16, alignSelf: 'stretch' },
  scrollContent: { paddingBottom: 24 },
  statCard: { width: '48%' },
});
