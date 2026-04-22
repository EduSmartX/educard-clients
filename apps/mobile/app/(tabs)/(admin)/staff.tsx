/**
 * Admin Staff Screen
 * List and manage staff members
 */

import { View, Text } from 'react-native';
import { Screen, Header } from '@/components/layout';

export default function AdminStaffScreen() {
  return (
    <Screen>
      <Header title="Staff" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-lg">Staff List</Text>
        <Text className="text-gray-400 text-sm mt-2">Coming soon...</Text>
      </View>
    </Screen>
  );
}
