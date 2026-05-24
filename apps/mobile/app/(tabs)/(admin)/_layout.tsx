/**
 * Admin Tab Layout
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

export default function AdminTabLayout() {
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
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="students" options={{ href: null }} />
      <Tabs.Screen name="staff" options={{ href: null }} />
      <Tabs.Screen name="teachers" options={{ href: null }} />
      <Tabs.Screen name="classes" options={{ href: null }} />
      <Tabs.Screen name="subjects" options={{ href: null }} />
      <Tabs.Screen name="create-class" options={{ href: null }} />
      <Tabs.Screen name="create-student" options={{ href: null }} />
      <Tabs.Screen name="create-subject" options={{ href: null }} />
      <Tabs.Screen name="create-teacher" options={{ href: null }} />
      <Tabs.Screen name="view-class" options={{ href: null }} />
      <Tabs.Screen name="view-student" options={{ href: null }} />
      <Tabs.Screen name="view-subject" options={{ href: null }} />
      <Tabs.Screen name="view-teacher" options={{ href: null }} />
      {/* Fee Management screens */}
      <Tabs.Screen name="fee-dashboard" options={{ href: null }} />
      <Tabs.Screen name="fee-structures" options={{ href: null }} />
      <Tabs.Screen name="fee-structure-detail" options={{ href: null }} />
      <Tabs.Screen name="fee-structure-form" options={{ href: null }} />
      <Tabs.Screen name="fee-student-fees" options={{ href: null }} />
      <Tabs.Screen name="fee-student-detail" options={{ href: null }} />
      <Tabs.Screen name="fee-student-edit" options={{ href: null }} />
      <Tabs.Screen name="fee-payments" options={{ href: null }} />
      <Tabs.Screen name="fee-assign-student" options={{ href: null }} />
    </Tabs>
  );
}
