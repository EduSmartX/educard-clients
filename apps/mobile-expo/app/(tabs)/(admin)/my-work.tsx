/**
 * My Work Screen - Personal tasks & activities (Admin)
 */

import { COMMON_WORK_ITEMS, MyWorkScreenBase } from '@/components/screens/MyWorkScreenBase';

export default function MyWorkScreen() {
  return <MyWorkScreenBase items={COMMON_WORK_ITEMS} settingsRoute="/(tabs)/(admin)/settings" />;
}
