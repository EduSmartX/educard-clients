/**
 * My Work Screen - Personal tasks & activities (Admin)
 */

import type { WorkItem } from '@/components/screens/MyWorkScreenBase';
import {
  MyWorkScreenBase,
  FileText,
  Clock,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
} from '@/components/screens/MyWorkScreenBase';

const workItems: WorkItem[] = [
  {
    id: 'homework',
    title: 'Homework',
    subtitle: 'Manage daily assignments',
    icon: FileText,
    gradient: ['#7c3aed', '#a78bfa'],
    route: '/(shared-screens)/homework',
  },
  {
    id: 'my-timesheet',
    title: 'My Timesheet',
    subtitle: 'Submit your attendance',
    icon: Clock,
    gradient: ['#f59e0b', '#fcd34d'],
    route: '/(shared-screens)/timesheets/my-submissions',
  },
  {
    id: 'my-leaves',
    title: 'My Leaves',
    subtitle: 'View & apply for leave',
    icon: CalendarDays,
    gradient: ['#10b981', '#6ee7b7'],
    route: '/(shared-screens)/leave/my-requests',
  },
  {
    id: 'mark-attendance',
    title: 'Mark Attendance',
    subtitle: 'Student attendance',
    icon: ClipboardCheck,
    gradient: ['#0d9488', '#2dd4bf'],
    route: '/(shared-screens)/attendance/mark',
  },
  {
    id: 'enter-marks',
    title: 'Enter Marks',
    subtitle: 'Exam marks entry',
    icon: GraduationCap,
    gradient: ['#e11d48', '#fb7185'],
    route: '/(shared-screens)/exams/sessions',
  },
  {
    id: 'attendance-reports',
    title: 'Attendance Reports',
    subtitle: 'View summaries',
    icon: BarChart3,
    gradient: ['#0891b2', '#22d3ee'],
    route: '/(shared-screens)/attendance',
  },
];

export default function MyWorkScreen() {
  return <MyWorkScreenBase items={workItems} settingsRoute="/(tabs)/(admin)/settings" />;
}
