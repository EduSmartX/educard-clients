/**
 * API Endpoints Constants for EduCard Backend
 * Based on Django REST Framework Router Configuration
 * All endpoints are prefixed with /api/ (configured in api client)
 *
 * Shared across Web, iOS, and Android
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login/",
    LOGOUT: "/auth/logout/",
    REGISTER: "/auth/register/",
    TOKEN_OBTAIN: "/auth/token/",
    TOKEN_REFRESH: "/auth/token/refresh/",
    ME: "/auth/me/",
    CHANGE_PASSWORD: "/auth/change-password/",
    PASSWORD_RESET_REQUEST: "/auth/password-reset-request/",
    PASSWORD_RESET_VERIFY: "/auth/password-reset-verify/",
  },

  ORGANIZATIONS: {
    BASE: "/organizations/",
    LIST: "/organizations/",
    CREATE: "/organizations/",
    DETAIL: (id: string) => `/organizations/${id}/`,
    UPDATE: (id: string) => `/organizations/${id}/`,
    PATCH: (id: string) => `/organizations/${id}/`,
    DELETE: (id: string) => `/organizations/${id}/`,

    REGISTER: "/organizations/register/",
    PROFILE: "/organizations/profile/",
    UPDATE_PROFILE: "/organizations/profile/update/",
    APPROVE: (id: string) => `/organizations/${id}/approve/`,
    REJECT: (id: string) => `/organizations/${id}/reject/`,
    ACTIVATE: (id: string) => `/organizations/${id}/activate/`,
    DEACTIVATE: (id: string) => `/organizations/${id}/deactivate/`,

    OTP: {
      SEND: "/organizations/otp/send/",
      VERIFY: "/organizations/otp/verify/",
    },
  },

  ORGANIZATION_PREFERENCES: {
    LIST: "/organization-preferences/",
    CREATE: "/organization-preferences/",
    DETAIL: (id: string) => `/organization-preferences/${id}/`,
    UPDATE: (id: string) => `/organization-preferences/${id}/`,
    PATCH: (id: string) => `/organization-preferences/${id}/`,

    BULK_UPDATE: "/organization-preferences/bulk-update/",
    RESET: (id: string) => `/organization-preferences/${id}/reset/`,
  },

  USERS: {
    LIST: "/users/",
    CREATE: "/users/",
    DETAIL: (id: string) => `/users/${id}/`,
    UPDATE: (id: string) => `/users/${id}/`,
    PATCH: (id: string) => `/users/${id}/`,
    DELETE: (id: string) => `/users/${id}/`,

    PROFILE: "/users/profile/",
    UPDATE_PROFILE: "/users/profile/update/",
    UPDATE_ADDRESS: (id: string) => `/users/${id}/update-address/`,
    MANAGEABLE_USERS: "/users/manageable-users/",
    SUPERVISORS: "/users/supervisors/",
  },

  STUDENTS: {
    BASE: "/students/",
    LIST: "/students/",
    CREATE: "/students/",
    DETAIL: (id: string) => `/students/${id}/`,
    UPDATE: (id: string) => `/students/${id}/`,
    PATCH: (id: string) => `/students/${id}/`,
    DELETE: (id: string) => `/students/${id}/`,
    // Class-level endpoints (for delete/activate which requires class context)
    CLASS_LEVEL: {
      LIST: (classId: string) => `/students/classes/${classId}/students/`,
      CREATE: (classId: string) => `/students/classes/${classId}/students/`,
      DETAIL: (classId: string, studentId: string) =>
        `/students/classes/${classId}/students/${studentId}/`,
      DELETE: (classId: string, studentId: string) =>
        `/students/classes/${classId}/students/${studentId}/`,
      ACTIVATE: (classId: string, studentId: string) =>
        `/students/classes/${classId}/students/${studentId}/activate/`,
    },

    BULK_TEMPLATE: "/students/bulk/template/",
    BULK_IMPORT: "/students/bulk/import/",
    BULK_EXPORT: "/students/bulk/export/",

    ASSIGN_PARENT: (id: string) => `/students/${id}/assign-parent/`,
  },

  TEACHERS: {
    // Admin endpoints - Full CRUD operations
    ADMIN: {
      LIST: "/teacher/admin/",
      CREATE: "/teacher/admin/",
      DETAIL: (id: string) => `/teacher/admin/${id}/`,
      UPDATE: (id: string) => `/teacher/admin/${id}/`,
      PATCH: (id: string) => `/teacher/admin/${id}/`,
      DELETE: (id: string) => `/teacher/admin/${id}/`,
    },
    // Employee endpoints - Read-only access
    EMPLOYEE: {
      LIST: "/teacher/employee/",
      DETAIL: (id: string) => `/teacher/employee/${id}/`,
    },
    // Legacy aliases (use ADMIN by default for backwards compatibility)
    LIST: "/teacher/admin/",
    CREATE: "/teacher/admin/",
    DETAIL: (id: string) => `/teacher/admin/${id}/`,
    UPDATE: (id: string) => `/teacher/admin/${id}/`,
    PATCH: (id: string) => `/teacher/admin/${id}/`,
    DELETE: (id: string) => `/teacher/admin/${id}/`,
  },

  CLASSES: {
    // Admin endpoints
    LIST: "/classes/admin/",
    CREATE: "/classes/admin/",
    DETAIL: (id: string) => `/classes/admin/${id}/`,
    UPDATE: (id: string) => `/classes/admin/${id}/`,
    PATCH: (id: string) => `/classes/admin/${id}/`,
    DELETE: (id: string) => `/classes/admin/${id}/`,
    // Employee endpoints (read-only)
    EMPLOYEE: {
      LIST: "/classes/employee/",
      DETAIL: (id: string) => `/classes/employee/${id}/`,
      ELIGIBLE: "/classes/employee/eligible/",
    },
  },

  SUBJECTS: {
    BASE: "/subjects/",
    LIST: "/subjects/",
    CREATE: "/subjects/",
    DETAIL: (id: string) => `/subjects/${id}/`,
    UPDATE: (id: string) => `/subjects/${id}/`,
    PATCH: (id: string) => `/subjects/${id}/`,
    DELETE: (id: string) => `/subjects/${id}/`,

    ASSIGN_TEACHER: (id: string) => `/subjects/${id}/assign-teacher/`,
    BY_CLASS: "/subjects/by-class/",
    BULK_CREATE: "/subjects/bulk-create/",
  },

  ATTENDANCE: {
    STUDENT: {
      LIST: "/attendance/student/",
      CREATE: "/attendance/student/",
      DETAIL: (id: string) => `/attendance/student/${id}/`,
      UPDATE: (id: string) => `/attendance/student/${id}/`,
      BULK_MARK: "/attendance/student/bulk-mark/",
      BY_DATE: "/attendance/student/by-date/",
      BY_CLASS: "/attendance/student/by-class/",
    },

    STAFF: {
      LIST: "/attendance/staff/",
      CREATE: "/attendance/staff/",
      DETAIL: (id: string) => `/attendance/staff/${id}/`,
      UPDATE: (id: string) => `/attendance/staff/${id}/`,
      MY_ATTENDANCE: "/attendance/staff/my-attendance/",
    },
  },

  LEAVE: {
    ALLOCATIONS: {
      LIST: "/leave/allocations/",
      CREATE: "/leave/allocations/",
      DETAIL: (id: string) => `/leave/allocations/${id}/`,
      UPDATE: (id: string) => `/leave/allocations/${id}/`,
      DELETE: (id: string) => `/leave/allocations/${id}/`,
      FOR_USER: "/leave/allocations/for-user/",
    },

    BALANCES: {
      LIST: "/leave/balances/",
      CREATE: "/leave/balances/",
      DETAIL: (id: string) => `/leave/balances/${id}/`,
      UPDATE: (id: string) => `/leave/balances/${id}/`,
      SUMMARY: "/leave/balances/summary/",
      BULK_CREATE: "/leave/balances/bulk-create/",
      USER_BALANCE: (userId: string) => `/leave/balances/user/${userId}/`,
      BULK_CREATE_FOR_CLASS: "/leave/balances/bulk-create-for-class/",
      MY_BALANCE: "/leave/balances/my-balance/",
    },

    REQUESTS: {
      LIST: "/leave/requests/",
      CREATE: "/leave/requests/",
      DETAIL: (id: string) => `/leave/requests/${id}/`,
      UPDATE: (id: string) => `/leave/requests/${id}/`,
      DELETE: (id: string) => `/leave/requests/${id}/`,
      CANCEL: (id: string) => `/leave/requests/${id}/cancel/`,
      CALCULATE_WORKING_DAYS: "/leave/requests/calculate-working-days/",
    },

    REVIEWS: {
      LIST: "/leave/reviews/",
      DETAIL: (id: string) => `/leave/reviews/${id}/`,
      APPROVE: (id: string) => `/leave/reviews/${id}/approve/`,
      REJECT: (id: string) => `/leave/reviews/${id}/reject/`,
    },
  },

  ATTACHMENTS: {
    MY_PHOTO_UPLOAD: "/attachments/employee/profile-image/my-photo/upload/",
    MY_PHOTO: "/attachments/employee/profile-image/my-photo/",
    USER_PHOTO_UPLOAD: (publicId: string) =>
      `/attachments/employee/profile-image/user/${publicId}/upload/`,
    USER_PHOTO: (publicId: string) =>
      `/attachments/employee/profile-image/user/${publicId}/`,
    ORG_BRANDING: (imageType: string) =>
      `/attachments/employee/profile-image/org-branding/${imageType}/`,
  },

  MASTER: {
    SUBJECTS: {
      LIST: "/core/subjects/",
      DETAIL: (id: string) => `/core/subjects/${id}/`,
    },

    DEPARTMENTS: {
      LIST: "/core/departments/",
      DETAIL: (id: string) => `/core/departments/${id}/`,
    },

    CLASSES: {
      LIST: "/core/classes/",
      DETAIL: (id: string) => `/core/classes/${id}/`,
    },

    LEAVE_TYPES: {
      LIST: "/core/leave-types/",
      CREATE: "/core/leave-types/",
      DETAIL: (id: string) => `/core/leave-types/${id}/`,
      UPDATE: (id: string) => `/core/leave-types/${id}/`,
      DELETE: (id: string) => `/core/leave-types/${id}/`,
    },

    ROLE_TYPES: {
      LIST: "/core/organization-role-types/",
      CREATE: "/core/organization-role-types/",
      DETAIL: (id: string) => `/core/organization-role-types/${id}/`,
      UPDATE: (id: string) => `/core/organization-role-types/${id}/`,
      DELETE: (id: string) => `/core/organization-role-types/${id}/`,
    },

    PREFERENCES: {
      LIST: "/master/organization-preferences/",
      CREATE: "/master/organization-preferences/",
      DETAIL: (id: string) => `/master/organization-preferences/${id}/`,
      UPDATE: (id: string) => `/master/organization-preferences/${id}/`,
      DELETE: (id: string) => `/master/organization-preferences/${id}/`,
    },
  },

  HOLIDAYS: {
    LIST: "/holidays/",
    CREATE: "/holidays/",
    DETAIL: (id: string) => `/holidays/${id}/`,
    UPDATE: (id: string) => `/holidays/${id}/`,
    DELETE: (id: string) => `/holidays/${id}/`,
    CALENDAR: "/holidays/calendar/",
    BULK_TEMPLATE: "/holidays/bulk/template/",
    BULK_IMPORT: "/holidays/bulk/import/",
  },

  EXAMS: {
    SESSIONS: {
      LIST: "/exams/sessions/",
      CREATE: "/exams/sessions/",
      DETAIL: (id: string) => `/exams/sessions/${id}/`,
      UPDATE: (id: string) => `/exams/sessions/${id}/`,
      DELETE: (id: string) => `/exams/sessions/${id}/`,
    },
    EXAMS: {
      LIST: "/exams/",
      CREATE: "/exams/",
      DETAIL: (id: string) => `/exams/${id}/`,
      UPDATE: (id: string) => `/exams/${id}/`,
      DELETE: (id: string) => `/exams/${id}/`,
    },
    MARKS: {
      LIST: "/exams/marks/",
      CREATE: "/exams/marks/",
      DETAIL: (id: string) => `/exams/marks/${id}/`,
      UPDATE: (id: string) => `/exams/marks/${id}/`,
      BULK_CREATE: "/exams/marks/bulk/",
    },
  },

  TIMETABLE: {
    GROUPS: {
      LIST: "/timetable/groups/",
      CREATE: "/timetable/groups/",
      DETAIL: (id: string) => `/timetable/groups/${id}/`,
      UPDATE: (id: string) => `/timetable/groups/${id}/`,
      DELETE: (id: string) => `/timetable/groups/${id}/`,
    },
    SLOTS: {
      LIST: "/timetable/slots/",
      CREATE: "/timetable/slots/",
      DETAIL: (id: string) => `/timetable/slots/${id}/`,
      UPDATE: (id: string) => `/timetable/slots/${id}/`,
      DELETE: (id: string) => `/timetable/slots/${id}/`,
    },
    ENTRIES: {
      LIST: "/timetable/entries/",
      CREATE: "/timetable/entries/",
      DETAIL: (id: string) => `/timetable/entries/${id}/`,
      UPDATE: (id: string) => `/timetable/entries/${id}/`,
      DELETE: (id: string) => `/timetable/entries/${id}/`,
    },
  },

  // Fee Management
  FEE: {
    // Admin endpoints
    ADMIN: {
      STRUCTURES: {
        LIST: "/fee/admin/structures/",
        CREATE: "/fee/admin/structures/",
        DETAIL: (id: string) => `/fee/admin/structures/${id}/`,
        UPDATE: (id: string) => `/fee/admin/structures/${id}/`,
        DELETE: (id: string) => `/fee/admin/structures/${id}/`,
        CLASS_CHANGE_IMPACT: (id: string) =>
          `/fee/admin/structures/${id}/class-change-impact/`,
      },
      STUDENT_FEES: {
        LIST: "/fee/admin/student-fees/",
        CREATE: "/fee/admin/student-fees/",
        DETAIL: (id: string) => `/fee/admin/student-fees/${id}/`,
        UPDATE: (id: string) => `/fee/admin/student-fees/${id}/`,
        DELETE: (id: string) => `/fee/admin/student-fees/${id}/`,
        PAYMENT_STATUS: (id: string) =>
          `/fee/admin/student-fees/${id}/payment_status/`,
        UPDATE_COMPONENTS: (id: string) =>
          `/fee/admin/student-fees/${id}/update-components/`,
        REVIEW_COMPONENT_REQUESTS: (id: string) =>
          `/fee/admin/student-fees/${id}/review-component-requests/`,
      },
      PAYMENTS: {
        LIST: "/fee/admin/payments/",
        CREATE: "/fee/admin/payments/",
        DETAIL: (id: string) => `/fee/admin/payments/${id}/`,
      },
      DASHBOARD: {
        LIST: "/fee/admin/dashboard/",
        DEFAULTERS: "/fee/admin/dashboard/defaulters/",
      },
      REMINDERS: {
        CREATE: "/fee/admin/reminders/",
        BULK: "/fee/admin/reminders/bulk/",
      },
    },
    // Parent/Student endpoints (read-only)
    PARENT: {
      LIST: "/fee/parent/fees/",
      DETAIL: (id: string) => `/fee/parent/fees/${id}/`,
      PAYMENTS: (id: string) => `/fee/parent/fees/${id}/payments/`,
    },
  },
} as const;

/**
 * Helper function to build URL with query parameters
 */
export const buildUrl = (
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string => {
  if (!params) {
    return endpoint;
  }

  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");

  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

export type ApiEndpointsType = typeof API_ENDPOINTS;
