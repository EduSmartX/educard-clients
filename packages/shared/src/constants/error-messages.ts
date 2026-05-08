/**
 * Centralized error messages for the application
 * Shared across Web, iOS, and Android
 */

export const ErrorMessages = {
  // Generic errors
  GENERIC_ERROR: "Something went wrong. Please try again.",
  GENERIC_RETRY: "An error occurred. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  NO_SERVER_RESPONSE:
    "No response from server. Please check your internet connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  AUTH_REQUIRED: "Authentication required. Please login again.",
  FORBIDDEN: "Access forbidden.",
  FORBIDDEN_ACTION: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  INVALID_REQUEST: "Invalid request. Please check your input.",
  VALIDATION_ERROR: "Validation error. Please check your input.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  SERVER_ERROR: "Server error. Please try again later.",
  SERVICE_UNAVAILABLE: "Service unavailable. Please try again later.",
  CONFLICT: "A conflict occurred.",

  // Authentication errors
  LOGIN_FAILED: "Login failed. Please check your credentials.",
  SESSION_EXPIRED: "Your session has expired. Please login again.",
  INVALID_TOKEN: "Invalid or expired token.",

  // Validation errors
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",
  INVALID_DATE: "Please enter a valid date.",
  PASSWORD_MISMATCH: "Passwords do not match.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",

  // CRUD operation errors
  CREATE_FAILED: "Failed to create. Please try again.",
  UPDATE_FAILED: "Failed to update. Please try again.",
  DELETE_FAILED: "Failed to delete. Please try again.",
  FETCH_FAILED: "Failed to load data. Please try again.",

  // Feature-specific errors
  STUDENT: {
    CREATE_FAILED: "Failed to create student. Please try again.",
    UPDATE_FAILED: "Failed to update student. Please try again.",
    DELETE_FAILED: "Failed to delete student. Please try again.",
    REACTIVATE_FAILED: "Failed to reactivate student. Please try again.",
    FETCH_FAILED: "Failed to load students. Please try again.",
    BULK_UPLOAD_FAILED: "Failed to upload students. Please try again.",
    DOWNLOAD_TEMPLATE_FAILED: "Failed to download student template.",
    NOT_FOUND: "Student not found.",
  },

  TEACHER: {
    CREATE_FAILED: "Failed to create teacher. Please try again.",
    UPDATE_FAILED: "Failed to update teacher. Please try again.",
    DELETE_FAILED: "Failed to delete teacher. Please try again.",
    REACTIVATE_FAILED: "Failed to reactivate teacher. Please try again.",
    FETCH_FAILED: "Failed to load teachers. Please try again.",
    BULK_UPLOAD_FAILED: "Failed to upload teachers. Please try again.",
    DOWNLOAD_TEMPLATE_FAILED: "Failed to download teacher template.",
    NOT_FOUND: "Teacher not found.",
  },

  CLASS: {
    CREATE_FAILED: "Failed to create class. Please try again.",
    UPDATE_FAILED: "Failed to update class. Please try again.",
    DELETE_FAILED: "Failed to delete class. Please try again.",
    REACTIVATE_FAILED: "Failed to reactivate class. Please try again.",
    BULK_UPLOAD_FAILED: "Failed to upload classes. Please try again.",
    FETCH_FAILED: "Failed to load classes. Please try again.",
    NOT_FOUND: "Class not found.",
  },

  SUBJECT: {
    CREATE_FAILED: "Failed to create subject. Please try again.",
    UPDATE_FAILED: "Failed to update subject. Please try again.",
    DELETE_FAILED: "Failed to delete subject. Please try again.",
    REACTIVATE_FAILED: "Failed to reactivate subject. Please try again.",
    FETCH_FAILED: "Failed to load subjects. Please try again.",
    BULK_UPLOAD_FAILED: "Failed to upload subjects. Please try again.",
    DOWNLOAD_TEMPLATE_FAILED: "Failed to download subject template.",
    NOT_FOUND: "Subject not found.",
  },

  ATTENDANCE: {
    MARK_FAILED: "Failed to mark attendance. Please try again.",
    BULK_MARK_FAILED: "Failed to bulk mark attendance. Please try again.",
    FETCH_FAILED: "Failed to load attendance records. Please try again.",
    APPROVE_FAILED: "Failed to approve attendance. Please try again.",
    VALIDATE_DATE_FAILED: "Failed to validate date. Please try again.",
    INVALID_DATE: "Invalid attendance date.",
    NO_PERMISSION:
      "You do not have permission to mark attendance for this class.",
    TIMESHEET_SUBMIT_FAILED: "Failed to submit timesheet. Please try again.",
    TIMESHEET_FETCH_FAILED:
      "Failed to load timesheet submissions. Please try again.",
    TIMESHEET_REVIEW_FAILED: "Failed to review timesheet. Please try again.",
    TIMESHEET_APPROVE_FAILED: "Failed to approve timesheet. Please try again.",
    TIMESHEET_REJECT_FAILED: "Failed to reject timesheet. Please try again.",
    EMPLOYEE_ATTENDANCE_FETCH_FAILED:
      "Failed to load employee attendance. Please try again.",
    REJECTION_COMMENT_REQUIRED:
      "Comments are required when rejecting a timesheet.",
  },

  EXAM_SESSION: {
    CREATE_FAILED: "Failed to create exam session. Please try again.",
    UPDATE_FAILED: "Failed to update exam session. Please try again.",
    DELETE_FAILED: "Failed to delete exam session. Please try again.",
    REACTIVATE_FAILED: "Failed to reactivate exam session. Please try again.",
    FETCH_FAILED: "Failed to load exam sessions. Please try again.",
    NOT_FOUND: "Exam session not found.",
  },

  EXAM: {
    CREATE_FAILED: "Failed to create exam. Please try again.",
    UPDATE_FAILED: "Failed to update exam. Please try again.",
    DELETE_FAILED: "Failed to delete exam. Please try again.",
    REACTIVATE_FAILED: "Failed to reactivate exam. Please try again.",
    FETCH_FAILED: "Failed to load exams. Please try again.",
    NOT_FOUND: "Exam not found.",
  },

  MARK: {
    CREATE_FAILED: "Failed to record mark. Please try again.",
    UPDATE_FAILED: "Failed to update mark. Please try again.",
    DELETE_FAILED: "Failed to delete mark. Please try again.",
    FETCH_FAILED: "Failed to load marks. Please try again.",
    BULK_CREATE_FAILED: "Failed to bulk record marks. Please try again.",
  },

  HOLIDAY: {
    CREATE_FAILED: "Failed to create holiday. Please try again.",
    UPDATE_FAILED: "Failed to update holiday. Please try again.",
    DELETE_FAILED: "Failed to delete holiday. Please try again.",
    FETCH_FAILED: "Failed to load holidays. Please try again.",
    BULK_UPLOAD_FAILED: "Failed to upload holidays. Please try again.",
    DOWNLOAD_TEMPLATE_FAILED: "Failed to download holiday template.",
  },

  ORGANIZATION: {
    CREATE_FAILED: "Failed to create organization. Please try again.",
    UPDATE_FAILED: "Failed to update organization. Please try again.",
    FETCH_FAILED: "Failed to load organization details. Please try again.",
    NOT_FOUND: "Organization not found.",
  },

  LEAVE: {
    CREATE_REQUEST_FAILED: "Failed to submit leave request. Please try again.",
    UPDATE_REQUEST_FAILED: "Failed to update leave request. Please try again.",
    CANCEL_REQUEST_FAILED: "Failed to cancel leave request. Please try again.",
    APPROVE_REQUEST_FAILED:
      "Failed to approve leave request. Please try again.",
    REJECT_REQUEST_FAILED: "Failed to reject leave request. Please try again.",
    DELETE_ALLOCATION_FAILED:
      "Failed to delete leave allocation. Please try again.",
    ADD_BALANCE_FAILED: "Failed to add leave balance. Please try again.",
    UPDATE_BALANCE_FAILED: "Failed to update leave balance. Please try again.",
    DELETE_BALANCE_FAILED: "Failed to delete leave balance. Please try again.",
    USER_NOT_SELECTED: "User not selected.",
    NO_AVAILABLE_TYPES: "No available leave types.",
  },

  TIMETABLE: {
    CREATE_GROUP_FAILED: "Failed to create class group. Please try again.",
    UPDATE_GROUP_FAILED: "Failed to update class group. Please try again.",
    DELETE_GROUP_FAILED: "Failed to delete class group. Please try again.",
    ADD_CLASS_FAILED: "Failed to add class to group. Please try again.",
    REMOVE_CLASS_FAILED: "Failed to remove class from group. Please try again.",
    SAVE_SLOTS_FAILED: "Failed to save time slots. Please try again.",
    CLEAR_DAY_FAILED: "Failed to clear day slots. Please try again.",
    CREATE_ENTRY_FAILED: "Failed to save timetable entry. Please try again.",
    DELETE_ENTRY_FAILED: "Failed to delete timetable entry. Please try again.",
    FETCH_FAILED: "Failed to load timetable data. Please try again.",
  },

  AUTH: {
    PENDING_APPROVAL: "Organization pending approval.",
    ORGANIZATION_REJECTED: "Organization has been rejected.",
    SEND_OTP_FAILED: "Failed to send OTP. Please try again.",
    INVALID_OTP: "Please enter a valid 6-digit OTP.",
    VERIFY_OTP_FAILED: "Failed to verify OTP. Please try again.",
    PASSWORD_RESET_FAILED:
      "Invalid OTP or failed to reset password. Please try again.",
  },

  PROFILE: {
    UPDATE_FAILED: "Failed to update profile. Please try again.",
    CHANGE_PASSWORD_FAILED: "Failed to change password. Please try again.",
    SEND_OTP_FAILED: "Failed to send OTP. Please try again.",
    UPDATE_EMAIL_FAILED: "Failed to update email. Please try again.",
    UPDATE_PHONE_FAILED: "Failed to update phone. Please try again.",
    PHOTO_UPLOAD_FAILED: "Failed to upload profile photo. Please try again.",
    PHOTO_DELETE_FAILED: "Failed to delete profile photo. Please try again.",
    PHOTO_FETCH_FAILED: "Failed to load profile photo.",
  },

  LOCATION_UNAVAILABLE: "Unable to get location.",
  FILE_NOT_SELECTED: "Please select a file to upload.",

  // File upload errors
  FILE_TOO_LARGE: "File size exceeds the maximum limit.",
  INVALID_FILE_TYPE:
    "Invalid file type. Please upload the correct file format.",
  UPLOAD_FAILED: "File upload failed. Please try again.",

  // Form validation errors
  FORM: {
    INVALID_INPUT: "Please check your input and try again.",
    MISSING_REQUIRED: "Please fill in all required fields.",
  },
} as const;

