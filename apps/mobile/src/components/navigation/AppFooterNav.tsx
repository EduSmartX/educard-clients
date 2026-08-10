/**
 * AppFooterNav — persistent bottom quick-navigation bar shown on every screen
 * of the authenticated app. Rendered once in the main shell, so new screens get
 * it automatically. Highlights the currently active tab and jumps to it,
 * popping any detail screens that are open on top.
 */

import {
  LayoutDashboard,
  Building2,
  User,
  Shield,
  Settings,
  GraduationCap,
  Calendar,
  CreditCard,
} from 'lucide-react-native';
import { CommonActions } from '@react-navigation/native';
import type {
  NavigationState,
  PartialState,
  Route,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navigationRef } from '@/navigation/navigation-service';

type IconComponent = React.ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

interface FooterItem {
  name: string;
  label: string;
  Icon: IconComponent;
}

const STAFF_ITEMS: FooterItem[] = [
  { name: 'Dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { name: 'Management', label: 'Manage', Icon: Building2 },
  { name: 'MyWork', label: 'My Work', Icon: User },
  { name: 'Admin', label: 'Admin', Icon: Shield },
  { name: 'Settings', label: 'Settings', Icon: Settings },
];

const PARENT_ITEMS: FooterItem[] = [
  { name: 'Dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { name: 'Academics', label: 'Academics', Icon: GraduationCap },
  { name: 'Attendance', label: 'Attendance', Icon: Calendar },
  { name: 'Fees', label: 'Fees', Icon: CreditCard },
  { name: 'Settings', label: 'Settings', Icon: Settings },
];

type NavState = NavigationState | PartialState<NavigationState> | undefined;
type RouteWithState = Route<string> & { state?: NavState };

function selectActiveTabFromMainTabs(state: NavState): string | undefined {
  if (!state?.routes || state.routes.length === 0) return undefined;
  const rootIndex = state.index ?? 0;
  const rootRoute = state.routes[rootIndex] as RouteWithState | undefined;
  if (!rootRoute || rootRoute.name !== 'Main') return undefined;

  const mainState = rootRoute.state as NavigationState | undefined;
  const tabsRoute = mainState?.routes.find(r => r.name === 'Tabs') as
    | RouteWithState
    | undefined;
  if (!tabsRoute) return undefined;

  const tabState = tabsRoute.state as NavigationState | undefined;
  if (tabState && tabState.routes.length > 0) {
    return tabState.routes[tabState.index ?? 0]?.name;
  }

  const screenParam = (tabsRoute.params as { screen?: string } | undefined)
    ?.screen;
  return screenParam;
}

interface AppFooterNavProps {
  role: string | null;
}

export function AppFooterNav({ role }: AppFooterNavProps) {
  const insets = useSafeAreaInsets();
  const normalizedRole = role?.toLowerCase();
  const items =
    normalizedRole === 'parent' || normalizedRole === 'student'
      ? PARENT_ITEMS
      : STAFF_ITEMS;
  const [activeTab, setActiveTab] = useState<string | undefined>(() =>
    navigationRef.isReady()
      ? selectActiveTabFromMainTabs(navigationRef.getRootState())
      : undefined,
  );

  // Footer sits outside the tab navigator; sync via the container's global state.
  useEffect(() => {
    const sync = () => {
      if (!navigationRef.isReady()) return;

      const focusedRouteName = navigationRef.getCurrentRoute()?.name;
      if (
        focusedRouteName &&
        items.some(item => item.name === focusedRouteName)
      ) {
        setActiveTab(focusedRouteName);
        return;
      }

      setActiveTab(selectActiveTabFromMainTabs(navigationRef.getRootState()));
    };
    sync();
    return navigationRef.addListener('state', sync);
  }, [items]);

  const handlePress = (name: string) => {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(
      CommonActions.navigate('Main', {
        screen: 'Tabs',
        params: { screen: name },
      }),
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 8 }]}>
      {items.map(item => {
        const focused = activeTab === item.name;
        const color = focused ? '#059669' : '#94a3b8';
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.item}
            onPress={() => handlePress(item.name)}
            activeOpacity={0.7}
          >
            <item.Icon
              size={22}
              color={color}
              strokeWidth={focused ? 2.4 : 1.6}
            />
            <Text
              style={[styles.label, focused && styles.labelActive]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.2,
  },
  labelActive: { color: '#059669' },
});
