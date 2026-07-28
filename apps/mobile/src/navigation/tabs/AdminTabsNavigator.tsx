import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import {
  useTabScreenOptions,
  VISIBLE_TABS,
} from '@/components/navigation/tab-config';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import AdminDashboardScreen from '@/screens/admin/AdminDashboardScreen';
import AdminPanelScreen from '@/screens/admin/AdminPanelScreen';
import ManagementScreen from '@/screens/admin/ManagementScreen';
import MyWorkScreen from '@/screens/admin/MyWorkScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import type { AdminTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

function AdminTabPlaceholder({
  route,
}: BottomTabScreenProps<AdminTabParamList>) {
  return (
    <PlaceholderScreen
      title={`Admin · ${route.name}`}
      description="Screen migration pending — real content ports next."
    />
  );
}

const SCREENS: Partial<
  Record<keyof AdminTabParamList, React.ComponentType<object>>
> = {
  Dashboard: AdminDashboardScreen,
  Management: ManagementScreen,
  MyWork: MyWorkScreen,
  Admin: AdminPanelScreen,
  Settings: SettingsScreen,
};

export function AdminTabsNavigator() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      {VISIBLE_TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={SCREENS[tab.name] ?? AdminTabPlaceholder}
          options={{
            title: tab.title,
            tabBarIcon: tab.icon,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
