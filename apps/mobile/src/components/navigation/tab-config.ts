/**
 * Shared tab bar screen options for admin and employee layouts.
 * Both tabs use the same visual config, only hidden screens differ.
 */

import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardIcon,
  ManageIcon,
  MyWorkIcon,
  AdminIcon,
  SettingsIcon,
} from './tab-icons';

export function useTabScreenOptions() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(
    insets.bottom,
    Platform.OS === 'android' ? 12 : 0,
  );

  return {
    headerShown: false,
    tabBarActiveTintColor: '#059669',
    tabBarInactiveTintColor: '#94a3b8',
    tabBarStyle: {
      backgroundColor: '#fff',
      borderTopWidth: 0,
      paddingTop: 8,
      paddingBottom: bottomPadding + 8,
      height: 68 + bottomPadding,
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 16,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '700' as const,
      marginTop: 4,
      letterSpacing: 0.2,
    },
  };
}

/**
 * Shared visible tab definitions used by both admin and employee layouts.
 */
export const VISIBLE_TABS = [
  { name: 'Dashboard', title: 'Dashboard', icon: DashboardIcon },
  { name: 'Management', title: 'Manage', icon: ManageIcon },
  { name: 'MyWork', title: 'My Work', icon: MyWorkIcon },
  { name: 'Admin', title: 'Admin', icon: AdminIcon },
  { name: 'Settings', title: 'Settings', icon: SettingsIcon },
] as const;
