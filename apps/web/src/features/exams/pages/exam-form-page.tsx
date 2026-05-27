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
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageHeader, FormActions, WarningConfirmationDialog } from '@/components/common';
import { ROUTES } from '@/constants';
import { parseDate } from '@/lib/utils/date-utils';
import { useExam, useExamSessions, useExams } from '../hooks/use-exams';
import { useCreateExam, useUpdateExam } from '../hooks/mutations';
import { useSubjects } from '@/features/subjects/hooks/use-subjects';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useRole } from '@/hooks/use-role';
import { type ExamStatus, type ExamCreatePayload } from '@educard/shared';
import {
  validateExamDate,
  validateExamFormFields,
  buildExamCreatePayload,
  buildExamUpdatePayload,
} from '../utils/exam-form-helpers';
import { ExamFormFields } from '../components/exam-form-fields';

function getExamFormTitle(isCreate: boolean, isEdit: boolean): string {
  if (isCreate) {
    return 'Create Exam';
  }
  if (isEdit) {
    return 'Edit Exam';
  }
  return 'View Exam';
}

function findDuplicateExam(
  isCreate: boolean,
  sessionId: string,
  subjectId: string,
  existingExams: Array<{ subject_public_id: string; public_id: string }>
) {
  if (!isCreate || !sessionId || !subjectId) {
    return null;
  }
  return existingExams.find((exam) => exam.subject_public_id === subjectId) || null;
}

function shouldRedirectNonAdmin(isAdmin: boolean, isCreate: boolean, isEdit: boolean): boolean {
  return !isAdmin && (isCreate || isEdit);
}

function getExamFormActionsConfig(
  isView: boolean,
  isCreate: boolean,
  isPending: boolean,
  navigateToList: () => void,
  navigateToEdit: () => void
) {
  if (isView) {
    return {
      primaryAction: {
        label: 'Edit Exam',
        onClick: navigateToEdit,
        type: 'button' as const,
        style: 'info' as const,
      },
      secondaryAction: {
        label: 'Back',
        onClick: navigateToList,
        icon: 'back' as const,
      },
    };
  }
  return {
    primaryAction: {
      label: isCreate ? 'Create Exam' : 'Save Changes',
      type: 'submit',
      icon: isCreate ? 'create' : 'save',
      isLoading: isPending,
      disabled: isPending,
    },
    secondaryAction: {
      label: 'Cancel',
      onClick: navigateToList,
      icon: 'cancel' as const,
    },
  };
}

