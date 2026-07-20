/**
 * Shared Screens Stack Layout
 * Stack navigator for screens accessible by both Admin and Teacher roles
 */

import { Stack } from 'expo-router';

export default function SharedScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* Teachers */}
      <Stack.Screen name="teachers/index" />
      <Stack.Screen name="teachers/create" />
      <Stack.Screen name="teachers/[id]" />
      <Stack.Screen name="teachers/edit" />
      {/* Students */}
      <Stack.Screen name="students/index" />
      <Stack.Screen name="students/create" />
      <Stack.Screen name="students/[id]" />
      <Stack.Screen name="students/edit" />
      {/* Classes */}
      <Stack.Screen name="classes/index" />
      <Stack.Screen name="classes/create" />
      <Stack.Screen name="classes/[id]" />
      <Stack.Screen name="classes/edit" />
      {/* Subjects */}
      <Stack.Screen name="subjects/index" />
      <Stack.Screen name="subjects/create" />
      <Stack.Screen name="subjects/[id]" />
      <Stack.Screen name="subjects/edit" />
      {/* Leave Management */}
      <Stack.Screen name="leave/my-requests" />
      <Stack.Screen name="leave/allocations" />
      <Stack.Screen name="leave/approvals" />
      <Stack.Screen name="leave/apply" />
      <Stack.Screen name="leave/create" />
      <Stack.Screen name="leave/edit" />
      {/* Holidays */}
      <Stack.Screen name="holidays/index" />
      {/* Organization Preferences */}
      <Stack.Screen name="preferences/index" />
      {/* Timesheets */}
      <Stack.Screen name="timesheets/my-submissions" />
      <Stack.Screen name="timesheets/approvals" />
      {/* Attendance */}
      <Stack.Screen name="attendance/index" />
      <Stack.Screen name="attendance/mark" />
      {/* Timetable */}
      <Stack.Screen name="timetable/index" />
      <Stack.Screen name="timetable/setup" />
      <Stack.Screen name="timetable/slots-editor" />
      <Stack.Screen name="timetable/assign-entry" />
      {/* Exams */}
      <Stack.Screen name="exams/sessions" />
      <Stack.Screen name="exams/create-session" />
      <Stack.Screen name="exams/dashboard" />
      <Stack.Screen name="exams/create-exam" />
      <Stack.Screen name="exams/student-detail" />
      <Stack.Screen name="exams/enter-marks" />
      <Stack.Screen name="exams/exams-list" />
      <Stack.Screen name="exams/marks" />
      {/* Homework */}
      <Stack.Screen name="homework" />
      {/* Student Portal Screens */}
      <Stack.Screen name="student/homework-detail" />
      <Stack.Screen name="student/exam-detail" />
      {/* Profile */}
      <Stack.Screen name="profile/index" />
    </Stack>
  );
}
