/**
 * Student Sidebar Configuration
 * Navigation menu for the dedicated Student Portal (`/student/*`).
 *
 * Only items with an implemented page are listed here. Add Attendance, Exams,
 * Timetable, Homework, Fee, and Leave once their pages ship (see
 * STUDENT_PORTAL_PLAN.md Phase 5).
 */

import { LayoutDashboard } from 'lucide-react';
import type { SidebarSection } from '@/components/layout/dashboard-sidebar';
import { ROUTES } from '@/constants/app-config';

export const studentSidebarConfig: SidebarSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: ROUTES.STUDENT.DASHBOARD,
      },
    ],
  },
];