export const ToastTitles = {
  ERROR: "Error",
  VALIDATION_ERROR: "Validation Error",
  SUCCESS: "Success",
  INFO: "Info",
  WARNING: "Warning",
} as const;

export const CommonUiText = {
  CANCEL: "Cancel",
  RESET: "Reset",
  SAVE: "Save",
  SAVE_CHANGES: "Save Changes",
  SAVING: "Saving...",
  RETRY: "Retry",
  NO_CHANGES: "No Changes",
  CHANGES_DISCARDED: "Changes Discarded",
  DISCARD_CHANGES: "Discard Changes",
  SEND_OTP: "Send OTP",
  UPDATE_EMAIL: "Update Email",
  UPDATE_PHONE: "Update Phone",
  CHANGE_PASSWORD: "Change Password",
  SIGN_IN: "Sign In",
  SIGN_UP: "Sign Up",
  SIGN_OUT: "Sign Out",
  FORGOT_PASSWORD: "Forgot password?",
  LOADING: "Loading...",
  SUBMITTING: "Submitting...",
  GETTING_LOCATION: "Getting location...",
  CONFIRM: "Confirm",
  DELETE: "Delete",
  EDIT: "Edit",
  VIEW: "View",
  CLOSE: "Close",
  BACK: "Back",
  NEXT: "Next",
  DONE: "Done",
  SEARCH: "Search",
  FILTER: "Filter",
  CLEAR: "Clear",
  APPLY: "Apply",
  SELECT_ALL: "Select All",
  DESELECT_ALL: "Deselect All",
} as const;

