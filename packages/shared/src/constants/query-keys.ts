/**
 * API Query Keys
 * Centralized query keys for React Query / TanStack Query
 * Shared across Web, iOS, and Android
 */

export const QueryKeys = {
  // Authentication
  AUTH: {
    USER: ["auth", "user"] as const,
    SESSION: ["auth", "session"] as const,
  },

  // Students
  STUDENTS: {
    ALL: ["students"] as const,
    LISTS: () => ["students", "list"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["students", "list", params] as const,
    INFINITE: (params?: Record<string, unknown>) =>
      ["students", "infinite", params] as const,
    DETAILS: () => ["students", "detail"] as const,
    DETAIL: (id: string) => ["students", "detail", id] as const,
    ACTIVE: ["students", "active"] as const,
    DELETED: ["students", "deleted"] as const,
  },

  // Teachers
  TEACHERS: {
    ALL: ["teachers"] as const,
    LISTS: () => ["teachers", "list"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["teachers", "list", params] as const,
    INFINITE: (params?: Record<string, unknown>) =>
      ["teachers", "infinite", params] as const,
    DETAILS: () => ["teachers", "detail"] as const,
    DETAIL: (id: string) => ["teachers", "detail", id] as const,
    ACTIVE: ["teachers", "active"] as const,
    DELETED: ["teachers", "deleted"] as const,
  },

  // Classes
  CLASSES: {
    ALL: ["classes"] as const,
    LISTS: () => ["classes", "list"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["classes", "list", params] as const,
    INFINITE: (params?: Record<string, unknown>) =>
      ["classes", "infinite", params] as const,
    DETAILS: () => ["classes", "detail"] as const,
    DETAIL: (id: string) => ["classes", "detail", id] as const,
    ACTIVE: ["classes", "active"] as const,
    DELETED: ["classes", "deleted"] as const,
    ELIGIBLE: (purpose?: string) => ["classes", "eligible", purpose] as const,
  },

  // Subjects
  SUBJECTS: {
    ALL: ["subjects"] as const,
    LISTS: () => ["subjects", "list"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["subjects", "list", params] as const,
    INFINITE: (params?: Record<string, unknown>) =>
      ["subjects", "infinite", params] as const,
    BY_CLASS: (classId: string) => ["subjects", "byClass", classId] as const,
    DETAILS: () => ["subjects", "detail"] as const,
    DETAIL: (id: string) => ["subjects", "detail", id] as const,
    ACTIVE: ["subjects", "active"] as const,
    DELETED: ["subjects", "deleted"] as const,
    CORE: ["subjects", "core"] as const,
  },

  // Attendance
  ATTENDANCE: {
    ALL: ["attendance"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["attendance", "list", params] as const,
    BY_DATE: (date: string, classId?: string) =>
      ["attendance", "date", date, classId] as const,
    BY_STUDENT: (studentId: string, params?: Record<string, unknown>) =>
      ["attendance", "student", studentId, params] as const,
    VALIDATE_DATE: (date: string) => ["attendance", "validate", date] as const,
    STAFF: {
      MY_ATTENDANCE: ["attendance", "staff", "my"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["attendance", "staff", "list", params] as const,
    },
    TIMESHEET: {
      LIST: (params?: Record<string, unknown>) =>
        ["attendance", "timesheet", "list", params] as const,
      DETAIL: (id: string) =>
        ["attendance", "timesheet", "detail", id] as const,
    },
  },

  // Holidays
  HOLIDAYS: {
    ALL: ["holidays"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["holidays", "list", params] as const,
    DETAIL: (id: string) => ["holidays", "detail", id] as const,
    CALENDAR: (year?: number, month?: number) =>
      ["holidays", "calendar", year, month] as const,
  },

  // Organization
  ORGANIZATION: {
    DETAILS: ["organization", "details"] as const,
    PREFERENCES: ["organization", "preferences"] as const,
    STATS: ["organization", "stats"] as const,
    PROFILE: ["organization", "profile"] as const,
  },

  // Users
  USERS: {
    ALL: ["users"] as const,
    LIST: (params?: Record<string, unknown>) =>
      ["users", "list", params] as const,
    DETAIL: (id: string) => ["users", "detail", id] as const,
    PROFILE: ["users", "profile"] as const,
    MANAGEABLE: ["users", "manageable"] as const,
  },

  // Leave
  LEAVE: {
    ALLOCATIONS: {
      ALL: ["leave", "allocations"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["leave", "allocations", "list", params] as const,
      DETAIL: (id: string) => ["leave", "allocations", "detail", id] as const,
      FOR_USER: (userId: string) =>
        ["leave", "allocations", "user", userId] as const,
    },
    BALANCES: {
      ALL: ["leave", "balances"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["leave", "balances", "list", params] as const,
      SUMMARY: ["leave", "balances", "summary"] as const,
      MY_BALANCE: ["leave", "balances", "my"] as const,
      USER_BALANCE: (userId: string) =>
        ["leave", "balances", "user", userId] as const,
    },
    REQUESTS: {
      ALL: ["leave", "requests"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["leave", "requests", "list", params] as const,
      DETAIL: (id: string) => ["leave", "requests", "detail", id] as const,
      MY_REQUESTS: ["leave", "requests", "my"] as const,
    },
    REVIEWS: {
      ALL: ["leave", "reviews"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["leave", "reviews", "list", params] as const,
      PENDING: ["leave", "reviews", "pending"] as const,
    },
    TYPES: {
      ALL: ["leave", "types"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["leave", "types", "list", params] as const,
    },
  },

  // Exams
  EXAMS: {
    SESSIONS: {
      ALL: ["exams", "sessions"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["exams", "sessions", "list", params] as const,
      DETAIL: (id: string) => ["exams", "sessions", "detail", id] as const,
    },
    EXAMS: {
      ALL: ["exams"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["exams", "list", params] as const,
      DETAIL: (id: string) => ["exams", "detail", id] as const,
    },
    MARKS: {
      LIST: (params?: Record<string, unknown>) =>
        ["exams", "marks", "list", params] as const,
      BY_EXAM: (examId: string) => ["exams", "marks", "exam", examId] as const,
      BY_STUDENT: (studentId: string) =>
        ["exams", "marks", "student", studentId] as const,
    },
  },

  // Timetable
  TIMETABLE: {
    GROUPS: {
      ALL: ["timetable", "groups"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["timetable", "groups", "list", params] as const,
      DETAIL: (id: string) => ["timetable", "groups", "detail", id] as const,
    },
    SLOTS: {
      ALL: ["timetable", "slots"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["timetable", "slots", "list", params] as const,
      BY_GROUP: (groupId: string) =>
        ["timetable", "slots", "group", groupId] as const,
    },
    ENTRIES: {
      ALL: ["timetable", "entries"] as const,
      LIST: (params?: Record<string, unknown>) =>
        ["timetable", "entries", "list", params] as const,
      BY_CLASS: (classId: string) =>
        ["timetable", "entries", "class", classId] as const,
      BY_TEACHER: (teacherId: string) =>
        ["timetable", "entries", "teacher", teacherId] as const,
    },
  },

  // Core/Master data
  CORE: {
    SUBJECTS: ["core", "subjects"] as const,
    CLASSES: ["core", "classes"] as const,
    DESIGNATIONS: ["core", "designations"] as const,
    DEPARTMENTS: ["core", "departments"] as const,
    LEAVE_TYPES: ["core", "leave-types"] as const,
    ROLE_TYPES: ["core", "role-types"] as const,
    SUPERVISORS: ["core", "supervisors"] as const,
  },

  // Attachments
  ATTACHMENTS: {
    MY_PHOTO: ["attachments", "photo", "my"] as const,
    USER_PHOTO: (userId: string) =>
      ["attachments", "photo", "user", userId] as const,
    ORG_BRANDING: (type: string) => ["attachments", "branding", type] as const,
  },
} as const;

/**
 * API Status codes
 */
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type StatusCode = (typeof StatusCodes)[keyof typeof StatusCodes];

export type QueryKeysType = typeof QueryKeys;
