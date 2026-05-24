/**
 * Admin Screen - View approvals & requests (Employee/Teacher)
 * Shares same screens as admin with role-based access
 */

import { CheckSquare, Briefcase, FileText, CalendarCheck } from 'lucide-react-native';

import { AdminPanelBase, AdminPanelItem } from '@/components/screens/AdminPanelBase';

const adminItems: AdminPanelItem[] = [
  {
    id: 'timesheet-approvals',
    title: 'Timesheet Approvals',
    icon: CheckSquare,
    gradient: ['#d97706', '#fbbf24'],
    route: '/(shared-screens)/timesheets/approvals',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Approvals',
    icon: Briefcase,
    gradient: ['#16a34a', '#4ade80'],
    route: '/(shared-screens)/leave/approvals',
  },
  {
    id: 'leave-policies',
    title: 'Leave Policies',
    icon: FileText,
    gradient: ['#8b5cf6', '#c084fc'],
    route: '/(shared-screens)/leave/allocations',
  },
  {
    id: 'holidays',
    title: 'Holidays',
    icon: CalendarCheck,
    gradient: ['#dc2626', '#f87171'],
    route: '/(shared-screens)/holidays',
  },
];

export default function AdminScreen() {
  return (
    <AdminPanelBase
      subtitle="My requests & policies"
      items={adminItems}
      settingsRoute="/(tabs)/(employee)/settings"
    />
  );
}
