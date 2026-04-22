/**
 * Employee Classes Screen
 * List teacher's classes
 */

import { View, Text } from 'react-native';
import { Screen, Header } from '@/components/layout';

export default function EmployeeClassesScreen() {
  return (
    <Screen>
      <Header title="My Classes" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-lg">My Classes</Text>
        <Text className="text-gray-400 text-sm mt-2">Coming soon...</Text>
      </View>
    </Screen>
  );
}
