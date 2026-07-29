/**
 * Homework Section Layout
 * Provides navigation structure for homework screens
 */

import { Stack } from 'expo-router';

export default function HomeworkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="submissions" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
