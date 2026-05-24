/**
 * Management Screen - Organization data management (Employee/Teacher View)
 * Thin wrapper over ManagementScreenBase with employee-specific routes.
 * Teachers: View-only access (permission checks handled by backend/shared screens)
 */

import type { ManagementItem } from '@/components/screens/ManagementScreenBase';
import {
  ManagementScreenBase,
  UserCheck,
  Building2,
  GraduationCap,
  BookMarked,
  Calendar,
  ClipboardList,
} from '@/components/screens/ManagementScreenBase';

const employeeItems: ManagementItem[] = [
  {
    id: 'teachers',
    title: 'Teachers',
    subtitle: 'Teaching staff',
    icon: UserCheck,
    gradient: ['#7c3aed', '#a78bfa'],
    route: '/(shared-screens)/teachers',
  },
  {
    id: 'classes',
    title: 'Classes',
    subtitle: 'Class sections',
    icon: Building2,
    gradient: ['#0891b2', '#22d3ee'],
    route: '/(shared-screens)/classes',
  },
  {
    id: 'students',
    title: 'Students',
    subtitle: 'Student records',
    icon: GraduationCap,
    gradient: ['#ea580c', '#fb923c'],
    route: '/(shared-screens)/students',
  },
  {
    id: 'subjects',
    title: 'Subjects',
    subtitle: 'Subjects & curriculum',
    icon: BookMarked,
    gradient: ['#059669', '#34d399'],
    route: '/(shared-screens)/subjects',
  },
  {
    id: 'timetable',
    title: 'Timetable',
    subtitle: 'Class schedules',
    icon: Calendar,
    gradient: ['#6366f1', '#818cf8'],
    route: '/(shared-screens)/timetable',
  },
  {
    id: 'exams',
    title: 'Exams',
    subtitle: 'Exams & marks',
    icon: ClipboardList,
    gradient: ['#e11d48', '#fb7185'],
    route: '/(shared-screens)/exams/sessions',
  },
];

export default function ManagementScreen() {
  return <ManagementScreenBase items={employeeItems} settingsRoute="/(tabs)/(employee)/settings" />;
}
