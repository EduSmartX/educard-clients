/**
 * Student Sidebar Configuration
 * Navigation menu for the dedicated Student Portal (`/student/*`).
 */

import {
  LayoutDashboard,
  CalendarCheck,
  Calendar,
  BookOpen,
  FileText,
  IndianRupee,
  CalendarOff,
  Megaphone,
  MessageSquare,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';
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
  {
    title: 'Academics',
    items: [
      {
        id: 'attendance',
        label: 'Attendance',
        icon: CalendarCheck,
        path: ROUTES.STUDENT.ATTENDANCE,
      },
      {
        id: 'timetable',
        label: 'Timetable',
        icon: Calendar,
        path: ROUTES.STUDENT.TIMETABLE,
      },
      {
        id: 'homework',
        label: 'Homework',
        icon: BookOpen,
        path: ROUTES.STUDENT.HOMEWORK,
      },
      {
        id: 'exams',
        label: 'Exams',
        icon: FileText,
        path: ROUTES.STUDENT.EXAMS,
      },
    ],
  },
  {
    title: 'Others',
    items: [
      {
        id: 'announcements',
        label: 'Announcements',
        icon: Megaphone,
        path: ROUTES.STUDENT.ANNOUNCEMENTS,
      },
      {
        id: 'fee',
        label: 'Fee',
        icon: IndianRupee,
        path: ROUTES.STUDENT.FEE,
      },
      {
        id: 'leave',
        label: 'Leave',
        icon: CalendarOff,
        path: ROUTES.STUDENT.LEAVE,
      },
      {
        id: 'feedback',
        label: 'Feedback',
        icon: MessageSquare,
        path: ROUTES.FEEDBACK,
      },
    ],
  },
  {
    title: 'School Calendar',
    items: [
      {
        id: 'holidays',
        label: 'Holiday Calendar',
        icon: CalendarDays,
        path: ROUTES.STUDENT.HOLIDAYS,
      },
      {
        id: 'exceptional-work',
        label: 'Exceptional Work Policy',
        icon: AlertTriangle,
        path: ROUTES.STUDENT.EXCEPTIONAL_WORK,
      },
    ],
  },
];
