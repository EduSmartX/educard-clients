/**
 * Bulk Exam Create Page
 * Create multiple exams at once for all subjects in a selected class
 *
 * Role-based access:
 * - Admin only: Non-admins are redirected to exams list
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  CalendarDays,
  AlertTriangle,
  CopyCheck,
  ChevronDown,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PageHeader, FormActions, WarningConfirmationDialog } from '@/components/common';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES, ValidationMessages } from '@/constants';
import { formatDateForAPI } from '@/lib/utils/date-utils';
import { useExamSessions, useExams } from '../hooks/use-exams';
import { useSubjects } from '@/features/subjects/hooks/use-subjects';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useRole } from '@/hooks/use-role';
import { bulkCreateExams } from '../api/exams-api';
import { validateAttendanceDate } from '@/features/attendance/api/attendance-api';
import type { BulkExamCreatePayload, BulkExamItem } from '@educard/shared';

// Subject row state for the table
interface SubjectRow {
  subject_id: string;
  subject_name: string;
  selected: boolean;
  max_marks: string;
  passing_marks: string;
  date: Date | null;
  start_time: string;
  end_time: string;
  dateError?: string; // Date validation error message
}

/** Validate the bulk exam form before submission */
function validateBulkExamForm(
  sessionId: string,
  classId: string,
  subjectRows: SubjectRow[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!sessionId) {
    errors.session_id = ValidationMessages.EXAM.SELECT_SESSION;
  }
  if (!classId) {
    errors.class_id = ValidationMessages.EXAM.SELECT_CLASS;
  }

  const selectedRows = subjectRows.filter((row) => row.selected);
  if (selectedRows.length === 0) {
    errors.subjects = ValidationMessages.EXAM.SELECT_AT_LEAST_ONE_SUBJECT;
  }

  // Validate start_time < end_time for each selected row
  const timeErrors: string[] = [];
  selectedRows.forEach((row) => {
    if (row.start_time && row.end_time && row.start_time >= row.end_time) {
      timeErrors.push(row.subject_name);
    }
  });
  if (timeErrors.length > 0) {
    errors.time = `End time must be after start time for: ${timeErrors.join(', ')}`;
  }

  const rowsWithDateErrors = selectedRows.filter((row) => row.date && row.dateError);
  if (rowsWithDateErrors.length > 0) {
    errors.dates = `${rowsWithDateErrors.length} exam(s) have invalid dates. Please fix date errors before submitting.`;
  }

  return errors;
}

/** Map backend error messages to inline row date errors */
function handleBulkCreateErrors(
  allMessages: string[],
  setSubjectRows: React.Dispatch<React.SetStateAction<SubjectRow[]>>
) {
  let hasInlineError = false;
  setSubjectRows((prev) => {
    const updated = [...prev];
    for (const msg of allMessages) {
      const dateRegex = /date\s+(\d{4}-\d{2}-\d{2})/i;
      const dateMatch = dateRegex.exec(msg);
      if (dateMatch) {
        const errorDate = dateMatch[1];
        const rowIdx = updated.findIndex(
          (r) => r.selected && r.date && format(r.date, 'yyyy-MM-dd') === errorDate
        );
        if (rowIdx !== -1) {
          updated[rowIdx] = { ...updated[rowIdx], dateError: msg };
          hasInlineError = true;
        }
      }
    }
    return updated;
  });
  if (!hasInlineError) {
    allMessages.forEach((msg) => toast.error(msg));
  } else {
    toast.error('Please fix the date errors highlighted below.');
  }
}

