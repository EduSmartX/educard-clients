/**
 * Shared config for the student Academics menu and its task screens.
 */

import { Award, BookOpen, Calendar, FileText } from 'lucide-react-native';

export type Tab = 'timetable' | 'homework' | 'exams' | 'marks';

export const TABS: { key: Tab; label: string; icon: typeof Calendar }[] = [
  { key: 'timetable', label: 'Timetable', icon: Calendar },
  { key: 'homework', label: 'Homework', icon: BookOpen },
  { key: 'exams', label: 'Exams', icon: FileText },
  { key: 'marks', label: 'Marks', icon: Award },
];

export const ACADEMIC_GRADIENTS: Record<Tab, readonly [string, string]> = {
  timetable: ['#6366f1', '#818cf8'],
  homework: ['#ea580c', '#fb923c'],
  exams: ['#e11d48', '#fb7185'],
  marks: ['#0d9488', '#2dd4bf'],
};

export const ACADEMIC_SUBTITLES: Record<Tab, string> = {
  timetable: 'Daily class schedule',
  homework: 'Assignments and submissions',
  exams: 'Schedules and results',
  marks: 'Subject-wise performance',
};
