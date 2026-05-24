/**
 * Employee Tab Layout
 * Bottom tab navigator for teacher/staff role
 * Uses same layout as Admin but with different permissions
 */

import { Tabs } from 'expo-router';

import {
  DashboardIcon,
  ManageIcon,
  MyWorkIcon,
  AdminIcon,
  SettingsIcon,
} from '@/components/navigation/tab-icons';
import { useTabScreenOptions } from '@/components/navigation/tab-config';

export default function EmployeeTabLayout() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tabs.Screen
        name="management"
        options={{
          title: 'Manage',
          tabBarIcon: ManageIcon,
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: 'My Work',
          tabBarIcon: MyWorkIcon,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: AdminIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: SettingsIcon,
        }}
      />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
    </Tabs>
  );
}
