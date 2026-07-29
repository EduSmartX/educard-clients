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
        <Text className="text-lg text-gray-500">Staff List</Text>
        <Text className="mt-2 text-sm text-gray-400">Coming soon...</Text>
      </View>
    </Screen>
  );
}
