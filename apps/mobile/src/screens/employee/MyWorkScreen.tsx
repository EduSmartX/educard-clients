/**
 * My Work Screen - Personal tasks & activities (Employee/Teacher)
 * Uses shared MyWorkScreenBase with a header icon.
 */

import { View, StyleSheet } from 'react-native';

import {
  COMMON_WORK_ITEMS,
  MyWorkScreenBase,
  Briefcase,
} from '@/components/screens/MyWorkScreenBase';

const HeaderIcon = () => (
  <View style={iconStyles.headerIcon}>
    <Briefcase size={24} color="#fff" />
  </View>
);

const iconStyles = StyleSheet.create({
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});

export default function MyWorkScreen() {
  return (
    <MyWorkScreenBase
      items={COMMON_WORK_ITEMS}
      settingsScreen="Settings"
      headerIcon={<HeaderIcon />}
    />
  );
}