/**
 * Success messages for CRUD operations
 */
export const SuccessMessages = {
  // Generic success
  SUCCESS: "Operation completed successfully.",

  // CRUD operation success
  CREATE_SUCCESS: "Created successfully.",
  UPDATE_SUCCESS: "Updated successfully.",
  DELETE_SUCCESS: "Deleted successfully.",

  // Feature-specific success messages
  STUDENT: {
    CREATE_SUCCESS: "Student created successfully.",
    UPDATE_SUCCESS: "Student updated successfully.",
    DELETE_SUCCESS: "Student deleted successfully.",
    BULK_UPLOAD_SUCCESS: "Students uploaded successfully.",
    REACTIVATE_SUCCESS: "Student reactivated successfully.",
  },

  TEACHER: {
    CREATE_SUCCESS: "Teacher created successfully.",
    UPDATE_SUCCESS: "Teacher updated successfully.",
    DELETE_SUCCESS: "Teacher deleted successfully.",
    BULK_UPLOAD_SUCCESS: "Teachers uploaded successfully.",
    REACTIVATE_SUCCESS: "Teacher reactivated successfully.",
  },

  CLASS: {
    CREATE_SUCCESS: "Class created successfully.",
    UPDATE_SUCCESS: "Class updated successfully.",
    DELETE_SUCCESS: "Class deleted successfully.",
    BULK_UPLOAD_SUCCESS: "Classes uploaded successfully.",
    REACTIVATE_SUCCESS: "Class reactivated successfully.",
  },

  SUBJECT: {
    CREATE_SUCCESS: "Subject created successfully.",
    UPDATE_SUCCESS: "Subject updated successfully.",
    DELETE_SUCCESS: "Subject deleted successfully.",
    BULK_UPLOAD_SUCCESS: "Subjects uploaded successfully.",
    REACTIVATE_SUCCESS: "Subject reactivated successfully.",
  },

  ATTENDANCE: {
    MARK_SUCCESS: "Attendance marked successfully.",
    BULK_MARK_SUCCESS: "Attendance marked for all students successfully.",
    APPROVE_SUCCESS: "Attendance approved successfully.",
    UPDATE_SUCCESS: "Attendance updated successfully.",
    TIMESHEET_SUBMIT_SUCCESS: "Timesheet submitted successfully.",
    TIMESHEET_APPROVE_SUCCESS: "Timesheet approved successfully.",
    TIMESHEET_REJECT_SUCCESS: "Timesheet rejected successfully.",
    TIMESHEET_REVIEW_SUCCESS: "Timesheet reviewed successfully.",
  },

  EXAM_SESSION: {
    CREATE_SUCCESS: "Exam session created successfully.",
    UPDATE_SUCCESS: "Exam session updated successfully.",
    DELETE_SUCCESS: "Exam session deleted successfully.",
    REACTIVATE_SUCCESS: "Exam session reactivated successfully.",
  },

  EXAM: {
    CREATE_SUCCESS: "Exam created successfully.",
    UPDATE_SUCCESS: "Exam updated successfully.",
    DELETE_SUCCESS: "Exam deleted successfully.",
    REACTIVATE_SUCCESS: "Exam reactivated successfully.",
  },

  MARK: {
    CREATE_SUCCESS: "Mark recorded successfully.",
    UPDATE_SUCCESS: "Mark updated successfully.",
    DELETE_SUCCESS: "Mark deleted successfully.",
    BULK_CREATE_SUCCESS: "Marks recorded for multiple students successfully.",
  },

  HOLIDAY: {
    CREATE_SUCCESS: "Holiday created successfully.",
    UPDATE_SUCCESS: "Holiday updated successfully.",
    DELETE_SUCCESS: "Holiday deleted successfully.",
    BULK_UPLOAD_SUCCESS: "Holidays uploaded successfully.",
  },

  ORGANIZATION: {
    CREATE_SUCCESS: "Organization created successfully.",
    UPDATE_SUCCESS: "Organization updated successfully.",
    ADDRESS_UPDATE_SUCCESS: "Organization address updated successfully.",
  },

  PREFERENCES: {
    UPDATED: "Preferences updated successfully.",
    ACADEMIC_YEAR_UPDATED:
      "Academic year settings have been updated successfully.",
    WORKING_DAY_POLICY_UPDATED:
      "Working day policy has been updated successfully.",
  },

  LEAVE: {
    REQUEST_SUBMITTED: "Leave request submitted successfully.",
    REQUEST_UPDATED: "Leave request updated successfully.",
    REQUEST_CANCELLED: "Leave request cancelled successfully.",
    REQUEST_APPROVED: "Leave request approved successfully.",
    REQUEST_REJECTED: "Leave request rejected successfully.",
    ALLOCATION_DELETED: "Leave allocation deleted successfully.",
    BALANCE_ADDED: "Leave balance added successfully.",
    BALANCE_UPDATED: "Leave balance updated successfully.",
    BALANCE_DELETED: "Leave balance deleted successfully.",
  },

  TIMETABLE: {
    GROUP_CREATED: "Class group created successfully.",
    GROUP_UPDATED: "Class group updated successfully.",
    GROUP_DELETED: "Class group deleted successfully.",
    CLASS_ADDED: "Class added to group successfully.",
    CLASS_REMOVED: "Class removed from group successfully.",
    SLOTS_SAVED: "Time slots saved successfully.",
    DAY_CLEARED: "Day slots cleared successfully.",
    ENTRY_CREATED: "Timetable entry saved successfully.",
    ENTRY_DELETED: "Timetable entry removed successfully.",
  },

  PROFILE: {
    UPDATED: "Profile updated successfully.",
    PASSWORD_CHANGED: "Password changed successfully.",
    EMAIL_UPDATED: "Email updated successfully.",
    PHONE_UPDATED: "Phone updated successfully.",
    OTP_SENT: "OTP sent successfully.",
    PHOTO_UPLOADED: "Profile photo uploaded successfully.",
    PHOTO_DELETED: "Profile photo removed successfully.",
  },

  AUTH: {
    OTP_SENT: "OTP sent successfully.",
    PASSWORD_RESET_SUCCESS: "Password reset successful.",
    LOGIN_SUCCESS: "Logged in successfully.",
    LOGOUT_SUCCESS: "Logged out successfully.",
  },
} as const;

