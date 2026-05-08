/**
 * Exam Form Page
 * Create / Edit / View an exam (session + subject)
 * New model: Exam is linked to session and subject (class comes from subject)
 * 
 * Role-based access:
 * - Admin: Full access (create, edit, view)
 * - Teacher: View only
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, CalendarDays, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PageHeader, FormActions } from '@/components/common';
import { ROUTES } from '@/constants';
import { ValidationMessages } from '@/constants';
import { formatDateForAPI, parseDate } from '@/lib/utils/date-utils';
import { useExam, useExamSessions } from '../hooks/use-exams';
import { useCreateExam, useUpdateExam } from '../hooks/mutations';
import { useSubjects } from '@/features/subjects/hooks/use-subjects';
import { useRole } from '@/hooks/use-role';
import { validateAttendanceDate } from '@/features/attendance/api/attendance-api';
import {
  EXAM_STATUS_OPTIONS,
  EXAM_STATUS_LABELS,
  type ExamStatus,
  type ExamCreatePayload,
  type ExamUpdatePayload,
} from '../types';

export function ExamFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { isAdmin } = useRole();
  
  const isEdit = location.pathname.includes('/edit');
  const isView = !!id && !isEdit;
  const isCreate = !id;

  // Non-admin users can only view, not create or edit
  useEffect(() => {
    if (!isAdmin && (isCreate || isEdit)) {
      navigate(ROUTES.EXAMS_LIST, { replace: true });
    }
  }, [isAdmin, isCreate, isEdit, navigate]);

  const { data: existingExam, isLoading: isLoadingExam } = useExam(id);
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: subjectsData } = useSubjects({ page: 1, page_size: 200 });

  const sessionsList = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const subjectsList = useMemo(() => subjectsData?.data || [], [subjectsData]);

  // Form state
  const [sessionId, setSessionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<ExamStatus | ''>('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('35');
  const [examDate, setExamDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dateError, setDateError] = useState<string | undefined>();

  // Get the selected session to display its date range
  const selectedSession = useMemo(
    () => sessionsList.find((s) => s.public_id === sessionId),
    [sessionsList, sessionId]
  );

  // Get class ID from selected subject for date validation
  const classIdForValidation = useMemo(() => {
    const subject = subjectsList.find((s) => s.public_id === subjectId);
    return subject?.class_info?.public_id;
  }, [subjectsList, subjectId]);

  /**
   * Validate if a date is a valid exam date
   * - Must be within session date range
   * - Must not be a holiday (uses backend validation API)
   */
  const validateExamDate = async (date: Date | null): Promise<string | undefined> => {
    if (!date) {
      return undefined;
    }

    const dateStr = format(date, 'yyyy-MM-dd');

    // Check if date is within session range
    if (selectedSession?.start_date && selectedSession?.end_date) {
      const sessionStart = new Date(selectedSession.start_date);
      const sessionEnd = new Date(selectedSession.end_date);
      // Reset times for date comparison
      sessionStart.setHours(0, 0, 0, 0);
      sessionEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < sessionStart || checkDate > sessionEnd) {
        return ValidationMessages.EXAM.DATE_OUTSIDE_SESSION;
      }
    }

    // Use backend API to validate if date is a working day
    if (classIdForValidation) {
      try {
        const response = await validateAttendanceDate(classIdForValidation, dateStr);
        if (!response.is_working_day) {
          return response.reason || ValidationMessages.EXAM.DATE_IS_HOLIDAY;
        }
      } catch {
        // If validation API fails, allow the date (server will validate on submit)
        console.warn('Date validation API failed, proceeding without holiday check');
      }
    }

    return undefined;
  };

  // Handle exam date change with validation
  const handleExamDateChange = async (date: Date | null) => {
    setExamDate(date);
    const error = await validateExamDate(date);
    setDateError(error);
  };

  // Set default status for create mode
  useEffect(() => {
    if (isCreate && !status) {
      setStatus('scheduled');
    }
  }, [isCreate, status]);

  // Populate form when editing
  useEffect(() => {
    if (existingExam) {
      setSessionId(existingExam.session_public_id);
      setSubjectId(existingExam.subject_public_id);
      setStatus(existingExam.status);
      setMaxMarks(String(existingExam.max_marks));
      setPassingMarks(String(existingExam.passing_marks));
      setExamDate(parseDate(existingExam.date));
      setStartTime(existingExam.start_time || '');
      setEndTime(existingExam.end_time || '');
      setDescription(existingExam.description || '');
    }
  }, [existingExam]);

  const createMutation = useCreateExam({
    onSuccess: () => navigate(ROUTES.EXAMS_LIST),
    onError: (_err, errors) => {
      if (errors) {
        setFieldErrors(errors as Record<string, string>);
      }
    },
  });

  const updateMutation = useUpdateExam({
    onSuccess: () => navigate(ROUTES.EXAMS_LIST),
    onError: (_err, errors) => {
      if (errors) {
        setFieldErrors(errors as Record<string, string>);
      }
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Basic validation
    const errors: Record<string, string> = {};
    if (!sessionId) {
      errors.session_id = ValidationMessages.EXAM.SELECT_SESSION;
    }
    if (!subjectId) {
      errors.subject_id = ValidationMessages.EXAM.SELECT_SUBJECT;
    }
    if (!status) {
      errors.status = ValidationMessages.EXAM.SELECT_STATUS;
    }

    // Date validation
    if (dateError) {
      errors.date = dateError;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (isCreate) {
      const payload: ExamCreatePayload = {
        session_id: sessionId,
        subject_id: subjectId,
        status: status as ExamStatus,
        max_marks: Number(maxMarks),
        passing_marks: Number(passingMarks),
        date: formatDateForAPI(examDate) || null,
        start_time: startTime || null,
        end_time: endTime || null,
        description: description.trim(),
      };
      createMutation.mutate(payload);
    } else if (isEdit && id) {
      const payload: ExamUpdatePayload = {
        status: status as ExamStatus,
        max_marks: Number(maxMarks),
        passing_marks: Number(passingMarks),
        date: formatDateForAPI(examDate) || null,
        start_time: startTime || null,
        end_time: endTime || null,
        description: description.trim(),
      };
      updateMutation.mutate({ id, data: payload });
    }
  };

  const title = isCreate ? 'Create Exam' : isEdit ? 'Edit Exam' : 'View Exam';

  if (id && isLoadingExam) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Get selected subject info for display
  const selectedSubject = subjectsList.find((s) => s.public_id === subjectId);

  return (
    <div className="space-y-6">
      <PageHeader title={title}>
        <Button variant="brandOutline" onClick={() => navigate(ROUTES.EXAMS_LIST)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Details Card */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b bg-muted/30 px-6 py-4">
            <CardTitle className="text-lg">Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Exam Session */}
              <div className="space-y-2">
                <Label htmlFor="session_id">
                  Exam Session <span className="text-red-500">*</span>
                </Label>
                {isView ? (
                  <Input
                    value={existingExam?.session_name || '-'}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    key={`session-${sessionId || 'empty'}`}
                    value={sessionId}
                    onValueChange={setSessionId}
                    disabled={isEdit}
                  >
                    <SelectTrigger className={fieldErrors.session_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionsList.map((session) => (
                        <SelectItem key={session.public_id} value={session.public_id}>
                          {session.name} ({session.academic_year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldErrors.session_id && (
                  <p className="text-sm text-red-500">{fieldErrors.session_id}</p>
                )}
                {/* Session Date Range */}
                {selectedSession && (selectedSession.start_date || selectedSession.end_date) && (
                  <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span className="font-medium">
                      {selectedSession.start_date
                        ? format(new Date(selectedSession.start_date), 'dd MMM yyyy')
                        : 'N/A'}
                      {' → '}
                      {selectedSession.end_date
                        ? format(new Date(selectedSession.end_date), 'dd MMM yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              {/* Subject (includes class) */}
              <div className="space-y-2">
                <Label htmlFor="subject_id">
                  Subject <span className="text-red-500">*</span>
                </Label>
                {isView ? (
                  <Input
                    value={existingExam ? `${existingExam.subject_name} - ${existingExam.class_name}` : '-'}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    key={`subject-${subjectId || 'empty'}`}
                    value={subjectId}
                    onValueChange={setSubjectId}
                    disabled={isEdit}
                  >
                    <SelectTrigger className={fieldErrors.subject_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsList.map((subject) => (
                        <SelectItem key={subject.public_id} value={subject.public_id}>
                          {subject.subject_info.name} - {subject.class_info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldErrors.subject_id && (
                  <p className="text-sm text-red-500">{fieldErrors.subject_id}</p>
                )}
                {!isView && selectedSubject && (
                  <p className="text-xs text-gray-500">
                    Class: {selectedSubject.class_info.name}
                  </p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                {isView ? (
                  <Input
                    value={status ? EXAM_STATUS_LABELS[status as ExamStatus] : '-'}
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <Select
                    key={`status-${status || 'empty'}`}
                    value={status}
                    onValueChange={(v) => setStatus(v as ExamStatus)}
                  >
                    <SelectTrigger className={fieldErrors.status ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldErrors.status && (
                  <p className="text-sm text-red-500">{fieldErrors.status}</p>
                )}
              </div>

              {/* Max Marks */}
              <div className="space-y-2">
                <Label htmlFor="max_marks">Maximum Marks</Label>
                <Input
                  id="max_marks"
                  type="number"
                  min="1"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  disabled={isView}
                />
              </div>

              {/* Passing Marks */}
              <div className="space-y-2">
                <Label htmlFor="passing_marks">Passing Marks</Label>
                <Input
                  id="passing_marks"
                  type="number"
                  min="0"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(e.target.value)}
                  disabled={isView}
                />
              </div>

              {/* Exam Date */}
              <div className="space-y-2">
                <Label htmlFor="exam_date">Exam Date</Label>
                <DatePicker
                  value={examDate}
                  onChange={handleExamDateChange}
                  placeholder="Select exam date"
                  disabled={isView}
                  className={dateError ? 'border-red-500' : ''}
                />
                {dateError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{dateError}</span>
                  </div>
                )}
                {fieldErrors.date && !dateError && (
                  <p className="text-sm text-red-500">{fieldErrors.date}</p>
                )}
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isView}
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isView}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this exam..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isView}
                rows={3}
              />
            </div>

            {/* Actions */}
            {!isView && (
              <FormActions
                primaryAction={{
                  label: isCreate ? 'Create Exam' : 'Save Changes',
                  type: 'submit',
                  icon: isCreate ? 'create' : 'save',
                  isLoading: isPending,
                  disabled: isPending,
                }}
                secondaryAction={{
                  label: 'Cancel',
                  onClick: () => navigate(ROUTES.EXAMS_LIST),
                  icon: 'cancel',
                }}
              />
            )}

            {isView && (
              <FormActions
                primaryAction={{
                  label: 'Edit Exam',
                  onClick: () => navigate(ROUTES.EXAMS_EDIT.replace(':id', id!)),
                  type: 'button',
                  style: 'info',
                }}
                secondaryAction={{
                  label: 'Back',
                  onClick: () => navigate(ROUTES.EXAMS_LIST),
                  icon: 'back',
                }}
              />
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default ExamFormPage;
