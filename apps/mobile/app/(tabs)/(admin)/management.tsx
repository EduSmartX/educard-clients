/**
 * Management Screen - Organization data management (Admin)
 * Thin wrapper over ManagementScreenBase with admin-specific routes.
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

const adminItems: ManagementItem[] = [
  {
    id: 'teachers',
    title: 'Teachers',
    subtitle: 'Manage teaching staff',
    icon: UserCheck,
    gradient: ['#7c3aed', '#a78bfa'],
    route: '/(tabs)/(admin)/teachers',
  },
  {
    id: 'classes',
    title: 'Classes',
    subtitle: 'Manage class sections',
    icon: Building2,
    gradient: ['#0891b2', '#22d3ee'],
    route: '/(tabs)/(admin)/classes',
  },
  {
    id: 'students',
    title: 'Students',
    subtitle: 'Student records',
    icon: GraduationCap,
    gradient: ['#ea580c', '#fb923c'],
    route: '/(tabs)/(admin)/students',
  },
  {
    id: 'subjects',
    title: 'Subjects',
    subtitle: 'Subjects & curriculum',
    icon: BookMarked,
    gradient: ['#059669', '#34d399'],
    route: '/(tabs)/(admin)/subjects',
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
  return <ManagementScreenBase items={adminItems} settingsRoute="/(tabs)/(admin)/settings" />;
}