/**
 * Confirmation messages for user actions
 */
export const ConfirmationMessages = {
  DELETE: "Are you sure you want to delete this item?",
  DELETE_MULTIPLE: "Are you sure you want to delete these items?",
  CANCEL: "Are you sure you want to cancel? Any unsaved changes will be lost.",
  LOGOUT: "Are you sure you want to logout?",

  STUDENT: {
    DELETE: "Are you sure you want to delete this student?",
    REACTIVATE: "Are you sure you want to reactivate this student?",
  },

  TEACHER: {
    DELETE: "Are you sure you want to delete this teacher?",
    REACTIVATE: "Are you sure you want to reactivate this teacher?",
  },

  CLASS: {
    DELETE: "Are you sure you want to delete this class?",
    REACTIVATE: "Are you sure you want to reactivate this class?",
  },

  SUBJECT: {
    DELETE: "Are you sure you want to delete this subject?",
    REACTIVATE: "Are you sure you want to reactivate this subject?",
  },

  HOLIDAY: {
    DELETE: "Are you sure you want to delete this holiday?",
  },
} as const;

/**
 * Validation messages for form fields
 */
export const ValidationMessages = {
  // Generic field validation
  REQUIRED: "This field is required.",

  // Select field validations
  SELECT_EXAM_SESSION: "Please select an exam session.",
  SELECT_SUBJECT: "Please select a subject.",
  SELECT_STATUS: "Please select a status.",
  SELECT_CLASS: "Please select a class.",
  SELECT_ACADEMIC_YEAR: "Please select an academic year.",
  SELECT_LEAVE_TYPE: "Please select a leave type.",
  SELECT_DATE: "Please select a date.",
  SELECT_START_END_DATE: "Please select start and end dates.",

  // Input field validations
  ENTER_NAME: "Please enter a name.",
  ENTER_DESCRIPTION: "Please enter a description.",
  ENTER_MAX_MARKS: "Please enter maximum marks.",
  ENTER_PASSING_MARKS: "Please enter passing marks.",

  // Date validations
  INVALID_DATE_RANGE: "Start date must be before or equal to end date.",
  DATE_REQUIRED: "Please select a date.",

  // Numeric validations
  MARKS_EXCEED_MAXIMUM: "Marks obtained cannot exceed maximum marks.",
  INVALID_MARKS: "Please enter valid marks.",

  // Exam Session validations
  EXAM_SESSION: {
    ENTER_NAME: "Please enter exam session name.",
    SELECT_TYPE: "Please select exam session type.",
    SELECT_ACADEMIC_YEAR: "Please select an academic year.",
  },
} as const;

