/**
 * Admin Screen - Approvals & configurations
 */

import {
  CheckSquare,
  Briefcase,
  FileText,
  CalendarCheck,
  AlertTriangle,
  SlidersHorizontal,
  IndianRupee,
} from 'lucide-react-native';

import { AdminPanelBase, AdminPanelItem } from '@/components/screens/AdminPanelBase';

const adminItems: AdminPanelItem[] = [
  {
    id: 'timesheet-approvals',
    title: 'Timesheet Approvals',
    subtitle: 'Review employee timesheets',
    icon: CheckSquare,
    gradient: ['#d97706', '#fbbf24'],
    route: '/(shared-screens)/timesheets/approvals',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Approvals',
    subtitle: 'Approve/reject requests',
    icon: Briefcase,
    gradient: ['#16a34a', '#4ade80'],
    route: '/(shared-screens)/leave/approvals',
  },
  {
    id: 'leave-allocations',
    title: 'Leave Policies',
    subtitle: 'Manage leave policies',
    icon: FileText,
    gradient: ['#8b5cf6', '#c084fc'],
    route: '/(shared-screens)/leave/allocations',
  },
  {
    id: 'holidays',
    title: 'Holiday Calendar',
    subtitle: 'Manage holidays',
    icon: CalendarCheck,
    gradient: ['#dc2626', '#f87171'],
    route: '/(shared-screens)/holidays',
  },
  {
    id: 'exceptions',
    title: 'Work Exceptions',
    subtitle: 'Force working/holidays',
    icon: AlertTriangle,
    gradient: ['#0891b2', '#22d3ee'],
    route: '/(shared-screens)/exceptional-work',
  },
  {
    id: 'fee-management',
    title: 'Fee Management',
    subtitle: 'Collect & track fees',
    icon: IndianRupee,
    gradient: ['#059669', '#10b981'],
    route: '/(tabs)/(admin)/fee-dashboard',
  },
  {
    id: 'preferences',
    title: 'Org Preferences',
    subtitle: 'Organization settings',
    icon: SlidersHorizontal,
    gradient: ['#0284c7', '#38bdf8'],
    route: '/(shared-screens)/preferences',
  },
];

export default function AdminScreen() {
  return (
    <AdminPanelBase
      subtitle="Approvals & configurations"
      items={adminItems}
      settingsRoute="/(tabs)/(admin)/settings"
    />
  );
}