export function BulkExamCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();

  // Non-admin users cannot access bulk create
  useEffect(() => {
    if (!isAdmin) {
      navigate(ROUTES.EXAMS_LIST, { replace: true });
    }
  }, [isAdmin, navigate]);

  // Selection state
  const [sessionId, setSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [defaultMaxMarks, setDefaultMaxMarks] = useState('100');
  const [defaultPassingMarks, setDefaultPassingMarks] = useState('35');
  const [selectAll, setSelectAll] = useState(false);
  const [subjectRows, setSubjectRows] = useState<SubjectRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showMissingDateTimeWarning, setShowMissingDateTimeWarning] = useState(false);
  const [showDurationWarning, setShowDurationWarning] = useState(false);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState<BulkExamCreatePayload | null>(
    null
  );

  // Data fetching
  const { data: sessionsData, isLoading: isLoadingSessions } = useExamSessions({
    page: 1,
    page_size: 100,
  });
  const { data: classesData, isLoading: isLoadingClasses } = useClasses({
    page: 1,
    page_size: 100,
  });
  const { data: subjectsData, isLoading: isLoadingSubjects } = useSubjects({
    page: 1,
    page_size: 200,
    class_assigned: classId || undefined,
  });

  // Fetch existing exams for session+class to pre-populate
  const { data: existingExamsData } = useExams(
    sessionId && classId ? { session: sessionId, class_id: classId, page_size: 200 } : undefined
  );
  const existingExams = useMemo(() => existingExamsData?.data || [], [existingExamsData]);

  const sessionsList = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const classesList = classesData?.data || [];
  const subjectsList = useMemo(() => subjectsData?.data || [], [subjectsData]);

  // Get the selected session to display its date range
  const selectedSession = useMemo(
    () => sessionsList.find((s) => s.public_id === sessionId),
    [sessionsList, sessionId]
  );

  const validateExamDate = async (date: Date | null): Promise<string | undefined> => {
    if (!date || !classId) {
      return undefined;
    }

    // Check if date is within session range first (client-side check)
    if (selectedSession?.start_date && selectedSession?.end_date) {
      const sessionStart = new Date(selectedSession.start_date);
      const sessionEnd = new Date(selectedSession.end_date);
      sessionStart.setHours(0, 0, 0, 0);
      sessionEnd.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      if (checkDate < sessionStart || checkDate > sessionEnd) {
        return ValidationMessages.EXAM.DATE_OUTSIDE_SESSION;
      }
    }

    // Use backend API to check if it's a working day
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const validation = await validateAttendanceDate(classId, dateStr);
      if (!validation.is_working_day) {
        return validation.reason || ValidationMessages.EXAM.DATE_IS_HOLIDAY;
      }
    } catch {
      // If API fails, allow the date (backend will validate on submit)
    }

    return undefined;
  };

  // Update subject rows when class changes or existing exams load
  useEffect(() => {
    if (!classId || subjectsList.length === 0) {
      setSubjectRows([]);
      setSelectAll(false);
      return;
    }
    const filteredSubjects = subjectsList.filter((s) => s.class_info.public_id === classId);
    setSubjectRows(
      filteredSubjects.map((subject) => {
        // Check if an exam already exists for this subject in the selected session
        const existing = existingExams.find((e) => e.subject_public_id === subject.public_id);
        if (existing) {
          return {
            subject_id: subject.public_id,
            subject_name: `${subject.subject_info.name}`,
            selected: true,
            max_marks: String(existing.max_marks),
            passing_marks: String(existing.passing_marks),
            date: existing.date ? new Date(existing.date) : null,
            start_time: existing.start_time?.slice(0, 5) || '',
            end_time: existing.end_time?.slice(0, 5) || '',
            dateError: undefined,
          };
        }
        return {
          subject_id: subject.public_id,
          subject_name: `${subject.subject_info.name}`,
          selected: false,
          max_marks: defaultMaxMarks,
          passing_marks: defaultPassingMarks,
          date: null,
          start_time: '',
          end_time: '',
          dateError: undefined,
        };
      })
    );
    const allSelected = filteredSubjects.every((s) =>
      existingExams.some((e) => e.subject_public_id === s.public_id)
    );
    setSelectAll(allSelected);
  }, [classId, subjectsList, existingExams, defaultMaxMarks, defaultPassingMarks]);

  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSubjectRows((prev) =>
      prev.map((row) => ({
        ...row,
        selected: checked,
      }))
    );
  };

  // Handle individual row selection
  const handleRowSelect = (index: number, checked: boolean) => {
    setSubjectRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: checked };
      setSelectAll(updated.every((row) => row.selected));
      return updated;
    });
  };

  // Handle row field changes
  const updateRow = async (index: number, field: keyof SubjectRow, value: string | Date | null) => {
    setSubjectRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field !== 'date') {
      return;
    }
    const dateError = await validateExamDate(value as Date | null);
    setSubjectRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], dateError };
      return updated;
    });
  };

  // Apply default marks to all rows
  const applyDefaultMarks = () => {
    setSubjectRows((prev) =>
      prev.map((row) => ({
        ...row,
        max_marks: defaultMaxMarks,
        passing_marks: defaultPassingMarks,
      }))
    );
  };

  // Copy start_time/end_time from previous row
  const copyTimeFromPrevious = useCallback((index: number, field: 'start_time' | 'end_time') => {
    setSubjectRows((prev) => {
      if (index <= 0) {
        return prev;
      }
      const prevValue = prev[index - 1][field];
      if (!prevValue) {
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: prevValue };
      return updated;
    });
  }, []);

  // Apply a time value to all selected rows
  const applyTimeToAllSelected = useCallback((field: 'start_time' | 'end_time', value: string) => {
    if (!value) {
      return;
    }
    setSubjectRows((prev) => prev.map((row) => (row.selected ? { ...row, [field]: value } : row)));
    toast.success(`Applied ${field === 'start_time' ? 'start' : 'end'} time to all selected rows`);
  }, []);

  // Mutation
  const bulkCreateMutation = useMutation({
    mutationFn: bulkCreateExams,
    onSuccess: (data) => {
      toast.success(`Successfully created ${data.length} exam(s)`);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      navigate(ROUTES.EXAMS_LIST);
    },
    onError: (
      error: Error & {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      }
    ) => {
      const respData = error.response?.data;
      const allMessages = respData?.errors ? Object.values(respData.errors).flat() : [];
      if (allMessages.length > 0) {
        handleBulkCreateErrors(allMessages, setSubjectRows);
        return;
      }
      toast.error(respData?.message || error.message || 'Failed to create exams');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const errors = validateBulkExamForm(sessionId, classId, subjectRows);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.dates) {
        toast.error(errors.dates);
      }
      if (errors.time) {
        toast.error(errors.time);
      }
      return;
    }

    // Build payload
    const selectedRows = subjectRows.filter((row) => row.selected);
    const exams: BulkExamItem[] = selectedRows.map((row) => ({
      subject_id: row.subject_id,
      max_marks: Number(row.max_marks) || 100,
      passing_marks: Number(row.passing_marks) || 35,
      date: formatDateForAPI(row.date) || null,
      start_time: row.start_time || null,
      end_time: row.end_time || null,
    }));

    const payload: BulkExamCreatePayload = {
      session_id: sessionId,
      class_id: classId,
      status: 'scheduled', // Default status
      exams,
    };

    const hasIncomplete = selectedRows.some((row) => !row.date || !row.start_time);
    if (hasIncomplete) {
      setPendingSubmitPayload(payload);
      setShowMissingDateTimeWarning(true);
      return;
    }

    // Check if any exam has duration > 5 hours
    const hasLongDuration = selectedRows.some((row) => {
      if (row.start_time && row.end_time) {
        const [sh, sm] = row.start_time.split(':').map(Number);
        const [eh, em] = row.end_time.split(':').map(Number);
        const durationMinutes = eh * 60 + em - (sh * 60 + sm);
        return durationMinutes > 300; // 5 hours = 300 minutes
      }
      return false;
    });
    if (hasLongDuration) {
      setPendingSubmitPayload(payload);
      setShowDurationWarning(true);
      return;
    }

    bulkCreateMutation.mutate(payload);
  };

  const handleConfirmSubmit = () => {
    setShowMissingDateTimeWarning(false);
    setShowDurationWarning(false);
    if (pendingSubmitPayload) {
      bulkCreateMutation.mutate(pendingSubmitPayload);
      setPendingSubmitPayload(null);
    }
  };

  const handleCancelSubmit = () => {
    setShowMissingDateTimeWarning(false);
    setShowDurationWarning(false);
    setPendingSubmitPayload(null);
  };

  const selectedCount = subjectRows.filter((r) => r.selected).length;
  const isLoading = isLoadingSessions || isLoadingClasses;
  const isPending = bulkCreateMutation.isPending;

  const sessionStartLabel = selectedSession?.start_date
    ? format(new Date(selectedSession.start_date), 'dd MMM yyyy')
    : 'N/A';
  const sessionEndLabel = selectedSession?.end_date
    ? format(new Date(selectedSession.end_date), 'dd MMM yyyy')
    : 'N/A';

  return (
    <div className="space-y-6">
      <PageHeader title="Create Exams (Bulk)">
        <Button
          variant="brandOutline"
          onClick={() => navigate(ROUTES.EXAMS_LIST)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}
      {!isLoading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session & Class Selection Card */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-6 py-4">
              <CardTitle className="text-lg">Exam Session & Class</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Exam Session */}
                <div className="space-y-2">
                  <Label htmlFor="session_id">
                    Exam Session <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={sessionsList.map((session) => ({
                      value: session.public_id,
                      label: `${session.name} (${session.academic_year})`,
                    }))}
                    value={sessionId || ''}
                    onValueChange={setSessionId}
                    placeholder="Select session"
                    searchPlaceholder="Search sessions..."
                    className={fieldErrors.session_id ? 'border-red-500' : ''}
                  />
                  {!!fieldErrors.session_id && (
                    <p className="text-sm text-red-500">{fieldErrors.session_id}</p>
                  )}
                  {/* Session Date Range */}
                  {selectedSession && (selectedSession.start_date || selectedSession.end_date) && (
                    <div className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs text-blue-700">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {sessionStartLabel}
                        {' → '}
                        {sessionEndLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Class */}
                <div className="space-y-2">
                  <Label htmlFor="class_id">
                    Class <span className="text-red-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={classesList.map((cls) => ({
                      value: cls.public_id,
                      label: `${cls.class_master?.name || 'Unknown'} - ${cls.name}`,
                    }))}
                    value={classId || ''}
                    onValueChange={setClassId}
                    placeholder="Select class"
                    searchPlaceholder="Search classes..."
                    className={fieldErrors.class_id ? 'border-red-500' : ''}
                  />
                  {!!fieldErrors.class_id && (
                    <p className="text-sm text-red-500">{fieldErrors.class_id}</p>
                  )}
                </div>

                {/* Default Max Marks */}
                <div className="space-y-2">
                  <Label htmlFor="default_max_marks">Default Max Marks</Label>
                  <div className="flex gap-2">
                    <Input
                      id="default_max_marks"
                      type="number"
                      min="1"
                      value={defaultMaxMarks}
                      onChange={(e) => setDefaultMaxMarks(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={applyDefaultMarks}
                      className="whitespace-nowrap"
                    >
                      Apply All
                    </Button>
                  </div>
                </div>

                {/* Default Passing Marks */}
                <div className="space-y-2">
                  <Label htmlFor="default_passing_marks">Default Passing Marks</Label>
                  <Input
                    id="default_passing_marks"
                    type="number"
                    min="0"
                    value={defaultPassingMarks}
                    onChange={(e) => setDefaultPassingMarks(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects Table Card */}
          <Card className="border shadow-sm">
            <CardHeader className="bg-muted/30 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Subjects {classId && `(${subjectRows.length} subjects)`}
                </CardTitle>
                {selectedCount > 0 && (
                  <span className="text-muted-foreground text-sm">{selectedCount} selected</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!classId && (
                <div className="text-muted-foreground flex items-center justify-center py-12">
                  Select a class to view subjects
                </div>
              )}
              {classId && isLoadingSubjects && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              )}
              {classId && !isLoadingSubjects && subjectRows.length === 0 && (
                <div className="text-muted-foreground flex items-center justify-center py-12">
                  No subjects found for this class
                </div>
              )}
              {classId && !isLoadingSubjects && subjectRows.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
                        </TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="w-28">Max Marks</TableHead>
                        <TableHead className="w-28">Pass Marks</TableHead>
                        <TableHead className="w-40">Date</TableHead>
                        <TableHead className="w-28">Start Time</TableHead>
                        <TableHead className="w-28">End Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectRows.map((row, index) => (
                        <TableRow
                          key={row.subject_id}
                          className={row.selected ? 'bg-muted/30' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={row.selected}
                              onCheckedChange={(checked) =>
                                handleRowSelect(index, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{row.subject_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={row.max_marks}
                              onChange={(e) => updateRow(index, 'max_marks', e.target.value)}
                              disabled={!row.selected}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={row.passing_marks}
                              onChange={(e) => updateRow(index, 'passing_marks', e.target.value)}
                              disabled={!row.selected}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <DatePicker
                                value={row.date}
                                onChange={(date) => updateRow(index, 'date', date)}
                                disabled={!row.selected}
                                placeholder="Select date"
                                className={`h-8 ${row.dateError ? 'border-red-500' : ''}`}
                              />
                              {!!row.dateError && (
                                <div className="flex items-center gap-1 text-xs text-red-500">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{row.dateError}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="time"
                                value={row.start_time}
                                onChange={(e) => updateRow(index, 'start_time', e.target.value)}
                                disabled={!row.selected}
                                className="h-8"
                              />
                              {row.selected && index > 0 && subjectRows[index - 1].start_time && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary h-7 w-7 shrink-0"
                                        onClick={() => copyTimeFromPrevious(index, 'start_time')}
                                      >
                                        <CopyCheck className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Copy from above ({subjectRows[index - 1].start_time})</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {row.selected && row.start_time && selectedCount > 1 && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary h-7 w-7 shrink-0"
                                        onClick={() =>
                                          applyTimeToAllSelected('start_time', row.start_time)
                                        }
                                      >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Apply to all selected</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="time"
                                value={row.end_time}
                                onChange={(e) => updateRow(index, 'end_time', e.target.value)}
                                disabled={!row.selected}
                                className="h-8"
                              />
                              {row.selected && index > 0 && subjectRows[index - 1].end_time && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary h-7 w-7 shrink-0"
                                        onClick={() => copyTimeFromPrevious(index, 'end_time')}
                                      >
                                        <CopyCheck className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Copy from above ({subjectRows[index - 1].end_time})</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {row.selected && row.end_time && selectedCount > 1 && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-primary h-7 w-7 shrink-0"
                                        onClick={() =>
                                          applyTimeToAllSelected('end_time', row.end_time)
                                        }
                                      >
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p>Apply to all selected</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!!fieldErrors.subjects && (
                <p className="px-6 py-3 text-sm text-red-500">{fieldErrors.subjects}</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <FormActions
            primaryAction={{
              label: `Create ${selectedCount} Exam(s)`,
              type: 'submit',
              isLoading: isPending,
              disabled: selectedCount === 0,
            }}
            secondaryAction={{
              label: 'Cancel',
              onClick: () => navigate(ROUTES.EXAMS_LIST),
            }}
          />
        </form>
      )}

      {/* Warning Dialog for missing date/time */}
      <WarningConfirmationDialog
        open={showMissingDateTimeWarning}
        onOpenChange={setShowMissingDateTimeWarning}
        onCancel={handleCancelSubmit}
        onConfirm={handleConfirmSubmit}
        title="Missing Exam Date or Start Time"
        description="Some of the selected exams are missing a date or start time. These exams will be created without a schedule."
        warningText="Are you sure you want to continue?"
        confirmButtonText="Continue Anyway"
        cancelButtonText="Go Back"
      />

      {/* Warning Dialog for exam duration > 5 hours */}
      <WarningConfirmationDialog
        open={showDurationWarning}
        onOpenChange={setShowDurationWarning}
        onCancel={handleCancelSubmit}
        onConfirm={handleConfirmSubmit}
        title="Exam Duration Exceeds 5 Hours"
        description="One or more exams have a duration greater than 5 hours. This is unusual for a single exam sitting."
        warningText="Are you sure you want to continue with this duration?"
        confirmButtonText="Yes, Continue"
        cancelButtonText="Go Back & Fix"
      />
    </div>
  );
}
