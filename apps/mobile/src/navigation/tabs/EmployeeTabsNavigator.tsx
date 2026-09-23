import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import {
  useTabScreenOptions,
  VISIBLE_TABS,
} from '@/components/navigation/tab-config';
import { PlaceholderScreen } from '@/screens/PlaceholderScreen';
import EmployeeDashboardScreen from '@/screens/employee/EmployeeDashboardScreen';
import AdminPanelScreen from '@/screens/employee/AdminPanelScreen';
import ManagementScreen from '@/screens/employee/ManagementScreen';
import MyWorkScreen from '@/screens/employee/MyWorkScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import type { EmployeeTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<EmployeeTabParamList>();

function EmployeeTabPlaceholder({
  route,
}: BottomTabScreenProps<EmployeeTabParamList>) {
  return (
    <PlaceholderScreen
      title={`Employee · ${route.name}`}
      description="Screen migration pending — real content ports next."
    />
  );
}

const SCREENS: Partial<
  Record<keyof EmployeeTabParamList, React.ComponentType<object>>
> = {
  Dashboard: EmployeeDashboardScreen,
  Management: ManagementScreen,
  MyWork: MyWorkScreen,
  Admin: AdminPanelScreen,
  Settings: SettingsScreen,
};

export function EmployeeTabsNavigator() {
  const screenOptions = useTabScreenOptions();

  return (
    <Tab.Navigator
      screenOptions={{ ...screenOptions, tabBarStyle: { display: 'none' } }}
    >
      {VISIBLE_TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={SCREENS[tab.name] ?? EmployeeTabPlaceholder}
          options={{
            title: tab.title,
            tabBarIcon: tab.icon,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
