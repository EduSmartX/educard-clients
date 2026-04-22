/**
 * Employee Attendance Screen
 * Mark and view attendance
 */

import { View, Text } from 'react-native';
import { Screen, Header } from '@/components/layout';

export default function EmployeeAttendanceScreen() {
  return (
    <Screen>
      <Header title="Attendance" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-lg">Attendance Management</Text>
        <Text className="text-gray-400 text-sm mt-2">Coming soon...</Text>
      </View>
    </Screen>
  );
}
