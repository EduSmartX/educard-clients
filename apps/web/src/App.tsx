import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './constants/app-config';

// Lazy load pages for better performance
import { lazy, Suspense } from 'react';
import { PageLoader } from './components/ui/loading-spinner';

// Protected Layout - Renders header once for all authenticated pages
import { ProtectedLayout } from './components/layout/protected-layout';

// Public pages
const HomePage = lazy(() => import('./pages/home-page'));

// Auth pages
const LoginPage = lazy(() => import('./features/auth/pages/login-page'));
const SignupPage = lazy(() => import('./features/auth/pages/signup-page'));
const RegistrationSuccessPage = lazy(
  () => import('./features/auth/pages/registration-success-page')
);
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/forgot-password-page'));
const VerifyEmailPage = lazy(() => import('./pages/verify-email-page'));
const OrganizationNotApprovedPage = lazy(
  () => import('./features/auth/pages/organization-not-approved-page')
);

// Role-based route guards
const AdminRoute = lazy(() =>
  import('./components/guards/role-guards').then((m) => ({ default: m.AdminRoute }))
);
const EmployeeRoute = lazy(() =>
  import('./components/guards/role-guards').then((m) => ({ default: m.EmployeeRoute }))
);
const ParentRoute = lazy(() =>
  import('./components/guards/role-guards').then((m) => ({ default: m.ParentRoute }))
);

// Role-specific dashboards
const AdminDashboardPage = lazy(
  () => import('./features/admin/dashboard/pages/admin-dashboard-page')
);
const EmployeeDashboardPage = lazy(
  () => import('./features/employee/dashboard/pages/employee-dashboard-page')
);
const EmployeeTeachersPage = lazy(() => import('./features/employee/pages/employee-teachers-page'));
const EmployeeClassesPage = lazy(() => import('./features/employee/pages/employee-classes-page'));
const ParentDashboardPage = lazy(
  () => import('./features/parent/dashboard/pages/parent-dashboard-page')
);

// Student pages
const StudentsListPage = lazy(() => import('./features/students/pages/students-list-page'));
const StudentFormPage = lazy(() => import('./features/students/pages/student-form-page'));

// Teachers pages
const TeachersPage = lazy(() =>
  import('./features/teachers/pages').then((m) => ({ default: m.TeachersPage }))
);
const TeacherFormPage = lazy(() => import('./features/teachers/pages/teacher-form-page'));

// Classes pages
const ClassesPage = lazy(() =>
  import('./features/classes/pages').then((m) => ({ default: m.ClassesPage }))
);
const ClassFormPage = lazy(() => import('./features/classes/pages/class-form-page'));

// Organization pages
const OrganizationSettingsPage = lazy(() =>
  import('./features/organizations/pages/organization-settings-page').then((m) => ({
    default: m.default,
  }))
);

// Subjects pages
const SubjectsPage = lazy(() =>
  import('./features/subjects/pages').then((m) => ({ default: m.SubjectsPage }))
);
const SubjectFormPage = lazy(() => import('./features/subjects/pages/subject-form-page'));

// Leave management - Unified page with layout
const LeaveLayout = lazy(() =>
  import('./features/leave/layouts/leave-layout').then((m) => ({ default: m.LeaveLayout }))
);
const LeaveAllocationsPage = lazy(() => import('./features/leave/pages/leave-allocations-page'));
const LeaveDashboardPage = lazy(() => import('./features/leave/pages/leave-dashboard-page'));
const LeaveRequestFormPage = lazy(() => import('./features/leave/pages/leave-request-form-page'));
const LeaveRequestReviewsPage = lazy(
  () => import('./features/leave/pages/leave-request-reviews-page')
);
const ManageLeaveBalances = lazy(() => import('./features/leave/components/manage-leave-balances'));

// Attendance pages
const MarkAttendancePage = lazy(() =>
  import('./features/attendance/pages/mark-attendance-page').then((m) => ({
    default: m.MarkAttendancePage,
  }))
);
const AttendanceSummaryPage = lazy(() =>
  import('./features/attendance/pages/attendance-summary-page').then((m) => ({
    default: m.AttendanceSummaryPage,
  }))
);
const MonthlyAttendanceReportPage = lazy(() =>
  import('./features/attendance/pages/monthly-report-page').then((m) => ({
    default: m.MonthlyAttendanceReportPage,
  }))
);
const AttendanceReportPage = lazy(() =>
  import('./features/attendance/pages/attendance-report-page').then((m) => ({
    default: m.AttendanceReportPage,
  }))
);
const EmployeeTimesheetPage = lazy(() =>
  import('./features/attendance/pages/employee-timesheet-page').then((m) => ({
    default: m.EmployeeTimesheetPage,
  }))
);
const EmployeeTimesheetSubmitPage = lazy(() =>
  import('./features/attendance/pages/employee-timesheet-submit-page').then((m) => ({
    default: m.EmployeeTimesheetSubmitPage,
  }))
);
const TimesheetApprovalsPage = lazy(
  () => import('./features/attendance/pages/timesheet-approvals-page')
);

