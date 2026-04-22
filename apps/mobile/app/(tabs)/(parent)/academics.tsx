/**
 * Parent Academics Screen
 * View child's academic performance
 */

import { View, Text } from 'react-native';
import { Screen, Header } from '@/components/layout';

export default function ParentAcademicsScreen() {
  return (
    <Screen>
      <Header title="Academics" showBack={false} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-gray-500 text-lg">Academic Performance</Text>
        <Text className="text-gray-400 text-sm mt-2">Coming soon...</Text>
      </View>
    </Screen>
  );
}
