/**
 * Parent Sidebar Configuration
 * Navigation menu for parents/guardians
 */

import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  Bell,
  BookOpen,
} from 'lucide-react';
import type { SidebarSection } from '@/components/layout/dashboard-sidebar';
import { ROUTES } from '@/constants/app-config';

export const parentSidebarConfig: SidebarSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: ROUTES.PARENT.DASHBOARD,
      },
      {
        id: 'my-children',
        label: 'My Children',
        icon: Users,
        path: ROUTES.PARENT.MY_CHILDREN,
      },
    ],
  },
  {
    title: 'ATTENDANCE',
    items: [
      {
        id: 'attendance-summary',
        label: 'Attendance Summary',
        icon: CalendarDays,
        path: ROUTES.PARENT.ATTENDANCE,
      },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      {
        id: 'assignments',
        label: 'Assignments',
        icon: BookOpen,
        path: '/parent/assignments',
      },
      {
        id: 'progress',
        label: 'Progress Reports',
        icon: FileText,
        path: '/parent/progress',
      },
    ],
  },
  {
    title: 'LEAVE SYSTEM',
    items: [
      {
        id: 'apply-leave',
        label: 'Apply Leave',
        icon: Calendar,
        path: ROUTES.PARENT.LEAVE.APPLY,
      },
      {
        id: 'leave-history',
        label: 'Leave History',
        icon: FileText,
        path: ROUTES.PARENT.LEAVE.HISTORY,
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        id: 'messages',
        label: 'Messages',
        icon: MessageSquare,
        path: '/parent/messages',
        badge: 2,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        path: '/parent/notifications',
        badge: 5,
      },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      {
        id: 'holidays',
        label: 'Holiday Calendar',
        icon: CalendarDays,
        path: ROUTES.HOLIDAYS,
      },
      {
        id: 'profile',
        label: 'My Profile',
        icon: Settings,
        path: ROUTES.PROFILE,
      },
    ],
  },
];
