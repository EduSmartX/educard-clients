/**
 * Parent Fees Screen
 * View and pay fees
 */

import { View, Text } from 'react-native';
import { Screen, Header } from '@/components/layout';

export default function ParentFeesScreen() {
  return (
    <Screen>
      <Header title="Fees" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-gray-500">Fee Management</Text>
        <Text className="mt-2 text-sm text-gray-400">Coming soon...</Text>
      </View>
    </Screen>
  );
}
