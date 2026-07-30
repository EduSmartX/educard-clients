import React from 'react';

import { AdminTabsNavigator } from './tabs/AdminTabsNavigator';
import { EmployeeTabsNavigator } from './tabs/EmployeeTabsNavigator';
import { ParentTabsNavigator } from './tabs/ParentTabsNavigator';

type MainTabsNavigatorProps = {
  role: string | null;
};

export function MainTabsNavigator({ role }: MainTabsNavigatorProps) {
  const normalized = role?.toLowerCase();

  switch (normalized) {
    case 'admin':
      return <AdminTabsNavigator />;
    case 'employee':
    case 'teacher':
      return <EmployeeTabsNavigator />;
    case 'parent':
    case 'student':
      return <ParentTabsNavigator />;
    default:
      return <AdminTabsNavigator />;
  }
}
