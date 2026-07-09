/**
 * Employee Sidebar Configuration
 * Navigation menu for teachers and staff members
 */

import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  BookOpen,
  ClipboardCheck,
  Settings,
  Briefcase,
  AlertTriangle,
  UserCog,
  School,
  GraduationCap,
  BarChart3,
  CheckSquare,
  ClipboardList,
  FileText,
  BookMarked,
  ClipboardList as SubmissionsIcon,
  Eye,
  ClipboardEdit,
  RotateCcw,
} from 'lucide-react';
import type { SidebarSection } from '@/components/layout/dashboard-sidebar';
import { ROUTES } from '@/constants/app-config';

export const employeeSidebarConfig: SidebarSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: ROUTES.EMPLOYEE.DASHBOARD,
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
        path: '/analytics', // TODO: Add proper analytics route
      },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      {
        id: 'teachers',
        label: 'Teachers',
        icon: UserCog,
        path: ROUTES.EMPLOYEE.TEACHERS,
      },
      {
        id: 'classes',
        label: 'Classes',
        icon: School,
        path: ROUTES.EMPLOYEE.CLASSES,
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
    ],
  },
  {
    title: 'TIMETABLE',
    items: [
      {
        id: 'view-timetable',
        label: 'View Timetable',
        icon: Eye,
        path: ROUTES.TIMETABLE_VIEW,
      },
      {
        id: 'period-overrides',
        label: 'Period Overrides',
        icon: CalendarRange,
        path: ROUTES.TIMETABLE_OVERRIDES,
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
        path: ROUTES.EMPLOYEE.HOMEWORK.LIST,
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
    title: 'EXAMS & MARKS',
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
        matchPaths: [ROUTES.EXAMS_STATUS_CONTROL],
      },
      {
        id: 'exam-status-control',
        label: 'Status Control',
        icon: RotateCcw,
        path: ROUTES.EXAMS_STATUS_CONTROL,
      },
      {
        id: 'marks-entry',
        label: 'Enter Marks',
        icon: ClipboardEdit,
        path: ROUTES.MARKS_ENTRY,
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
    items: [
      {
        id: 'mark-attendance',
        label: 'Mark Attendance',
        icon: ClipboardCheck,
        path: ROUTES.EMPLOYEE.ATTENDANCE.MARK,
      },
      {
        id: 'attendance-summary',
        label: 'View Summary',
        icon: BarChart3,
        path: ROUTES.EMPLOYEE.ATTENDANCE.SUMMARY,
      },
      {
        id: 'attendance-reports',
        label: 'Attendance Report',
        icon: CalendarDays,
        path: ROUTES.EMPLOYEE.ATTENDANCE.REPORT,
      },
      {
        id: 'attendance-timesheet',
        label: 'My Timesheet',
        icon: CalendarCheck,
        path: ROUTES.EMPLOYEE.ATTENDANCE.TIMESHEET,
      },
      {
        id: 'timesheet-approvals',
        label: 'Timesheet Approvals',
        icon: CheckSquare,
        path: ROUTES.EMPLOYEE.ATTENDANCE.APPROVALS,
        requiresSupervisor: true,
      },
    ],
  },
  {
    title: 'LEAVE SYSTEM',
    items: [
      {
        id: 'leave-dashboard',
        label: 'Leave Dashboard',
        icon: Briefcase,
        path: ROUTES.EMPLOYEE.LEAVE.DASHBOARD,
      },
      {
        id: 'leave-reviews',
        label: 'Leave Reviews',
        icon: ClipboardCheck,
        path: ROUTES.EMPLOYEE.LEAVE.REVIEWS,
        requiresSupervisor: true,
      },
      {
        id: 'manage-leave-balance',
        label: 'Manage Leave Balances',
        icon: CalendarDays,
        path: ROUTES.EMPLOYEE.LEAVE.MANAGE_BALANCE,
        requiresSupervisor: true,
      },
      {
        id: 'leave-allocations',
        label: 'Leave Policies',
        icon: CalendarCheck,
        path: ROUTES.EMPLOYEE.LEAVE.ALLOCATIONS,
        requiresSupervisor: true,
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
        path: ROUTES.EMPLOYEE.HOLIDAYS,
      },
      {
        id: 'exceptional-work',
        label: 'Exceptional Work Policy',
        icon: AlertTriangle,
        path: ROUTES.EMPLOYEE.EXCEPTIONAL_WORK,
      },
    ],
  },
  {
    title: 'SETTINGS',
    defaultCollapsed: true,
    items: [
      {
        id: 'profile',
        label: 'My Profile',
        icon: Settings,
        path: ROUTES.PROFILE,
      },
    ],
  },
];
