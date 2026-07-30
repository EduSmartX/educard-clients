/**
 * Modals Layout
 * Stack navigator for modal screens
 */

import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        presentation: 'modal',
        animation: 'slide_from_bottom',
        contentStyle: {
          backgroundColor: '#ffffff',
        },
      }}
    />
  );
}