/**
 * Form placeholder texts
 */
export const FormPlaceholders = {
  // Generic
  SEARCH: "Search...",
  SELECT: "Select...",
  SELECT_OPTION: "Select an option",
  ENTER_VALUE: "Enter value",
  TYPE_TO_SEARCH: "Type to search...",

  // User fields
  EMAIL: "Enter email address",
  PASSWORD: "Enter password",
  CONFIRM_PASSWORD: "Confirm password",
  FIRST_NAME: "Enter first name",
  LAST_NAME: "Enter last name",
  FULL_NAME: "Enter full name",
  PHONE: "Enter phone number",
  DATE_OF_BIRTH: "Select date of birth",
  ENTER_EMAIL: "Enter email address",
  ENTER_FIRST_NAME: "Enter first name",
  ENTER_LAST_NAME: "Enter last name",
  ENTER_PHONE_NUMBER: "Enter phone number",

  // Address fields
  STREET_ADDRESS: "Enter street address",
  ADDRESS_LINE_2: "Apartment, suite, etc. (optional)",
  CITY: "Enter city",
  STATE: "Enter state",
  ZIP_CODE: "Enter ZIP/postal code",
  COUNTRY: "Enter country",

  // Student fields
  ROLL_NUMBER: "Enter roll number",
  ADMISSION_NUMBER: "Enter admission number",
  GUARDIAN_NAME: "Enter guardian name",
  GUARDIAN_PHONE: "Enter guardian phone",
  GUARDIAN_EMAIL: "Enter guardian email",

  // Teacher fields
  EMPLOYEE_ID: "Enter employee ID",
  ENTER_EMPLOYEE_ID: "e.g., EMP001",
  DESIGNATION: "Enter designation",
  DESIGNATION_EXAMPLE: "e.g., Senior Teacher, HOD",
  SPECIALIZATION: "Enter specialization",
  SPECIALIZATION_EXAMPLE: "e.g., Mathematics, Physics",
  QUALIFICATION: "Enter highest qualification",
  QUALIFICATION_EXAMPLE: "e.g., M.Sc., B.Ed.",
  EXPERIENCE_YEARS: "Enter years of experience",
  ENTER_YEARS_OF_EXPERIENCE: "e.g., 5",
  ENTER_CONTACT_NAME: "Enter emergency contact name",
  ENTER_CONTACT_PHONE: "Enter emergency contact phone",

  // Class fields
  CLASS_NAME: "Enter class name",
  SECTION_NAME: "Enter section name",
  CLASS_SECTION_EXAMPLE: "e.g., 1, 2, 3 or I, II, III",
  ROOM_NUMBER: "Enter room number",
  CAPACITY: "Enter capacity",
  ENTER_CLASS_CAPACITY: "Enter maximum student capacity",
  CLASS_INFO: "Enter any additional information about this class",

  // Subject fields
  SUBJECT_NAME: "Enter subject name",
  SUBJECT_CODE: "Enter subject code",
  SUBJECT_INFO: "Enter any additional information about this subject",

  // Selection fields
  SELECT_CLASS: "Select class",
  SELECT_SUBJECT: "Select subject",
  SELECT_TEACHER: "Select teacher",
  SELECT_CLASS_TEACHER: "Select class teacher",

  // Leave fields
  REASON: "Enter reason",
  COMMENTS: "Enter comments",
  REMARKS: "Enter remarks (optional)",
  SELECT_LEAVE_TYPE: "Select leave type",
  ENTER_LEAVE_REASON: "Enter reason for leave...",

  // Organization fields
  ORGANIZATION_NAME: "Enter organization name",
  ORGANIZATION_CODE: "Enter organization code",

  // OTP
  OTP: "Enter 6-digit OTP",

  // Date
  SELECT_DATE: "Select date",
  SELECT_START_DATE: "Select start date",
  SELECT_END_DATE: "Select end date",
} as const;

