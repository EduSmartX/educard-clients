/**
 * Admin Sidebar Configuration
 * Navigation menu for administrators/principals
 */

import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  School,
  CalendarCheck,
  ClipboardCheck,
  CalendarDays,
  Settings,
  Building2,
  Sliders,
  AlertTriangle,
  Briefcase,
  CheckSquare,
  Clock,
  ClipboardList,
  FileText,
  BookMarked,
  ClipboardList as SubmissionsIcon,
  IndianRupee,
  Receipt,
  CreditCard,
} from 'lucide-react';
import type { SidebarSection } from '@/components/layout/dashboard-sidebar';
import { ROUTES } from '@/constants/app-config';

export const adminSidebarConfig: SidebarSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: ROUTES.ADMIN.DASHBOARD,
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: Calendar,
        path: ROUTES.CALENDAR,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        path: ROUTES.ANALYTICS,
      },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      {
        id: 'teachers',
        label: 'Teachers',
        icon: Users,
        path: ROUTES.TEACHERS,
      },
      {
        id: 'classes',
        label: 'Classes',
        icon: School,
        path: ROUTES.CLASSES,
      },
      {
        id: 'students',
        label: 'Students',
        icon: GraduationCap,
        path: ROUTES.STUDENTS,
      },
      {
        id: 'subjects',
        label: 'Subjects',
        icon: BookOpen,
        path: ROUTES.SUBJECTS,
      },
      {
        id: 'timetable',
        label: 'Timetable',
        icon: Clock,
        path: ROUTES.TIMETABLE_SETUP,
      },
    ],
  },
  {
    title: 'HOMEWORK',
    items: [
      {
        id: 'homework',
        label: 'Homework',
        icon: BookMarked,
        path: ROUTES.ADMIN.HOMEWORK.LIST,
      },
      {
        id: 'homework-submissions',
        label: 'Submissions',
        icon: SubmissionsIcon,
        path: ROUTES.HOMEWORK_SUBMISSIONS,
      },
    ],
  },
  {
    title: 'FEE MANAGEMENT',
    items: [
      {
        id: 'fee-dashboard',
        label: 'Fee Dashboard',
        icon: IndianRupee,
        path: ROUTES.FEES.DASHBOARD,
      },
      {
        id: 'fee-structures',
        label: 'Fee Structures',
        icon: Receipt,
        path: ROUTES.FEES.STRUCTURES,
      },
      {
        id: 'student-fees',
        label: 'Student Fees',
        icon: Users,
        path: ROUTES.FEES.STUDENT_FEES,
      },
      {
        id: 'fee-payments',
        label: 'Payments',
        icon: CreditCard,
        path: ROUTES.FEES.PAYMENTS,
      },
    ],
  },
  {
    title: 'EXAMS & MARKS',
    defaultCollapsed: true,
    items: [
      {
        id: 'exam-sessions',
        label: 'Exam Sessions',
        icon: ClipboardList,
        path: ROUTES.EXAMS,
      },
      {
        id: 'exams',
        label: 'Exams',
        icon: FileText,
        path: ROUTES.EXAMS_LIST,
        matchPaths: [ROUTES.EXAMS_NEW, ROUTES.EXAMS_BULK_CREATE],
      },
      {
        id: 'exam-overview',
        label: 'Exam Overview',
        icon: BarChart3,
        path: ROUTES.EXAMS_OVERVIEW,
      },
      {
        id: 'marks-overview',
        label: 'Marks Overview',
        icon: CheckSquare,
        path: ROUTES.MARKS_OVERVIEW,
      },
    ],
  },
  {
    title: 'ATTENDANCE',
    defaultCollapsed: true,
    items: [
      {
        id: 'mark-attendance',
        label: 'Mark Attendance',
        icon: ClipboardCheck,
        path: '/attendance/mark',
      },
      {
        id: 'attendance-summary',
        label: 'View Summary',
        icon: BarChart3,
        path: '/attendance/summary',
      },
      {
        id: 'attendance-reports',
        label: 'Attendance Report',
        icon: CalendarDays,
        path: '/attendance/report',
      },
      {
        id: 'attendance-timesheet',
        label: 'Timesheet',
        icon: CalendarCheck,
        path: ROUTES.ATTENDANCE.TIMESHEET,
      },
      {
        id: 'attendance-timesheet-approvals',
        label: 'Timesheet Approvals',
        icon: CheckSquare,
        path: ROUTES.ATTENDANCE.TIMESHEET_APPROVALS,
      },
    ],
  },
  {
    title: 'LEAVE SYSTEM',
    defaultCollapsed: true,
    items: [
      {
        id: 'leave-dashboard',
        label: 'Leave Dashboard',
        icon: Briefcase,
        path: ROUTES.LEAVE.DASHBOARD,
      },
      {
        id: 'leave-reviews',
        label: 'Leave Reviews',
        icon: ClipboardCheck,
        path: ROUTES.LEAVE.REVIEWS,
      },
      {
        id: 'leave-balances',
        label: 'Manage Leave Balances',
        icon: CalendarDays,
        path: ROUTES.LEAVE.BALANCES,
      },
      {
        id: 'leave-allocations',
        label: 'Leave Policies',
        icon: CalendarCheck,
        path: ROUTES.LEAVE.ALLOCATIONS,
      },
    ],
  },
  {
    title: 'PREFERENCES',
    defaultCollapsed: true,
    items: [
      {
        id: 'holidays',
        label: 'Holiday Calendar',
        icon: CalendarDays,
        path: ROUTES.HOLIDAYS,
      },
      {
        id: 'exceptional-work',
        label: 'Exceptional Work Policy',
        icon: AlertTriangle,
        path: ROUTES.EXCEPTIONAL_WORK,
      },
      {
        id: 'org-preferences',
        label: 'Organization Preferences',
        icon: Sliders,
        path: ROUTES.PREFERENCES,
      },
    ],
  },
  {
    title: 'SETTINGS',
    defaultCollapsed: true,
    items: [
      {
        id: 'organization',
        label: 'Organization',
        icon: Building2,
        path: ROUTES.ORGANIZATION,
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: ROUTES.PROFILE,
      },
    ],
  },
];
