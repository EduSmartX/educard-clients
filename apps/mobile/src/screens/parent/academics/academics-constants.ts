/**
 * Shared config for the student Academics menu and its task screens.
 */

import { BookOpen, Calendar, FileText } from 'lucide-react-native';

export type Tab = 'timetable' | 'homework' | 'exams';

export const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'timetable', label: 'Timetable', icon: Calendar },
  { key: 'homework', label: 'Homework', icon: BookOpen },
  { key: 'exams', label: 'Exams', icon: FileText },
];

export const ACADEMIC_GRADIENTS: Record<Tab, readonly [string, string]> = {
  timetable: ['#6366f1', '#818cf8'],
  homework: ['#ea580c', '#fb923c'],
  exams: ['#e11d48', '#fb7185'],
};

export const ACADEMIC_SUBTITLES: Record<Tab, string> = {
  timetable: 'Daily class schedule',
  homework: 'Assignments and submissions',
  exams: 'Schedules and results',
};
