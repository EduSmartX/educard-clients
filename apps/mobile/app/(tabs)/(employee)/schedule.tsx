/**
 * Employee Schedule Screen
 * Teacher's timetable
 */

import { View, Text } from 'react-native';
import { Screen, Header } from '@/components/layout';

export default function EmployeeScheduleScreen() {
  return (
    <Screen>
      <Header title="My Schedule" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-gray-500">My Timetable</Text>
        <Text className="mt-2 text-sm text-gray-400">Coming soon...</Text>
      </View>
    </Screen>
  );
}