// Exams & Marks
const ExamSessionsPage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.ExamSessionsPage }))
);
const ExamsListPage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.ExamsListPage }))
);
const ExamOverviewPage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.ExamOverviewPage }))
);
const ExamSessionFormPage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.ExamSessionFormPage }))
);
const ExamFormPage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.ExamFormPage }))
);
const BulkExamCreatePage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.BulkExamCreatePage }))
);
const MarksOverviewPage = lazy(() =>
  import('./features/exams/pages').then((m) => ({ default: m.MarksOverviewPage }))
);

// Preferences
const PreferencesPage = lazy(() => import('./features/preferences/pages/preferences-page'));

// Holidays
const HolidayCalendarPage = lazy(() => import('./pages/holidays-page'));

// Exceptional Work Policy
const ExceptionalWorkPage = lazy(() => import('./pages/exceptional-work-page'));

// Timetable
const ClassTimetablePage = lazy(() => import('./features/timetable/pages/class-timetable-page'));
const TimetableSetupPage = lazy(() => import('./features/timetable/pages/timetable-setup-page'));

// Profile
const ProfilePage = lazy(() => import('./features/profile/pages/profile-page'));

// Coming Soon
const ComingSoonPage = lazy(() => import('./pages/coming-soon-page'));

function App() {
  return (
    <div className="bg-background min-h-screen font-sans antialiased">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.AUTH.SIGNUP} element={<SignupPage />} />
          <Route path={ROUTES.AUTH.REGISTRATION_SUCCESS} element={<RegistrationSuccessPage />} />
          <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.AUTH.VERIFY_EMAIL} element={<VerifyEmailPage />} />
          {/* Backward compatibility: redirect /verify-email to /auth/verify-email */}
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path={ROUTES.AUTH.ORGANIZATION_NOT_APPROVED}
            element={<OrganizationNotApprovedPage />}
          />

          {/* Protected Routes - Header rendered once in ProtectedLayout */}
          <Route element={<ProtectedLayout />}>
            {/* Role-based Dashboard Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="dashboard" element={<AdminDashboardPage />} />
            </Route>

            <Route path="/employee" element={<EmployeeRoute />}>
              <Route path="dashboard" element={<EmployeeDashboardPage />} />
              <Route path="holidays" element={<HolidayCalendarPage />} />
              <Route path="exceptional-work" element={<ExceptionalWorkPage />} />
              <Route path="teachers" element={<EmployeeTeachersPage />} />
              <Route path="teachers/:id" element={<TeacherFormPage />} />
              <Route path="classes-list" element={<EmployeeClassesPage />} />

              {/* Employee Attendance Management */}
              <Route path="attendance/mark" element={<MarkAttendancePage />} />
              <Route path="attendance/summary" element={<AttendanceSummaryPage />} />
              <Route path="attendance/report" element={<AttendanceReportPage />} />
              <Route path="attendance/monthly" element={<MonthlyAttendanceReportPage />} />
              <Route path="attendance/timesheet" element={<EmployeeTimesheetPage />} />
              <Route path="attendance/submit" element={<EmployeeTimesheetSubmitPage />} />
              <Route path="attendance/approvals" element={<TimesheetApprovalsPage />} />

              {/* Employee Leave Management */}
              <Route path="leave/dashboard" element={<LeaveDashboardPage />} />
              <Route path="leave/reviews" element={<LeaveRequestReviewsPage />} />
              <Route path="leave/allocations" element={<LeaveAllocationsPage />} />
              <Route path="leave/manage-balance" element={<ManageLeaveBalances />} />
            </Route>

            <Route path="/parent" element={<ParentRoute />}>
              <Route path="dashboard" element={<ParentDashboardPage />} />
            </Route>

            {/* Students */}
            <Route path={ROUTES.STUDENTS} element={<StudentsListPage />} />
            <Route path={ROUTES.STUDENTS_NEW} element={<StudentFormPage />} />
            <Route path={ROUTES.STUDENTS_VIEW} element={<StudentFormPage />} />
            <Route path={ROUTES.STUDENTS_EDIT} element={<StudentFormPage />} />

            {/* Teachers */}
            <Route path={ROUTES.TEACHERS} element={<TeachersPage />} />
            <Route path={ROUTES.TEACHERS_NEW} element={<TeacherFormPage />} />
            <Route path={ROUTES.TEACHERS_VIEW} element={<TeacherFormPage />} />
            <Route path={ROUTES.TEACHERS_EDIT} element={<TeacherFormPage />} />

            {/* Classes */}
            <Route path={ROUTES.CLASSES} element={<ClassesPage />} />
            <Route path={ROUTES.CLASSES_NEW} element={<ClassFormPage />} />
            <Route path={ROUTES.CLASSES_VIEW} element={<ClassFormPage />} />
            <Route path={ROUTES.CLASSES_EDIT} element={<ClassFormPage />} />

            {/* Subjects */}
            <Route path={ROUTES.SUBJECTS} element={<SubjectsPage />} />
            <Route path={ROUTES.SUBJECTS_NEW} element={<SubjectFormPage />} />
            <Route path={ROUTES.SUBJECTS_VIEW} element={<SubjectFormPage />} />
            <Route path={ROUTES.SUBJECTS_EDIT} element={<SubjectFormPage />} />

            {/* Exams & Marks */}
            <Route path={ROUTES.EXAMS} element={<ExamSessionsPage />} />
            <Route path={ROUTES.EXAMS_OVERVIEW} element={<ExamOverviewPage />} />
            <Route path={ROUTES.EXAMS_LIST} element={<ExamsListPage />} />
            <Route path={ROUTES.EXAM_SESSIONS_NEW} element={<ExamSessionFormPage />} />
            <Route path={ROUTES.EXAM_SESSIONS_VIEW} element={<ExamSessionFormPage />} />
            <Route path={ROUTES.EXAM_SESSIONS_EDIT} element={<ExamSessionFormPage />} />
            <Route path={ROUTES.EXAMS_NEW} element={<ExamFormPage />} />
            <Route path={ROUTES.EXAMS_BULK_CREATE} element={<BulkExamCreatePage />} />
            <Route path={ROUTES.EXAMS_VIEW} element={<ExamFormPage />} />
            <Route path={ROUTES.EXAMS_EDIT} element={<ExamFormPage />} />
            <Route path={ROUTES.MARKS_OVERVIEW} element={<MarksOverviewPage />} />

            {/* Organization Preferences */}
            <Route path={ROUTES.PREFERENCES} element={<PreferencesPage />} />

            {/* Organization Settings */}
            <Route path={ROUTES.ORGANIZATION} element={<OrganizationSettingsPage />} />

            {/* Holiday Calendar */}
            <Route path={ROUTES.HOLIDAYS} element={<HolidayCalendarPage />} />

            {/* Exceptional Work Policy */}
            <Route path={ROUTES.EXCEPTIONAL_WORK} element={<ExceptionalWorkPage />} />

            {/* Timetable */}
            <Route path={ROUTES.TIMETABLE} element={<ClassTimetablePage />} />
            <Route path={ROUTES.TIMETABLE_SETUP} element={<TimetableSetupPage />} />

            {/* Profile */}
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

            {/* Calendar - Coming Soon */}
            <Route
              path={ROUTES.CALENDAR}
              element={
                <ComingSoonPage
                  title="Calendar"
                  description="Calendar feature is currently under development and will be available soon."
                />
              }
            />

            {/* Analytics - Coming Soon */}
            <Route
              path={ROUTES.ANALYTICS}
              element={
                <ComingSoonPage
                  title="Analytics"
                  description="Analytics feature is currently under development and will be available soon."
                />
              }
            />

            {/* Attendance */}
            <Route path="/attendance/mark" element={<MarkAttendancePage />} />
            <Route path="/attendance/summary" element={<AttendanceSummaryPage />} />
            <Route path="/attendance/report" element={<AttendanceReportPage />} />
            <Route path="/attendance/monthly" element={<MonthlyAttendanceReportPage />} />
            <Route path={ROUTES.ATTENDANCE.TIMESHEET} element={<EmployeeTimesheetPage />} />
            <Route
              path={ROUTES.ATTENDANCE.TIMESHEET_SUBMIT}
              element={<EmployeeTimesheetSubmitPage />}
            />
            <Route
              path={ROUTES.ATTENDANCE.TIMESHEET_APPROVALS}
              element={<TimesheetApprovalsPage />}
            />

            {/* Leave Management (with nested layout) */}
            <Route element={<LeaveLayout />}>
              <Route path={ROUTES.LEAVE.ALLOCATIONS} element={<LeaveAllocationsPage />} />
              <Route
                path={`${ROUTES.LEAVE.ALLOCATIONS}/create`}
                element={<LeaveAllocationsPage />}
              />
              <Route path={`${ROUTES.LEAVE.ALLOCATIONS}/:id`} element={<LeaveAllocationsPage />} />
              <Route
                path={`${ROUTES.LEAVE.ALLOCATIONS}/:id/edit`}
                element={<LeaveAllocationsPage />}
              />
            </Route>

            {/* Leave Dashboard & Requests (outside nested layout) */}
            <Route path={ROUTES.LEAVE.DASHBOARD} element={<LeaveDashboardPage />} />
            <Route path="/leave/dashboard/:userId" element={<LeaveDashboardPage />} />
            <Route path={ROUTES.LEAVE.REVIEWS} element={<LeaveRequestReviewsPage />} />
            <Route path={ROUTES.LEAVE.BALANCES} element={<ManageLeaveBalances />} />
            <Route path="/leave/requests/new" element={<LeaveRequestFormPage />} />
            <Route path="/leave/requests/:id" element={<LeaveRequestFormPage />} />
            <Route path="/leave/requests/:id/edit" element={<LeaveRequestFormPage />} />
          </Route>

          {/* 404 - Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

// Simple 404 component
function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <a href="/" className="text-primary mt-4 inline-block hover:underline">
          Go to Home
        </a>
      </div>
    </div>
  );
}

export default App;
