/**
 * Employee Tab Layout
 * Bottom tab navigator for teacher/staff role
 * Uses same layout as Admin but with different permissions
 */

import { Tabs } from 'expo-router';

import { useTabScreenOptions, VISIBLE_TABS } from '@/components/navigation/tab-config';

export default function EmployeeTabLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      {VISIBLE_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title, tabBarIcon: tab.icon }}
        />
      ))}
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}
