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
  Scale,
} from 'lucide-react-native';

import {
  AdminPanelBase,
  type AdminPanelItem,
} from '@/components/screens/AdminPanelBase';

const adminItems: AdminPanelItem[] = [
  {
    id: 'timesheet-approvals',
    title: 'Timesheet Approvals',
    subtitle: 'Review employee timesheets',
    icon: CheckSquare,
    gradient: ['#d97706', '#fbbf24'],
    screen: 'TimesheetApprovals',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Approvals',
    subtitle: 'Approve/reject requests',
    icon: Briefcase,
    gradient: ['#16a34a', '#4ade80'],
    screen: 'LeaveApprovals',
  },
  {
    id: 'leave-allocations',
    title: 'Leave Policies',
    subtitle: 'Manage leave policies',
    icon: FileText,
    gradient: ['#8b5cf6', '#c084fc'],
    screen: 'LeaveAllocations',
  },
  {
    id: 'leave-manage-balance',
    title: 'Manage Leave Balances',
    subtitle: 'Adjust member balances',
    icon: Scale,
    gradient: ['#0ea5e9', '#38bdf8'],
    screen: 'LeaveManageBalances',
  },
  {
    id: 'holidays',
    title: 'Holiday Calendar',
    subtitle: 'Manage holidays',
    icon: CalendarCheck,
    gradient: ['#dc2626', '#f87171'],
    screen: 'Holidays',
  },
  {
    id: 'exceptions',
    title: 'Work Exceptions',
    subtitle: 'Force working/holidays',
    icon: AlertTriangle,
    gradient: ['#0891b2', '#22d3ee'],
    screen: 'ExceptionalWork',
  },
  {
    id: 'fee-management',
    title: 'Fee Management',
    subtitle: 'Collect & track fees',
    icon: IndianRupee,
    gradient: ['#059669', '#10b981'],
    screen: 'FeeDashboard',
  },
  {
    id: 'preferences',
    title: 'Org Preferences',
    subtitle: 'Organization settings',
    icon: SlidersHorizontal,
    gradient: ['#0284c7', '#38bdf8'],
    screen: 'Preferences',
  },
];

export default function AdminPanelScreen() {
  return (
    <AdminPanelBase
      subtitle="Approvals & configurations"
      items={adminItems}
      settingsScreen="Settings"
    />
  );
}
