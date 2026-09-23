/**
 * MainStackNavigator
 * Native-stack that wraps the role-based bottom tabs and hosts shared screens
 * (reachable from any tab) on top. Add shared screens here as they are ported.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppFooterNav } from '@/components/navigation/AppFooterNav';
import {
  FeeDashboardScreen,
  FeeStructuresScreen,
  FeeStructureDetailScreen,
  FeeStructureFormScreen,
  StudentFeesScreen,
  StudentFeeDetailScreen,
  StudentFeeEditScreen,
  PaymentsScreen,
  FeeAssignStudentScreen,
  StudentFeeComponentRequestsScreen,
} from '@/features/fee/screens';
import AnnouncementDetailScreen from '@/screens/shared/AnnouncementDetailScreen';
import { ParentAcademicsTaskScreen } from '@/screens/parent/ParentAcademicsScreen';
import AnnouncementsScreen from '@/screens/shared/AnnouncementsScreen';
import AnnouncementCreateScreen from '@/screens/shared/AnnouncementCreateScreen';
import AttendanceReportScreen from '@/screens/shared/attendance/AttendanceReportScreen';
import MarkAttendanceScreen from '@/screens/shared/attendance/MarkAttendanceScreen';
import ChangeEmailScreen from '@/screens/shared/ChangeEmailScreen';
import ChangePasswordScreen from '@/screens/shared/ChangePasswordScreen';
import ChangePhoneScreen from '@/screens/shared/ChangePhoneScreen';
import ClassDetailScreen from '@/screens/shared/ClassDetailScreen';
import ClassesScreen from '@/screens/shared/ClassesScreen';
import CreateClassScreen from '@/screens/shared/CreateClassScreen';
import CreateLeaveAllocationScreen from '@/screens/shared/CreateLeaveAllocationScreen';
import CreateStudentScreen from '@/screens/shared/CreateStudentScreen';
import CreateSubjectScreen from '@/screens/shared/CreateSubjectScreen';
import CreateTeacherScreen from '@/screens/shared/CreateTeacherScreen';
import EditClassScreen from '@/screens/shared/EditClassScreen';
import EditLeaveAllocationScreen from '@/screens/shared/EditLeaveAllocationScreen';
import EditStudentScreen from '@/screens/shared/EditStudentScreen';
import EditSubjectScreen from '@/screens/shared/EditSubjectScreen';
import EditTeacherScreen from '@/screens/shared/EditTeacherScreen';
import FeedbackScreen from '@/screens/shared/feedback/FeedbackScreen';
import FeedbackDetailScreen from '@/screens/shared/feedback/FeedbackDetailScreen';
import HelpSupportScreen from '@/screens/shared/HelpSupportScreen';
import HolidaysScreen from '@/screens/shared/holidays/HolidaysScreen';
import HomeworkDetailScreen from '@/screens/shared/homework/HomeworkDetailScreen';
import HomeworkListScreen from '@/screens/shared/homework/HomeworkListScreen';
import CreateHomeworkScreen from '@/screens/shared/homework/CreateHomeworkScreen';
import CreateExamSessionScreen from '@/screens/shared/exams/CreateExamSessionScreen';
import CreateExamScreen from '@/screens/shared/exams/CreateExamScreen';
import EditExamSessionScreen from '@/screens/shared/exams/EditExamSessionScreen';
import EnterMarksScreen from '@/screens/shared/exams/EnterMarksScreen';
import ExamDashboardScreen from '@/screens/shared/exams/ExamDashboardScreen';
import ExamsListScreen from '@/screens/shared/exams/ExamsListScreen';
import ExamSessionsScreen from '@/screens/shared/exams/ExamSessionsScreen';
import MarksScreen from '@/screens/shared/exams/MarksScreen';
import ExamStudentDetailScreen from '@/screens/shared/exams/StudentDetailScreen';
import EditHomeworkScreen from '@/screens/shared/homework/EditHomeworkScreen';
import ReviewScreen from '@/screens/shared/homework/ReviewScreen';
import SubmissionsScreen from '@/screens/shared/homework/SubmissionsScreen';
import NotificationsScreen from '@/screens/shared/NotificationsScreen';
import OrgPreferencesScreen from '@/screens/shared/preferences/PreferencesScreen';
import ProfileScreen from '@/screens/shared/profile/ProfileScreen';
import StudentProfileScreen from '@/screens/shared/profile/StudentProfileScreen';
import SwitchProfileScreen from '@/screens/shared/profile-switch/SwitchProfileScreen';
import SyncProfilesScreen from '@/screens/shared/profile-switch/SyncProfilesScreen';
import StudentLeaveScreen from '@/screens/shared/student/StudentLeaveScreen';
import ManageLeaveBalancesScreen from '@/screens/shared/leave/manage-balances/ManageLeaveBalancesScreen';
import AssignEntryScreen from '@/screens/shared/timetable/AssignEntryScreen';
import OverrideDayScreen from '@/screens/shared/timetable/OverrideDayScreen';
import SlotsEditorScreen from '@/screens/shared/timetable/SlotsEditorScreen';
import TeacherTimetableScreen from '@/screens/shared/timetable/TeacherTimetableScreen';
import TimetableScreen from '@/screens/shared/timetable/TimetableScreen';
import TimetableSetupScreen from '@/screens/shared/timetable/TimetableSetupScreen';
import ApplyLeaveScreen from '@/screens/shared/leave/ApplyLeaveScreen';
import LeaveAllocationsScreen from '@/screens/shared/leave/LeaveAllocationsScreen';
import LeaveApprovalsScreen from '@/screens/shared/leave/LeaveApprovalsScreen';
import MyLeaveRequestsScreen from '@/screens/shared/leave/MyLeaveRequestsScreen';
import MyTimesheetScreen from '@/screens/shared/timesheets/MyTimesheetScreen';
import TimesheetApprovalsScreen from '@/screens/shared/timesheets/TimesheetApprovalsScreen';
import StudentDetailScreen from '@/screens/shared/StudentDetailScreen';
import StudentsScreen from '@/screens/shared/StudentsScreen';
import SubjectDetailScreen from '@/screens/shared/SubjectDetailScreen';
import SubjectsScreen from '@/screens/shared/SubjectsScreen';
import TeacherDetailScreen from '@/screens/shared/TeacherDetailScreen';
import TeachersScreen from '@/screens/shared/TeachersScreen';
import StudentExamDetailScreen from '@/screens/shared/student/StudentExamDetailScreen';
import StudentHomeworkDetailScreen from '@/screens/shared/student/StudentHomeworkDetailScreen';
import ExceptionalWorkScreen from '@/screens/shared/exceptional-work/ExceptionalWorkScreen';
import OrganizationSettingsScreen from '@/screens/shared/organization/OrganizationSettingsScreen';

import { MainTabsNavigator } from './MainTabsNavigator';
import type { SharedStackParamList } from './types';

const Stack = createNativeStackNavigator<SharedStackParamList>();

type MainStackNavigatorProps = {
  role: string | null;
};

// Student and parent share one account; both get the read-only profile.
function isStudentPortalRole(role: string | null) {
  const normalized = role?.toLowerCase();
  return normalized === 'student' || normalized === 'parent';
}

function renderScreenBoundary({
  route,
  children,
}: {
  route: { name: string };
  children: React.ReactElement;
}) {
  return <ErrorBoundary label={route.name}>{children}</ErrorBoundary>;
}

export function MainStackNavigator({ role }: MainStackNavigatorProps) {
  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        screenLayout={renderScreenBoundary}
      >
        <Stack.Screen name="Tabs">
          {() => <MainTabsNavigator role={role} />}
        </Stack.Screen>
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
        <Stack.Screen
          name="AnnouncementCreate"
          component={AnnouncementCreateScreen}
        />
        <Stack.Screen
          name="AnnouncementDetail"
          component={AnnouncementDetailScreen}
        />
        <Stack.Screen name="Subjects" component={SubjectsScreen} />
        <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
        <Stack.Screen name="SubjectCreate" component={CreateSubjectScreen} />
        <Stack.Screen name="SubjectEdit" component={EditSubjectScreen} />
        <Stack.Screen name="Classes" component={ClassesScreen} />
        <Stack.Screen name="ClassDetail" component={ClassDetailScreen} />
        <Stack.Screen name="ClassCreate" component={CreateClassScreen} />
        <Stack.Screen name="ClassEdit" component={EditClassScreen} />
        <Stack.Screen name="Students" component={StudentsScreen} />
        <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
        <Stack.Screen name="StudentCreate" component={CreateStudentScreen} />
        <Stack.Screen name="StudentEdit" component={EditStudentScreen} />
        <Stack.Screen name="Teachers" component={TeachersScreen} />
        <Stack.Screen name="TeacherDetail" component={TeacherDetailScreen} />
        <Stack.Screen name="TeacherCreate" component={CreateTeacherScreen} />
        <Stack.Screen name="TeacherEdit" component={EditTeacherScreen} />
        <Stack.Screen
          name="LeaveMyRequests"
          component={MyLeaveRequestsScreen}
        />
        <Stack.Screen name="LeaveApply" component={ApplyLeaveScreen} />
        <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
        <Stack.Screen
          name="LeaveAllocations"
          component={LeaveAllocationsScreen}
        />
        <Stack.Screen
          name="LeaveAllocationCreate"
          component={CreateLeaveAllocationScreen}
        />
        <Stack.Screen
          name="LeaveAllocationEdit"
          component={EditLeaveAllocationScreen}
        />
        <Stack.Screen
          name="LeaveManageBalances"
          component={ManageLeaveBalancesScreen}
        />
        <Stack.Screen
          name="TimesheetMySubmissions"
          component={MyTimesheetScreen}
        />
        <Stack.Screen
          name="TimesheetApprovals"
          component={TimesheetApprovalsScreen}
        />
        <Stack.Screen name="Holidays" component={HolidaysScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
        <Stack.Screen name="ChangePhone" component={ChangePhoneScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="FeedbackDetail" component={FeedbackDetailScreen} />
        <Stack.Screen name="Profile">
          {() =>
            isStudentPortalRole(role) ? (
              <StudentProfileScreen />
            ) : (
              <ProfileScreen />
            )
          }
        </Stack.Screen>
        <Stack.Screen name="SwitchProfile" component={SwitchProfileScreen} />
        <Stack.Screen name="SyncProfiles" component={SyncProfilesScreen} />
        <Stack.Screen name="StudentLeave" component={StudentLeaveScreen} />
        <Stack.Screen
          name="StudentAcademicsTask"
          component={ParentAcademicsTaskScreen}
        />
        <Stack.Screen name="Preferences" component={OrgPreferencesScreen} />
        <Stack.Screen name="Timetable" component={TimetableScreen} />
        <Stack.Screen
          name="TimetableTeacher"
          component={TeacherTimetableScreen}
        />
        <Stack.Screen
          name="TimetableAssignEntry"
          component={AssignEntryScreen}
        />
        <Stack.Screen name="TimetableSetup" component={TimetableSetupScreen} />
        <Stack.Screen
          name="TimetableOverrideDay"
          component={OverrideDayScreen}
        />
        <Stack.Screen
          name="TimetableSlotsEditor"
          component={SlotsEditorScreen}
        />
        <Stack.Screen name="HomeworkList" component={HomeworkListScreen} />
        <Stack.Screen name="HomeworkDetail" component={HomeworkDetailScreen} />
        <Stack.Screen name="HomeworkCreate" component={CreateHomeworkScreen} />
        <Stack.Screen name="HomeworkEdit" component={EditHomeworkScreen} />
        <Stack.Screen
          name="HomeworkSubmissions"
          component={SubmissionsScreen}
        />
        <Stack.Screen name="HomeworkReview" component={ReviewScreen} />
        <Stack.Screen name="ExamSessions" component={ExamSessionsScreen} />
        <Stack.Screen
          name="ExamCreateSession"
          component={CreateExamSessionScreen}
        />
        <Stack.Screen
          name="ExamEditSession"
          component={EditExamSessionScreen}
        />
        <Stack.Screen name="ExamDashboard" component={ExamDashboardScreen} />
        <Stack.Screen name="ExamsList" component={ExamsListScreen} />
        <Stack.Screen name="ExamCreate" component={CreateExamScreen} />
        <Stack.Screen name="ExamEnterMarks" component={EnterMarksScreen} />
        <Stack.Screen name="ExamMarks" component={MarksScreen} />
        <Stack.Screen
          name="ExamStudentDetail"
          component={ExamStudentDetailScreen}
        />
        <Stack.Screen
          name="AttendanceReport"
          component={AttendanceReportScreen}
        />
        <Stack.Screen name="AttendanceMark" component={MarkAttendanceScreen} />
        <Stack.Screen name="FeeDashboard" component={FeeDashboardScreen} />
        <Stack.Screen name="FeeStructures" component={FeeStructuresScreen} />
        <Stack.Screen
          name="FeeStructureDetail"
          component={FeeStructureDetailScreen}
        />
        <Stack.Screen
          name="FeeStructureForm"
          component={FeeStructureFormScreen}
        />
        <Stack.Screen
          name="FeeAssignStudent"
          component={FeeAssignStudentScreen}
        />
        <Stack.Screen name="FeePayments" component={PaymentsScreen} />
        <Stack.Screen name="FeeStudentFees" component={StudentFeesScreen} />
        <Stack.Screen
          name="FeeStudentDetail"
          component={StudentFeeDetailScreen}
        />
        <Stack.Screen name="FeeStudentEdit" component={StudentFeeEditScreen} />
        <Stack.Screen
          name="FeeComponentRequests"
          component={StudentFeeComponentRequestsScreen}
        />
        <Stack.Screen
          name="StudentExamDetail"
          component={StudentExamDetailScreen}
        />
        <Stack.Screen
          name="StudentHomeworkDetail"
          component={StudentHomeworkDetailScreen}
        />
        <Stack.Screen
          name="ExceptionalWork"
          component={ExceptionalWorkScreen}
        />
        <Stack.Screen
          name="Organization"
          component={OrganizationSettingsScreen}
        />
      </Stack.Navigator>
      <AppFooterNav role={role} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
