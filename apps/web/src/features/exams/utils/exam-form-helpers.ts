/**
 * Exam Form Helpers
 * Extracted validation and payload building logic to reduce cognitive complexity
 */

import { format } from 'date-fns';
import { ValidationMessages } from '@/constants';
import { formatDateForAPI } from '@/lib/utils/date-utils';
import { validateAttendanceDate } from '@/features/attendance/api/attendance-api';
import type { ExamStatus, ExamCreatePayload, ExamUpdatePayload } from '@educard/shared';

interface SessionDateRange {
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Validate if a date is within the session's date range
 */
function validateDateInSessionRange(
  date: Date,
  session: SessionDateRange | undefined
): string | undefined {
  if (!session?.start_date || !session?.end_date) {
    return undefined;
  }

  const sessionStart = new Date(session.start_date);
  const sessionEnd = new Date(session.end_date);
  sessionStart.setHours(0, 0, 0, 0);
  sessionEnd.setHours(0, 0, 0, 0);

  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate < sessionStart || checkDate > sessionEnd) {
    return ValidationMessages.EXAM.DATE_OUTSIDE_SESSION;
  }

  return undefined;
}

/**
 * Validate if a date is a working day using backend API
 */
async function validateWorkingDay(
  classId: string | undefined,
  dateStr: string
): Promise<string | undefined> {
  if (!classId) {
    return undefined;
  }

  try {
    const response = await validateAttendanceDate(classId, dateStr);
    if (!response.is_working_day) {
      return response.reason || ValidationMessages.EXAM.DATE_IS_HOLIDAY;
    }
  } catch {
    // If validation API fails, allow the date (server will validate on submit)
  }

  return undefined;
}

/**
 * Full exam date validation
 */
export async function validateExamDate(
  date: Date | null,
  session: SessionDateRange | undefined,
  classIdForValidation: string | undefined
): Promise<string | undefined> {
  if (!date) {
    return undefined;
  }

  const rangeError = validateDateInSessionRange(date, session);
  if (rangeError) {
    return rangeError;
  }

  const dateStr = format(date, 'yyyy-MM-dd');
  return validateWorkingDay(classIdForValidation, dateStr);
}

/**
 * Validate required fields for exam form submission
 */
export function validateExamFormFields(params: {
  sessionId: string;
  classId: string;
  subjectId: string;
  status: string;
  dateError: string | undefined;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!params.sessionId) {
    errors.session_id = ValidationMessages.EXAM.SELECT_SESSION;
  }
  if (!params.classId) {
    errors.class_id = ValidationMessages.EXAM.SELECT_CLASS;
  }
  if (!params.subjectId) {
    errors.subject_id = ValidationMessages.EXAM.SELECT_SUBJECT;
  }
  if (!params.status) {
    errors.status = ValidationMessages.EXAM.SELECT_STATUS;
  }
  if (params.dateError) {
    errors.date = params.dateError;
  }

  return errors;
}

/**
 * Build create payload for exam
 */
export function buildExamCreatePayload(params: {
  sessionId: string;
  subjectId: string;
  status: ExamStatus;
  maxMarks: string;
  passingMarks: string;
  examDate: Date | null;
  startTime: string;
  endTime: string;
  description: string;
}): ExamCreatePayload {
  return {
    session_id: params.sessionId,
    subject_id: params.subjectId,
    status: params.status,
    max_marks: Number(params.maxMarks),
    passing_marks: Number(params.passingMarks),
    date: formatDateForAPI(params.examDate) || null,
    start_time: params.startTime || null,
    end_time: params.endTime || null,
    description: params.description.trim(),
  };
}

/**
 * Build update payload for exam
 */
export function buildExamUpdatePayload(params: {
  status: ExamStatus;
  maxMarks: string;
  passingMarks: string;
  examDate: Date | null;
  startTime: string;
  endTime: string;
  description: string;
}): ExamUpdatePayload {
  return {
    status: params.status,
    max_marks: Number(params.maxMarks),
    passing_marks: Number(params.passingMarks),
    date: formatDateForAPI(params.examDate) || null,
    start_time: params.startTime || null,
    end_time: params.endTime || null,
    description: params.description.trim(),
  };
}
