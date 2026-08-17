// App Configuration
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'EduCard';
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME || 'EduCard';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const MAX_PAGE_SIZE = 100;

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy hh:mm a';
export const TIME_FORMAT = 'hh:mm a';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Query Keys
export const QUERY_KEYS = {
  // Auth
  auth: {
    user: ['auth', 'user'],
    profile: ['auth', 'profile'],
  },
  // Students
  students: {
    all: ['students'],
    list: (filters?: unknown) => ['students', 'list', filters],
    detail: (id: string | number) => ['students', 'detail', id],
    deleted: (filters?: unknown) => ['students', 'deleted', filters],
  },
  // Teachers
  teachers: {
    all: ['teachers'],
    list: (filters?: unknown) => ['teachers', 'list', filters],
    detail: (id: string | number) => ['teachers', 'detail', id],
    deleted: (filters?: unknown) => ['teachers', 'deleted', filters],
  },
  // Classes
  classes: {
    all: ['classes'],
    list: (filters?: unknown) => ['classes', 'list', filters],
    detail: (id: string | number) => ['classes', 'detail', id],
    core: ['classes', 'core'],
  },
  // Subjects
  subjects: {
    all: ['subjects'],
    list: (filters?: unknown) => ['subjects', 'list', filters],
    detail: (id: string | number) => ['subjects', 'detail', id],
    core: ['subjects', 'core'],
  },
  // Exams
  exams: {
    sessions: (filters?: unknown) => ['exam-sessions', filters],
    session: (id: string) => ['exam-session', id],
    all: (filters?: unknown) => ['exams', filters],
    detail: (id: string) => ['exam', id],
    subjects: (filters?: unknown) => ['exam-subjects', filters],
    marks: (filters?: unknown) => ['marks', filters],
  },
  // Attendance
  attendance: {
    student: (filters?: unknown) => ['attendance', 'student', filters],
    staff: (filters?: unknown) => ['attendance', 'staff', filters],
    my: (filters?: unknown) => ['attendance', 'my', filters],
    exceptions: (filters?: unknown) => ['attendance', 'exceptions', filters],
  },
  // Calendar Exceptions
  calendarExceptions: {
    list: (filters?: unknown) => ['calendar-exceptions', 'list', filters],
    detail: (id: string) => ['calendar-exception', id],
  },
  // Leave
  leave: {
    all: ['leave'],
    requests: (filters?: unknown) => ['leave-requests', filters],
    request: (id: string) => ['leave-request', id],
    myRequests: (filters?: unknown) => ['leave', 'my-requests', filters],
    reviews: (filters?: unknown) => ['leave-request-reviews', filters],
    balance: (userId?: string | number) => ['leave', 'balance', userId],
    balances: (filters?: unknown) => ['leave-balances', filters],
    userBalances: (userId?: string | number) => ['user-leave-balances', userId],
    allocations: (filters?: unknown) => ['leave-allocations', filters],
    userAllocations: (userId?: string | number) => ['user-leave-allocations', userId],
    types: ['leave-types'],
    teacherContext: ['leave', 'teacher-context'],
  },
  // Users & Classes (for leave management)
  users: {
    manageable: (userRole?: string) => ['manageable-users', userRole],
  },
  classesForLeave: {
    forReviews: (userRole?: string, isAdmin?: boolean, context?: unknown) => [
      'classes-list-for-reviews',
      userRole,
      isAdmin,
      context,
    ],
    forBalances: (userRole?: string, isAdmin?: boolean, context?: unknown) => [
      'classes-list-for-balances',
      userRole,
      isAdmin,
      context,
    ],
    students: (classId?: string | number) => ['class-students', classId],
  },
  // Organization
  organization: {
    profile: ['organization', 'profile'],
    preferences: ['organization', 'preferences'],
    holidays: (year?: number) => ['organization', 'holidays', year],
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // Generic
  created: 'Created successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  saved: 'Saved successfully',

  // Student
  studentCreated: 'Student created successfully',
  studentUpdated: 'Student updated successfully',
  studentDeleted: 'Student deleted successfully',
  studentReactivated: 'Student reactivated successfully',
  studentsBulkUploaded: 'Students uploaded successfully',

  // Teacher
  teacherCreated: 'Teacher created successfully',
  teacherUpdated: 'Teacher updated successfully',
  teacherDeleted: 'Teacher deleted successfully',
  teacherReactivated: 'Teacher reactivated successfully',
  teachersBulkUploaded: 'Teachers uploaded successfully',

  // Class
  classCreated: 'Class created successfully',
  classUpdated: 'Class updated successfully',
  classDeleted: 'Class deleted successfully',

  // Subject
  subjectCreated: 'Subject created successfully',
  subjectUpdated: 'Subject updated successfully',
  subjectDeleted: 'Subject deleted successfully',

  // Attendance
  attendanceMarked: 'Attendance marked successfully',
  attendanceUpdated: 'Attendance updated successfully',

  // Leave
  leaveRequested: 'Leave request submitted successfully',
  leaveApproved: 'Leave request approved',
  leaveRejected: 'Leave request rejected',
  leaveCancelled: 'Leave request cancelled',

  // Homework
  homeworkCreated: 'Homework created successfully',
  homeworkUpdated: 'Homework updated successfully',
  homeworkDeleted: 'Homework deleted successfully',
  submissionReviewed: 'Submission reviewed successfully',

  // Auth
  loginSuccess: 'Login successful',
  logoutSuccess: 'Logout successful',
  passwordChanged: 'Password changed successfully',

  // Profile
  profileUpdated: 'Profile updated successfully',
  emailUpdated: 'Email updated successfully',
  phoneUpdated: 'Phone number updated successfully',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Generic
  somethingWentWrong: 'Something went wrong. Please try again.',
  networkError: 'Network error. Please check your connection.',
  unauthorized: 'You are not authorized to perform this action.',
  notFound: 'Resource not found.',
  validationError: 'Please check your input and try again.',

  // Auth
  invalidCredentials: 'Invalid email or password',
  sessionExpired: 'Your session has expired. Please login again.',

  // File Upload
  fileTooLarge: 'File size is too large. Maximum size is 5MB.',
  invalidFileType: 'Invalid file type.',
  uploadFailed: 'File upload failed. Please try again.',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
  TABLE_PREFERENCES: 'table_preferences',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    REGISTRATION_SUCCESS: '/auth/registration-success',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ORGANIZATION_NOT_APPROVED: '/auth/organization-not-approved',
    SELECT_PROFILE: '/auth/select-profile',
  },
  // Common routes (role-agnostic)
  ORGANIZATION: '/organization',
  SET_NEW_PASSWORD: '/set-new-password',
  STUDENTS: '/students',
  STUDENTS_NEW: '/students/new',
  STUDENTS_VIEW: '/students/:id',
  STUDENTS_EDIT: '/students/:id/edit',
  TEACHERS: '/teachers',
  TEACHERS_NEW: '/teachers/new',
  TEACHERS_VIEW: '/teachers/:id',
  TEACHERS_EDIT: '/teachers/:id/edit',
  CLASSES: '/classes',
  CLASSES_NEW: '/classes/new',
  CLASSES_VIEW: '/classes/:id',
  CLASSES_EDIT: '/classes/:id/edit',
  SUBJECTS: '/subjects',
  SUBJECTS_NEW: '/subjects/new',
  SUBJECTS_VIEW: '/subjects/:id',
  SUBJECTS_EDIT: '/subjects/:id/edit',
  EXAMS: '/exams',
  EXAMS_SCHEDULE: '/exams/schedule',
  EXAM_SESSIONS: '/exams/sessions',
  EXAM_SESSIONS_NEW: '/exams/sessions/new',
  EXAM_SESSIONS_VIEW: '/exams/sessions/:id',
  EXAM_SESSIONS_EDIT: '/exams/sessions/:id/edit',
  EXAMS_LIST: '/exams/list',
  EXAMS_STATUS_CONTROL: '/exams/status-control',
  EXAMS_NEW: '/exams/new',
  EXAMS_BULK_CREATE: '/exams/bulk-create',
  EXAMS_VIEW: '/exams/:id',
  EXAMS_EDIT: '/exams/:id/edit',
  MARKS: '/exams/marks',
  MARKS_OVERVIEW: '/exams/marks/overview',
  MARKS_ENTRY: '/exams/marks/entry',
  ALLOCATIONS: '/allocations',
  CALENDAR: '/calendar',
  ANALYTICS: '/analytics',
  ATTENDANCE: {
    STUDENTS: '/attendance/students',
    STAFF: '/attendance/staff',
    SUMMARY: '/attendance/summary',
    REPORT: '/attendance/report',
    TIMESHEET: '/attendance/timesheet',
    TIMESHEET_SUBMIT: '/attendance/timesheet/submit',
    TIMESHEET_APPROVALS: '/attendance/timesheet/approvals',
  },
  LEAVE: {
    DASHBOARD: '/leave/dashboard',
    REQUESTS: '/leave/requests',
    REVIEWS: '/leave/reviews',
    BALANCES: '/leave/balances',
    ALLOCATIONS: '/leave/allocations',
  },
  HOLIDAYS: '/holidays',
  PREFERENCES: '/preferences',
  FEEDBACK: '/feedback',
  EXCEPTIONAL_WORK: '/exceptional-work',
  TIMETABLE: '/timetable',
  TIMETABLE_SETUP: '/timetable/setup',
  TIMETABLE_VIEW: '/timetable/view',
  TIMETABLE_OVERRIDES: '/timetable/overrides',
  // Homework
  HOMEWORK: '/homework',
  HOMEWORK_NEW: '/homework/new',
  HOMEWORK_SUBMISSIONS: '/homework/submissions',
  HOMEWORK_SUBMISSION_REVIEW: '/homework/:homeworkId/submissions/:submissionId/review',
  HOMEWORK_VIEW: '/homework/:id',
  HOMEWORK_EDIT: '/homework/:id/edit',
  // Announcements
  ANNOUNCEMENTS: '/announcements',
  // Fee Management
  FEES: {
    DASHBOARD: '/fees',
    STRUCTURES: '/fees/structures',
    STRUCTURES_NEW: '/fees/structures/new',
    STRUCTURES_EDIT: '/fees/structures/:id/edit',
    STUDENT_FEES: '/fees/students',
    COMPONENT_REQUESTS: '/fees/students/component-requests',
    STUDENT_FEES_VIEW: '/fees/students/:id',
    STUDENT_FEES_EDIT: '/fees/students/:id/edit',
    PAYMENTS: '/fees/payments',
    PAYMENT_NEW: '/fees/payments/new',
    PAYMENT_NEW_FOR_STUDENT: '/fees/students/:id/payment/new',
  },
  // Role-specific routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    ORGANIZATION: '/admin/organization',
    STUDENTS: '/admin/students',
    TEACHERS: '/admin/teachers',
    CLASSES: '/admin/classes',
    SUBJECTS: '/admin/subjects',
    ALLOCATIONS: '/admin/allocations',
    CALENDAR: '/admin/calendar',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
    ATTENDANCE: {
      STUDENTS: '/admin/attendance/students',
      STAFF: '/admin/attendance/staff',
      REPORT: '/admin/attendance/report',
      APPROVALS: '/admin/attendance/approvals',
    },
    LEAVE: {
      REQUESTS: '/admin/leave/requests',
      REVIEWS: '/admin/leave/reviews',
      BALANCES: '/admin/leave/balances',
      ALLOCATIONS: '/admin/leave/allocations',
    },
    HOLIDAYS: '/admin/holidays',
    EXCEPTIONAL_WORK: '/admin/exceptional-work',
    PREFERENCES: '/admin/preferences',
    HOMEWORK: {
      LIST: '/homework',
      NEW: '/homework/new',
      VIEW: '/homework/:id',
      EDIT: '/homework/:id/edit',
    },
  },
  EMPLOYEE: {
    DASHBOARD: '/employee/dashboard',
    MY_CLASSES: '/employee/classes',
    MY_STUDENTS: '/employee/students',
    HOLIDAYS: '/employee/holidays',
    EXCEPTIONAL_WORK: '/employee/exceptional-work',
    TEACHERS: '/employee/teachers',
    TEACHERS_VIEW: '/employee/teachers/:id',
    CLASSES: '/employee/classes-list',
    ATTENDANCE: {
      MARK: '/employee/attendance/mark',
      SUMMARY: '/employee/attendance/summary',
      REPORT: '/employee/attendance/report',
      TIMESHEET: '/employee/attendance/timesheet',
      SUBMIT: '/employee/attendance/submit',
      APPROVALS: '/employee/attendance/approvals',
    },
    LEAVE: {
      DASHBOARD: '/employee/leave/dashboard',
      APPLY: '/employee/leave/apply',
      HISTORY: '/employee/leave/history',
      BALANCE: '/employee/leave/balance',
      REVIEWS: '/employee/leave/reviews',
      ALLOCATIONS: '/employee/leave/allocations',
      MANAGE_BALANCE: '/employee/leave/manage-balance',
    },
    HOMEWORK: {
      LIST: '/homework',
      NEW: '/homework/new',
      VIEW: '/homework/:id',
      EDIT: '/homework/:id/edit',
      SUBMISSIONS: '/homework/submissions',
      SUBMISSION_REVIEW: '/homework/:homeworkId/submissions/:submissionId/review',
    },
    PROFILE: '/profile',
  },
  TEACHER: {
    MY_CLASSES: '/teacher/classes',
    ATTENDANCE: '/teacher/attendance',
    LEAVE: '/teacher/leave',
  },
  PARENT: {
    DASHBOARD: '/parent/dashboard',
    MY_CHILDREN: '/parent/children',
    ATTENDANCE: '/parent/attendance',
    LEAVE: {
      APPLY: '/parent/leave/apply',
      HISTORY: '/parent/leave/history',
    },
    PROFILE: '/profile',
    SWITCH_PROFILE: '/parent/switch-profile',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    ATTENDANCE: '/student/attendance',
    EXAMS: '/student/exams',
    EXAM_SESSION_DETAIL: '/student/exams/:publicId',
    FEE: '/student/fee',
    FEE_COMPONENTS: '/student/fee/components',
    TIMETABLE: '/student/timetable',
    HOMEWORK: '/student/homework',
    HOMEWORK_DETAIL: '/student/homework/:publicId',
    LEAVE: '/student/leave',
    ANNOUNCEMENTS: '/student/announcements',
  },
  PROFILE: '/profile',
} as const;
