/**
 * Admin Schedule Screen
 * Manage school schedules and calendar
 */

import { View, Text } from 'react-native';

import { Screen, Header } from '@/components/layout';

export default function AdminScheduleScreen() {
  return (
    <Screen>
      <Header title="Schedule" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-gray-500">School Schedule</Text>
        <Text className="mt-2 text-sm text-gray-400">Coming soon...</Text>
      </View>
    </Screen>
  );
}
