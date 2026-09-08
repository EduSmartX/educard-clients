export type UserRole = 'admin' | 'employee' | 'parent';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ProfileSummary } from '@/api/auth';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ForcePasswordChange: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  VerifyOtp: { email?: string } | undefined;
  ResetPassword: { email?: string; otp?: string } | undefined;
  ProfileSelect: { selectionToken: string; profiles: ProfileSummary[] };
};

export type MainTabParamList = {
  AdminHome: undefined;
  EmployeeHome: undefined;
  ParentHome: undefined;
};

// Admin and employee share the same visible tab set.
export type AdminTabParamList = {
  Dashboard: undefined;
  Management: undefined;
  MyWork: undefined;
  Admin: undefined;
  Settings: undefined;
};

export type EmployeeTabParamList = AdminTabParamList;

export type ParentTabParamList = {
  Dashboard: undefined;
  Academics: undefined;
  Attendance: undefined;
  Fees: undefined;
  Settings: undefined;
};

/**
 * Shared native-stack that wraps the role tabs. The first screen ("Tabs") hosts
 * the role-based bottom tabs; the remaining routes are shared screens pushed on
 * top (reachable from any tab). Add new shared routes here as they are ported.
 */
export type SharedStackParamList = {
  Tabs: undefined;
  Notifications: undefined;
  NotificationInbox: undefined;
  Announcements: undefined;
  AnnouncementCreate: undefined;
  AnnouncementDetail: { publicId: string };
  Subjects: { class_id?: string; class_name?: string } | undefined;
  SubjectDetail: { id: string; is_deleted?: string };
  SubjectCreate: undefined;
  SubjectEdit: { id: string };
  Classes: undefined;
  ClassDetail: { id: string; is_deleted?: string };
  ClassCreate: undefined;
  ClassEdit: { id: string };
  Students: { class_id?: string; class_name?: string } | undefined;
  StudentDetail: { id: string; is_deleted?: string };
  StudentCreate: undefined;
  StudentEdit: { id: string };
  Teachers: undefined;
  TeacherDetail: { id: string; is_deleted?: string; thumbnail?: string };
  TeacherCreate: undefined;
  TeacherEdit: { id: string };
  LeaveMyRequests: undefined;
  LeaveApply: undefined;
  LeaveApprovals: undefined;
  LeaveAllocations: undefined;
  LeaveAllocationCreate: undefined;
  LeaveAllocationEdit: { id: string };
  LeaveManageBalances: undefined;
  TimesheetMySubmissions: undefined;
  TimesheetApprovals: undefined;
  Holidays: undefined;
  ChangeEmail: { mode?: string; from?: string } | undefined;
  ChangePhone: { mode?: string; from?: string } | undefined;
  ChangePassword: undefined;
  HelpSupport: undefined;
  Feedback: undefined;
  FeedbackDetail: { id: string };
  Profile: undefined;
  SwitchProfile: undefined;
  SyncProfiles: undefined;
  StudentLeave: undefined;
  StudentAcademicsTask: {
    task: 'timetable' | 'homework' | 'exams' | 'marks';
  };
  Organization: undefined;
  Preferences: undefined;
  Timetable: { classId?: string } | undefined;
  TimetableTeacher: undefined;
  TimetableAssignEntry: {
    slotId: string;
    dayOfWeek: string;
    classId: string;
    entryId?: string;
    subjectId?: string;
    slotLabel?: string;
    className?: string;
  };
  TimetableSetup: { classId?: string } | undefined;
  TimetableOverrideDay: { classId?: string } | undefined;
  TimetableSlotsEditor: { groupId: string; groupName: string };
  HomeworkList: undefined;
  HomeworkDetail: { id: string };
  HomeworkCreate:
    | { class?: string; date?: string; subject?: string }
    | undefined;
  HomeworkEdit: { id: string };
  HomeworkSubmissions: { homework_id: string };
  HomeworkReview: {
    homework_id: string;
    submission_id: string;
    index?: string;
    total?: string;
  };
  ExamSessions: undefined;
  ExamDashboard: { sessionId: string; sessionName?: string };
  ExamCreateSession: undefined;
  ExamEditSession: { sessionId: string };
  ExamsList: { sessionId: string; sessionName?: string };
  ExamCreate: { sessionId?: string } | undefined;
  ExamEnterMarks: {
    examId: string;
    sessionId: string;
    classId: string;
    subjectName?: string;
    className?: string;
    maxMarks?: string;
    viewOnly?: string;
  };
  ExamMarks: {
    sessionId: string;
    classId?: string;
    className?: string;
    examId?: string;
    examName?: string;
    sessionName?: string;
  };
  ExamStudentDetail: {
    studentId: string;
    sessionId: string;
    classId: string;
    studentName?: string;
  };
  AttendanceReport: undefined;
  AttendanceMark: undefined;
  FeeDashboard: undefined;
  FeeStructures: undefined;
  FeeStructureDetail: { id: string };
  FeeStructureForm: { id?: string } | undefined;
  FeeAssignStudent:
    | {
        class_id?: string;
        class_public_id?: string;
        student_id?: string;
        structure_id?: string;
      }
    | undefined;
  FeePayments: { highlight?: string } | undefined;
  FeeStudentFees:
    | { fee_structure_public_id?: string; class_public_id?: string }
    | undefined;
  FeeStudentDetail: { id: string };
  FeeStudentEdit: { id: string };
  FeeComponentRequests: undefined;
  StudentExamDetail: { id: string; mode?: string };
  StudentHomeworkDetail: { id: string; date?: string };
  ExceptionalWork: undefined;
};

/** Navigation prop for a tab screen that can also reach shared-stack routes. */
export type AdminTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList>,
  NativeStackNavigationProp<SharedStackParamList>
>;

export type EmployeeTabNavigation = AdminTabNavigation;

export type ParentTabNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<ParentTabParamList>,
  NativeStackNavigationProp<SharedStackParamList>
>;

export type SharedStackNavigation =
  NativeStackNavigationProp<SharedStackParamList>;
