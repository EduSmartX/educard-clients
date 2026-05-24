/**
 * Exam Session Form Page
 * Create / Edit / View exam session
 * Solid, grounded form layout with proper structure
 *
 * Role-based access:
 * - Admin: Full access (create, edit, view)
 * - Teacher: View only
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import { PageHeader, FormActions } from '@/components/common';
import { ROUTES, ValidationMessages } from '@/constants';
import { formatDateForAPI, parseDate } from '@/lib/utils/date-utils';
import { useExamSession } from '../hooks/use-exams';
import { useCreateExamSession, useUpdateExamSession } from '../hooks/mutations';
import { useAcademicYears } from '@/features/organizations/hooks/queries';
import { useRole } from '@/hooks/use-role';
import {
  EXAM_SESSION_TYPE_OPTIONS,
  EXAM_SESSION_TYPE_LABELS,
  type ExamSessionType,
} from '@educard/shared';

function validateSessionForm(
  name: string,
  sessionType: ExamSessionType | '',
  academicYear: string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!name.trim()) {
    errors.name = ValidationMessages.EXAM_SESSION.ENTER_NAME;
  }
  if (!sessionType) {
    errors.session_type = ValidationMessages.EXAM_SESSION.SELECT_TYPE;
  }
  if (!academicYear.trim()) {
    errors.academic_year = ValidationMessages.EXAM_SESSION.SELECT_ACADEMIC_YEAR;
  }
  return errors;
}

export function ExamSessionFormPage() {
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
      navigate(ROUTES.EXAMS, { replace: true });
    }
  }, [isAdmin, isCreate, isEdit, navigate]);

  const { data: existingSession, isLoading: isLoadingSession } = useExamSession(id);
  const { data: academicYears = [], isLoading: _isLoadingAcademicYears } = useAcademicYears();

  // Form state
  const [name, setName] = useState('');
  const [sessionType, setSessionType] = useState<ExamSessionType | ''>('');
  const [academicYear, setAcademicYear] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Set defaults when creating
  useEffect(() => {
    if (!isCreate) {
      return;
    }
    if (!sessionType) {
      setSessionType('unit_test');
    }
    if (academicYears.length === 0 || academicYear) {
      return;
    }
    const currentYear = academicYears.find((y) => y.is_current);
    if (currentYear) {
      setAcademicYear(currentYear.name);
    }
  }, [isCreate, academicYears, academicYear, sessionType]);

  // Populate form when editing
  useEffect(() => {
    if (existingSession) {
      setName(existingSession.name);
      setSessionType(existingSession.session_type);
      setDescription(existingSession.description || '');
      setStartDate(parseDate(existingSession.start_date));
      setEndDate(parseDate(existingSession.end_date));
    }
  }, [existingSession]);

  // Set academic year after academicYears list loads (needed for Select to match)
  useEffect(() => {
    if (existingSession && academicYears.length > 0 && !academicYear) {
      setAcademicYear(existingSession.academic_year);
    }
  }, [existingSession, academicYears, academicYear]);

  const createMutation = useCreateExamSession({
    onSuccess: () => navigate(ROUTES.EXAMS),
    onError: (_err, errors) => {
      if (errors) {
        setFieldErrors(errors as Record<string, string>);
      }
    },
  });

  const updateMutation = useUpdateExamSession({
    onSuccess: () => navigate(ROUTES.EXAMS),
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

    const errors = validateSessionForm(name, sessionType, academicYear);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name: name.trim(),
      session_type: sessionType as ExamSessionType,
      academic_year: academicYear.trim(),
      description: description.trim(),
      start_date: formatDateForAPI(startDate) || null,
      end_date: formatDateForAPI(endDate) || null,
    };

    if (isCreate) {
      createMutation.mutate(payload);
    } else if (isEdit && id) {
      updateMutation.mutate({ id, data: payload });
    }
  };

  let title = 'View Exam Session';
  if (isCreate) {
    title = 'Create Exam Session';
  } else if (isEdit) {
    title = 'Edit Exam Session';
  }

  if (id && isLoadingSession) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={title}>
        <Button variant="brandOutline" onClick={() => navigate(ROUTES.EXAMS)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
      </PageHeader>

      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b px-6 py-4">
          <CardTitle className="text-lg">Session Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Session Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Unit Test 1, Half Yearly"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isView}
                  className={fieldErrors.name ? 'border-red-500' : ''}
                />
                {!!fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
              </div>

              {/* Session Type */}
              <div className="space-y-2">
                <Label htmlFor="session_type">
                  Session Type <span className="text-red-500">*</span>
                </Label>
                {isView ? (
                  <Input
                    value={
                      sessionType ? EXAM_SESSION_TYPE_LABELS[sessionType as ExamSessionType] : '-'
                    }
                    disabled
                    className="bg-gray-50"
                  />
                ) : (
                  <SearchableSelect
                    key={`session-type-${sessionType || 'empty'}`}
                    options={EXAM_SESSION_TYPE_OPTIONS.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    value={sessionType || ''}
                    onValueChange={(v) => setSessionType(v as ExamSessionType)}
                    placeholder="Select type"
                    className={fieldErrors.session_type ? 'border-red-500' : ''}
                  />
                )}
                {!!fieldErrors.session_type && (
                  <p className="text-sm text-red-500">{fieldErrors.session_type}</p>
                )}
              </div>

              {/* Academic Year */}
              <div className="space-y-2">
                <Label htmlFor="academic_year">
                  Academic Year <span className="text-red-500">*</span>
                </Label>
                {isView ? (
                  <Input value={academicYear || '-'} disabled className="bg-gray-50" />
                ) : (
                  <SearchableSelect
                    key={`academic-year-${academicYear || 'empty'}`}
                    options={academicYears.map((year) => ({
                      value: year.name,
                      label: `${year.name}${year.is_current ? ' (Current)' : ''}`,
                    }))}
                    value={academicYear || ''}
                    onValueChange={setAcademicYear}
                    placeholder="Select academic year"
                    className={fieldErrors.academic_year ? 'border-red-500' : ''}
                  />
                )}
                {!!fieldErrors.academic_year && (
                  <p className="text-sm text-red-500">{fieldErrors.academic_year}</p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Select start date"
                  disabled={isView}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Select end date"
                  disabled={isView}
                  minDate={startDate || undefined}
                  className={fieldErrors.end_date ? 'border-red-500' : ''}
                />
                {!!fieldErrors.end_date && (
                  <p className="text-sm text-red-500">{fieldErrors.end_date}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description for this exam session..."
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
                  label: isCreate ? 'Create Session' : 'Save Changes',
                  type: 'submit',
                  icon: isCreate ? 'create' : 'save',
                  isLoading: isPending,
                  disabled: isPending,
                }}
                secondaryAction={{
                  label: 'Cancel',
                  onClick: () => navigate(ROUTES.EXAMS),
                  icon: 'cancel',
                }}
              />
            )}

            {/* View mode: Edit button */}
            {isView && (
              <FormActions
                primaryAction={{
                  label: 'Edit Session',
                  onClick: () => navigate(ROUTES.EXAM_SESSIONS_EDIT.replace(':id', id!)),
                  type: 'button',
                  style: 'info',
                }}
                secondaryAction={{
                  label: 'Back',
                  onClick: () => navigate(ROUTES.EXAMS),
                  icon: 'back',
                }}
              />
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExamSessionFormPage;