/**
 * Attendance UI text
 */
export const AttendanceUiText = {
  // Page titles
  MARK_ATTENDANCE: "Mark Attendance",
  VIEW_ATTENDANCE: "View Attendance",
  ATTENDANCE_REPORT: "Attendance Report",
  MY_ATTENDANCE: "My Attendance",
  TIMESHEET: "Timesheet",
  SUMMARY_PAGE_TITLE: "Attendance Summary",
  SUMMARY_PAGE_DESC: "Today's attendance overview across all classes",

  // Form labels
  CLASS_LABEL: "Class",
  DATE_LABEL: "Date",
  SELECT_CLASS_PLACEHOLDER: "Select a class",
  SELECT_DATE_PLACEHOLDER: "Select a date",

  // Status labels
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  ON_LEAVE: "On Leave",
  HOLIDAY: "Holiday",
  NOT_MARKED: "Not Marked",

  // Actions
  MARK_ALL_PRESENT: "Mark All Present",
  MARK_ALL_ABSENT: "Mark All Absent",
  SUBMIT_ATTENDANCE: "Submit Attendance",
  UPDATE_ATTENDANCE: "Update Attendance",
  CHECK_IN: "Check In",
  CHECK_OUT: "Check Out",

  // Messages
  SELECT_CLASS: "Please select a class",
  SELECT_DATE: "Please select a date",
  NO_STUDENTS: "No students found in this class",
  ATTENDANCE_SUBMITTED: "Attendance submitted successfully",
  ATTENDANCE_UPDATED: "Attendance updated successfully",
  ALREADY_MARKED: "Attendance already marked for this date",

  // Summary labels
  TOTAL_STUDENTS: "Total Students",
  TOTAL_PRESENT: "Total Present",
  TOTAL_ABSENT: "Total Absent",
  ATTENDANCE_PERCENTAGE: "Attendance %",
  WORKING_DAYS: "Working Days",
  DAYS_PRESENT: "Days Present",
  DAYS_ABSENT: "Days Absent",

  // Period selection
  PERIOD_LABEL: "Period",
  PERIOD_MORNING: "Morning",
  PERIOD_AFTERNOON: "Afternoon",
  PERIOD_FULL_DAY: "Full Day",

  // Date validation
  NOT_WORKING_DAY: "This is not a working day",

  // Timesheet
  SUBMIT_TIMESHEET: "Submit Timesheet",
  APPROVE_TIMESHEET: "Approve Timesheet",
  REJECT_TIMESHEET: "Reject Timesheet",
  TIMESHEET_PENDING: "Pending Review",
  TIMESHEET_APPROVED: "Approved",
  TIMESHEET_REJECTED: "Rejected",
} as const;

/**
 * Info messages for various features
 */
export const InfoMessages = {
  CLASS_TEACHER: {
    BULK_UPLOAD_STUDENTS:
      "As a class teacher, students will be uploaded to your assigned class only.",
    BULK_UPLOAD_SUBJECTS:
      "As a class teacher, subjects will be uploaded to your assigned class only.",
  },
  ADMIN: {
    BULK_UPLOAD_INFO: "Upload data for any class in your organization.",
  },
} as const;

export type ErrorMessagesType = typeof ErrorMessages;
export type SuccessMessagesType = typeof SuccessMessages;
export type ConfirmationMessagesType = typeof ConfirmationMessages;
export type ValidationMessagesType = typeof ValidationMessages;
export type FormPlaceholdersType = typeof FormPlaceholders;
export type AttendanceUiTextType = typeof AttendanceUiText;
export type InfoMessagesType = typeof InfoMessages;
