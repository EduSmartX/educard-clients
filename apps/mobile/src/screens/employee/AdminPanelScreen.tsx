/**
 * Admin Screen - View approvals & requests (Employee/Teacher)
 * Shares same screens as admin with role-based access.
 */

import {
  CheckSquare,
  Briefcase,
  FileText,
  CalendarCheck,
  Scale,
  AlertTriangle,
} from 'lucide-react-native';

import {
  AdminPanelBase,
  type AdminPanelItem,
} from '@/components/screens/AdminPanelBase';
import { idCardApprovalsTile } from '@/features/store/store-menu-items';
import { useAuthStore } from '@/lib/auth-store';
import { isTeacherRole } from '@/utils/role-utils';

const adminItems: AdminPanelItem[] = [
  {
    id: 'timesheet-approvals',
    title: 'Timesheet Approvals',
    icon: CheckSquare,
    gradient: ['#d97706', '#fbbf24'],
    screen: 'TimesheetApprovals',
  },
  {
    id: 'leave-approvals',
    title: 'Leave Approvals',
    icon: Briefcase,
    gradient: ['#16a34a', '#4ade80'],
    screen: 'LeaveApprovals',
  },
  {
    id: 'leave-policies',
    title: 'Leave Policies',
    icon: FileText,
    gradient: ['#8b5cf6', '#c084fc'],
    screen: 'LeaveAllocations',
  },
  {
    id: 'leave-manage-balance',
    title: 'Manage Leave Balances',
    icon: Scale,
    gradient: ['#0ea5e9', '#38bdf8'],
    screen: 'LeaveManageBalances',
  },
  {
    id: 'holidays',
    title: 'Holidays',
    icon: CalendarCheck,
    gradient: ['#dc2626', '#f87171'],
    screen: 'Holidays',
  },
  {
    id: 'exceptions',
    title: 'Work Exceptions',
    icon: AlertTriangle,
    gradient: ['#0891b2', '#22d3ee'],
    screen: 'ExceptionalWork',
  },
];

export default function AdminPanelScreen() {
  // Class teachers approve their classes' ID cards.
  const role = useAuthStore(state => state.user?.role);
  const items = isTeacherRole(role)
    ? [idCardApprovalsTile, ...adminItems]
    : adminItems;
  return (
    <AdminPanelBase
      subtitle="My requests & policies"
      items={items}
      settingsScreen="Settings"
    />
  );
}