export function ExamFormPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const location = useLocation();
  const { isAdmin } = useRole();

  const isEdit = location.pathname.includes('/edit');
  const isView = !!id && !isEdit;
  const isCreate = !id;

  // Non-admin users can only view, not create or edit
  useEffect(() => {
    if (shouldRedirectNonAdmin(isAdmin, isCreate, isEdit)) {
      navigate(ROUTES.EXAMS_LIST, { replace: true });
    }
  }, [isAdmin, isCreate, isEdit, navigate]);

  const { data: existingExam, isLoading: isLoadingExam } = useExam(id);
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({ page: 1, page_size: 200 });

  // Form state - add classId for filtering subjects
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
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
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<ExamCreatePayload | null>(null);

  // Only fetch subjects for the selected class
  const { data: subjectsData } = useSubjects(
    classId ? { page: 1, page_size: 200, class_assigned: classId } : { page: 1, page_size: 0 }
  );

  // Fetch existing exams for duplicate detection (only when creating)
  const { data: existingExamsData } = useExams(
    isCreate && sessionId
      ? { page: 1, page_size: 500, session: sessionId }
      : { page: 1, page_size: 0 }
  );

  const sessionsList = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const classesList = useMemo(() => classesData?.data || [], [classesData]);
  const subjectsList = useMemo(() => subjectsData?.data || [], [subjectsData]);
  const existingExams = useMemo(() => existingExamsData?.data || [], [existingExamsData]);

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
   */
  const handleExamDateChange = async (date: Date | null) => {
    setExamDate(date);
    const error = await validateExamDate(date, selectedSession, classIdForValidation);
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
      setClassId(existingExam.class_public_id);
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

  // Check if exam already exists for this session + subject
  const checkDuplicateExam = useMemo(
    () => findDuplicateExam(isCreate, sessionId, subjectId, existingExams),
    [isCreate, sessionId, subjectId, existingExams]
  );

  const createMutation = useCreateExam({
    onSuccess: () => {
      setShowDuplicateWarning(false);
      setPendingPayload(null);
      navigate(ROUTES.EXAMS_LIST);
    },
    onError: (_err, errors) => {
      setFieldErrors((errors as Record<string, string>) || {});
    },
  });

  const updateMutation = useUpdateExam({
    onSuccess: () => navigate(ROUTES.EXAMS_LIST),
    onError: (_err, errors) => {
      setFieldErrors((errors as Record<string, string>) || {});
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = validateExamFormFields({
      sessionId,
      classId,
      subjectId,
      status,
      dateError,
      startTime,
      endTime,
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (isEdit && id) {
      const payload = buildExamUpdatePayload({
        status: status as ExamStatus,
        maxMarks,
        passingMarks,
        examDate,
        startTime,
        endTime,
        description,
      });
      updateMutation.mutate({ id, data: payload });
      return;
    }

    const payload = buildExamCreatePayload({
      sessionId,
      subjectId,
      status: status as ExamStatus,
      maxMarks,
      passingMarks,
      examDate,
      startTime,
      endTime,
      description,
    });

    if (checkDuplicateExam) {
      setPendingPayload(payload);
      setShowDuplicateWarning(true);
      return;
    }

    createMutation.mutate(payload);
  };

  const title = getExamFormTitle(isCreate, isEdit);
  const isLoadingState = Boolean(id && isLoadingExam);

  if (isLoadingState) {
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
        <Button
          variant="brandOutline"
          onClick={() => navigate(ROUTES.EXAMS_LIST)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam Details Card */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/30 border-b px-6 py-4">
            <CardTitle className="text-lg">Exam Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ExamFormFields
              isView={isView}
              isEdit={isEdit}
              existingExam={existingExam}
              sessionId={sessionId}
              setSessionId={setSessionId}
              classId={classId}
              setClassId={setClassId}
              subjectId={subjectId}
              setSubjectId={setSubjectId}
              status={status}
              setStatus={setStatus}
              maxMarks={maxMarks}
              setMaxMarks={setMaxMarks}
              passingMarks={passingMarks}
              setPassingMarks={setPassingMarks}
              examDate={examDate}
              onExamDateChange={handleExamDateChange}
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              sessionsList={sessionsList}
              classesList={classesList}
              subjectsList={subjectsList}
              selectedSession={selectedSession}
              selectedSubject={selectedSubject}
              checkDuplicateExam={checkDuplicateExam}
              fieldErrors={fieldErrors}
              dateError={dateError}
            />

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
            <FormActions
              {...getExamFormActionsConfig(
                isView,
                isCreate,
                isPending,
                () => navigate(ROUTES.EXAMS_LIST),
                () => navigate(ROUTES.EXAMS_EDIT.replace(':id', id))
              )}
            />
          </CardContent>
        </Card>
      </form>

      {/* Duplicate Exam Warning Dialog */}
      <WarningConfirmationDialog
        open={showDuplicateWarning}
        onOpenChange={setShowDuplicateWarning}
        title="Exam Already Exists"
        description={
          <>
            An exam for <strong>{selectedSubject?.subject_info.name}</strong> already exists in this
            session.
          </>
        }
        warningText="Do you want to edit the existing exam instead?"
        cancelButtonText="Cancel"
        confirmButtonText="Create Anyway"
        onCancel={() => setPendingPayload(null)}
        onConfirm={() => {
          if (pendingPayload) {
            createMutation.mutate(pendingPayload);
          }
        }}
        secondaryAction={{
          label: 'Edit Existing',
          onClick: () => {
            setShowDuplicateWarning(false);
            if (checkDuplicateExam) {
              navigate(ROUTES.EXAMS_EDIT.replace(':id', checkDuplicateExam.public_id));
            }
          },
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}

export default ExamFormPage;
