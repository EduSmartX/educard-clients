import type { SharedStackParamList } from './types';

/**
 * Screens reachable from menus, panels and dashboards without required params.
 * `Settings` is a bottom-tab; the rest are shared-stack screens. Used to type
 * menu-item configs so navigation targets are checked at compile time.
 */
export type MenuTarget =
  | 'Settings'
  | 'Subjects'
  | 'Classes'
  | 'Students'
  | 'Teachers'
  | 'Announcements'
  | 'LeaveMyRequests'
  | 'LeaveApply'
  | 'LeaveApprovals'
  | 'LeaveAllocations'
  | 'LeaveManageBalances'
  | 'TimesheetMySubmissions'
  | 'TimesheetApprovals'
  | 'Holidays'
  | 'ChangePassword'
  | 'ChangeEmail'
  | 'ChangePhone'
  | 'HelpSupport'
  | 'Profile'
  | 'Preferences'
  | 'Timetable'
  | 'TimetableTeacher'
  | 'HomeworkList'
  | 'ExamSessions'
  | 'AttendanceReport'
  | 'AttendanceMark'
  | 'FeeDashboard'
  | 'FeeComponentRequests'
  | 'Organization'
  | 'ExceptionalWork';

// Compile-time guard: every non-tab MenuTarget must be a registered shared screen.
type SharedMenuTarget = Exclude<MenuTarget, 'Settings'>;
type AssertMenuTargets = SharedMenuTarget extends keyof SharedStackParamList
  ? true
  : never;
export type { AssertMenuTargets };

/** Minimal navigation shape — satisfied by every composite tab and stack navigator. */
type Navigable = { navigate: (...args: never[]) => void };

/**
 * Navigate to a param-less menu target. React Navigation's typed `navigate()`
 * cannot resolve a union of screen names passed as a single argument, so the
 * one required assertion is centralized here; `target` stays type-checked at
 * every call site.
 */
export function navigateToScreen(
  navigation: Navigable,
  target: MenuTarget,
): void {
  navigation.navigate(target as never);
}
