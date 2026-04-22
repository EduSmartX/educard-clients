/**
 * Admin Screens Stack Layout
 * Stack navigator for create/view/edit screens organized by module
 *
 * Structure:
 *   teachers/create, teachers/[id]
 *   students/create, students/[id]
 *   classes/create,  classes/[id]
 *   subjects/create, subjects/[id]
 */

import { Stack } from 'expo-router';

export default function AdminScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Teachers */}
      <Stack.Screen name="teachers/create" />
      <Stack.Screen name="teachers/[id]" />
      <Stack.Screen name="teachers/edit" />
      {/* Students */}
      <Stack.Screen name="students/create" />
      <Stack.Screen name="students/[id]" />
      <Stack.Screen name="students/edit" />
      {/* Classes */}
      <Stack.Screen name="classes/create" />
      <Stack.Screen name="classes/[id]" />
      <Stack.Screen name="classes/edit" />
      {/* Subjects */}
      <Stack.Screen name="subjects/create" />
      <Stack.Screen name="subjects/[id]" />
      <Stack.Screen name="subjects/edit" />
    </Stack>
  );
}
