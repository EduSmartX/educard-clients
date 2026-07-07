/**
 * Marks Entry Page
 *
 * Enter/update marks for a specific exam (subject + class).
 * - Select session → select completed exam → shows all students
 * - Pre-loads existing marks from the by-exam endpoint
 * - Saves via bulk-upsert to the JSONB marks_data field
 * - Supports keyboard navigation (↑↓ Enter to move between rows)
 *
 * Access: Admin, Class Teacher, Subject Teacher
 * Only completed exams allow marks entry.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Users,
  BadgeCheck,
  Undo2,
  ClipboardEdit,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PageHeader, StudentAvatar } from '@/components/common';
import { ROUTES, ValidationMessages } from '@/constants';
import { useExamSessions, useExams } from '../hooks/use-exams';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { usePublishExamMarks, useUnpublishExamMarks } from '../hooks/mutations';
import {
  bulkUpsertMarks,
  fetchMarksByExam,
  type BulkMarkUpsertPayload,
  type ExamMarkEntry,
} from '../api/exams-api';
import { fetchStudents } from '@/features/students/api/students-api';
import type { Exam, BulkMarkEntry } from '@educard/shared';

interface StudentMarkRow {
  student_id: string;
  student_name: string;
  roll_number: string;
  photo_url?: string | null;
  marks_obtained: string;
  is_absent: boolean;
  marksError?: string;
  hasExistingMarks: boolean;
}

export function MarksEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Pre-select from URL params (from exams list page redirect)
  const initialSessionId = searchParams.get('session') || '';
  const initialClassId = searchParams.get('class') || '';
  const initialExamId = searchParams.get('exam') || '';

  // Selection state: Session → Class → Subject/Exam
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);

  // Data queries
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({ page: 1, page_size: 200 });
  const { data: examsData, isLoading: examsLoading } = useExams({
    page: 1,
    page_size: 200,
    session: selectedSessionId || undefined,
  });

  const sessions = sessionsData?.data || [];
  const classes = classesData?.data || [];
  const exams = useMemo(() => examsData?.data || [], [examsData?.data]);

  // Filter exams: completed + matching selected class
  const filteredExams = useMemo(
    () =>
      exams.filter(
        (e) =>
          e.status === 'completed' && (!selectedClassId || e.class_public_id === selectedClassId)
      ),
    [exams, selectedClassId]
  );

  // Selected exam
  const selectedExam: Exam | undefined = useMemo(
    () => exams.find((e) => e.public_id === selectedExamId),
    [exams, selectedExamId]
  );

  // Fetch students for the class
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-marks', selectedExam?.class_public_id],
    queryFn: () =>
      fetchStudents({ class_assigned__public_id: selectedExam!.class_public_id, page_size: 200 }),
    enabled: !!selectedExam?.class_public_id,
  });

  // Fetch existing marks for the selected exam
  const { data: existingMarksData, isLoading: existingMarksLoading } = useQuery({
    queryKey: ['marks-by-exam', selectedExamId],
    queryFn: () => fetchMarksByExam(selectedExamId),
    enabled: !!selectedExamId,
  });

  const students = useMemo(() => studentsData?.data || [], [studentsData?.data]);
  const existingMarks: ExamMarkEntry[] = useMemo(
    () => existingMarksData?.data || [],
    [existingMarksData?.data]
  );

  // Mark entries state
  const [markEntries, setMarkEntries] = useState<StudentMarkRow[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleMarksKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      const totalRows = markEntries.length;
      let nextIndex: number | null;

      switch (e.key) {
        case 'ArrowDown':
        case 'Enter':
          nextIndex = index + 1 >= totalRows ? null : index + 1;
          break;
        case 'ArrowUp':
          nextIndex = index - 1 < 0 ? null : index - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== null && tableContainerRef.current) {
        e.preventDefault();
        const nextInput = tableContainerRef.current.querySelector(
          `[data-marks-row="${nextIndex}"]`
        ) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    },
    [markEntries.length]
  );

  // Build mark entries from students + existing marks
  useEffect(() => {
    if (students.length > 0 && selectedExamId) {
      const existingMap = new Map<string, ExamMarkEntry>();
      for (const m of existingMarks) {
        existingMap.set(m.student_public_id, m);
      }

      setMarkEntries(
        students.map((s) => {
          const existing = existingMap.get(s.public_id);
          return {
            student_id: s.public_id,
            student_name: s.full_name,
            roll_number: s.roll_number || '',
            photo_url: s.profile_photo_thumbnail,
            marks_obtained:
              existing && !existing.is_absent && existing.marks_obtained !== null
                ? String(existing.marks_obtained)
                : '',
            is_absent: existing?.is_absent || false,
            marksError: undefined,
            hasExistingMarks: !!existing,
          };
        })
      );
    } else {
      setMarkEntries([]);
    }
  }, [students, selectedExamId, existingMarks]);

  // Handler: when session changes from user interaction, reset downstream
  const handleSessionChange = useCallback((val: string) => {
    setSelectedSessionId(val);
    setSelectedClassId('');
    setSelectedExamId('');
    setMarkEntries([]);
  }, []);

  // Handler: when class changes from user interaction, reset exam
  const handleClassChange = useCallback((val: string) => {
    setSelectedClassId(val);
    setSelectedExamId('');
    setMarkEntries([]);
  }, []);

  // Handler: when exam/subject changes from user interaction
  const handleExamChange = useCallback((val: string) => {
    setSelectedExamId(val);
  }, []);

  // Bulk upsert mutation
  const bulkUpsertMutation = useMutation({
    mutationFn: (data: BulkMarkUpsertPayload) => bulkUpsertMarks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      queryClient.invalidateQueries({ queryKey: ['marks-by-exam', selectedExamId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save marks');
    },
  });

  // Publish / unpublish
  const publishMarksMutation = usePublishExamMarks();
  const unpublishMarksMutation = useUnpublishExamMarks();

  // Handler: Save & Publish — saves marks first, then publishes the selected exam
  const handleSaveAndPublish = useCallback(async () => {
    if (!selectedSessionId || !selectedExamId) {
      toast.error('Please select a session and exam first.');
      return;
    }

    const validEntries = markEntries.filter((e) => e.marks_obtained || e.is_absent);
    if (validEntries.length === 0) {
      toast.warning('No marks to save. Enter marks or mark students as absent.');
      return;
    }

    if (validEntries.length < markEntries.length) {
      toast.error(
        `Enter marks for all ${markEntries.length} students (either marks or Absent) before publishing.`
      );
      return;
    }

    const entriesWithErrors = validEntries.filter((e) => e.marksError);
    if (entriesWithErrors.length > 0) {
      toast.error(
        `${entriesWithErrors.length} student(s) have invalid marks. Please fix errors before saving.`
      );
      return;
    }

    const marks: BulkMarkEntry[] = validEntries.map((e) => ({
      student_id: e.student_id,
      marks_obtained: e.is_absent ? 0 : Number(e.marks_obtained),
      is_absent: e.is_absent,
    }));

    try {
      // Step 1: Save marks
      await bulkUpsertMutation.mutateAsync({
        session_id: selectedSessionId,
        exam_id: selectedExamId,
        marks,
      });

      // Step 2: Publish
      await publishMarksMutation.mutateAsync(selectedExamId);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Marks saved and published successfully!');
    } catch (error) {
      console.error('Save & Publish failed:', error);
      // Individual error toasts already shown by mutation hooks
    }
  }, [
    selectedSessionId,
    selectedExamId,
    markEntries,
    bulkUpsertMutation,
    publishMarksMutation,
    queryClient,
  ]);

  const handleMarkChange = (
    index: number,
    field: keyof StudentMarkRow,
    value: string | boolean
  ) => {
    setMarkEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'is_absent' && value === true) {
        updated[index].marks_obtained = '';
        updated[index].marksError = undefined;
      }

      if (field === 'marks_obtained' && typeof value === 'string' && value !== '') {
        const numValue = Number(value);
        const maxMarks = selectedExam?.max_marks || 0;
        if (numValue < 0) {
          updated[index].marksError = ValidationMessages.EXAM.MARKS_LESS_THAN_ZERO;
        } else if (numValue > maxMarks) {
          updated[index].marksError = ValidationMessages.EXAM.MARKS_EXCEED_MAX;
        } else {
          updated[index].marksError = undefined;
        }
      } else if (field === 'marks_obtained') {
        updated[index].marksError = undefined;
      }
      return updated;
    });
  };

  const handleSaveAll = () => {
    if (!selectedSessionId || !selectedExamId) {
      toast.error('Please select a session and exam first.');
      return;
    }

    const validEntries = markEntries.filter((e) => e.marks_obtained || e.is_absent);
    if (validEntries.length === 0) {
      toast.warning('No marks to save. Enter marks or mark students as absent.');
      return;
    }

    const entriesWithErrors = validEntries.filter((e) => e.marksError);
    if (entriesWithErrors.length > 0) {
      toast.error(
        `${entriesWithErrors.length} student(s) have invalid marks. Please fix errors before saving.`
      );
      return;
    }

    const marks: BulkMarkEntry[] = validEntries.map((e) => ({
      student_id: e.student_id,
      marks_obtained: e.is_absent ? 0 : Number(e.marks_obtained),
      is_absent: e.is_absent,
    }));

    bulkUpsertMutation.mutate(
      {
        session_id: selectedSessionId,
        exam_id: selectedExamId,
        marks,
      },
      {
        onSuccess: () => {
          toast.success('Marks saved successfully!');
        },
      }
    );
  };

  const isPending = bulkUpsertMutation.isPending;
  const isDataLoading = studentsLoading || existingMarksLoading;

  // Stats
  const enteredCount = markEntries.filter((e) => e.marks_obtained || e.is_absent).length;
  const absentCount = markEntries.filter((e) => e.is_absent).length;
  const passCount = markEntries.filter((e) => {
    if (e.is_absent || !e.marks_obtained) {
      return false;
    }
    return Number(e.marks_obtained) >= (selectedExam?.passing_marks || 0);
  }).length;
  const failCount = markEntries.filter((e) => {
    if (e.is_absent || !e.marks_obtained) {
      return false;
    }
    return Number(e.marks_obtained) < (selectedExam?.passing_marks || 0);
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Enter Marks" icon={ClipboardEdit}>
        <Button
          variant="brandOutline"
          onClick={() => navigate(ROUTES.EXAMS_LIST)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exams
        </Button>
      </PageHeader>

      {/* Selection Filters */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-muted/30 border-b px-6 py-4">
          <CardTitle className="text-lg">Select Exam</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Session */}
            <div className="space-y-2">
              <Label>
                Exam Session <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={sessions.map((s) => ({
                  value: s.public_id,
                  label: `${s.name} (${s.academic_year})`,
                }))}
                value={selectedSessionId}
                onValueChange={handleSessionChange}
                placeholder="Select session..."
                searchPlaceholder="Search sessions..."
              />
            </div>

            {/* Class */}
            <div className="space-y-2">
              <Label>
                Class <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                key={`class-${classes.length}`}
                options={classes.map((c) => ({
                  value: c.public_id,
                  label: `${c.class_master?.name || ''} - ${c.name}`,
                }))}
                value={selectedClassId}
                onValueChange={handleClassChange}
                disabled={!selectedSessionId}
                placeholder="Select class..."
                searchPlaceholder="Search classes..."
              />
            </div>

            {/* Subject (Exam) */}
            <div className="space-y-2">
              <Label>
                Subject <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                key={`exam-${filteredExams.length}`}
                options={filteredExams.map((e) => ({
                  value: e.public_id,
                  label: e.subject_name,
                }))}
                value={selectedExamId}
                onValueChange={handleExamChange}
                disabled={!selectedClassId}
                placeholder={examsLoading ? 'Loading...' : 'Select subject...'}
                searchPlaceholder="Search subjects..."
                emptyText="No completed exams for this class."
              />
            </div>
          </div>

          {/* Info bar */}
          {selectedExam && (
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Subject:</span>
                <Badge variant="secondary">{selectedExam.subject_name}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Class:</span>
                <Badge variant="outline">{selectedExam.class_name}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Max:</span>
                <Badge variant="outline" className="font-mono">
                  {selectedExam.max_marks}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Passing:</span>
                <Badge variant="outline" className="font-mono">
                  {selectedExam.passing_marks}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">Students:</span>
                <Badge>{markEntries.length}</Badge>
              </div>
              {selectedExam.is_marks_published && (
                <Badge className="border-green-200 bg-green-100 text-green-700">✓ Published</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Table */}
      {selectedExamId && !isDataLoading && markEntries.length > 0 && (
        <Card className="border shadow-sm">
          {selectedExam?.is_marks_published && (
            <div className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-6 py-3 text-sm text-blue-800">
              <span className="text-base">🔒</span>
              <span className="font-medium">
                Marks are published for this subject. Unpublish to allow editing.
              </span>
            </div>
          )}
          <CardHeader className="bg-muted/30 border-b px-6 py-4">
            <div>
              <CardTitle className="text-lg">Student Marks</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Entered: {enteredCount} / {markEntries.length} • Absent: {absentCount}
                {enteredCount > 0 && (
                  <>
                    {' '}
                    • <span className="text-emerald-600">Pass: {passCount}</span> •{' '}
                    <span className="text-red-500">Fail: {failCount}</span>
                  </>
                )}
                <span className="ml-2 text-xs text-gray-400">• Use ↑↓ or Enter to navigate</span>
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0" ref={tableContainerRef}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
                    <th className="w-12 px-4 py-3 text-center">#</th>
                    <th className="w-14 px-2 py-3"></th>
                    <th className="w-20 px-4 py-3">Roll No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="w-36 px-4 py-3">
                      Marks <span className="text-gray-400">/ {selectedExam?.max_marks}</span>
                    </th>
                    <th className="w-20 px-4 py-3 text-center">Absent</th>
                    <th className="w-24 px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {markEntries.map((entry, index) => {
                    const marks = Number(entry.marks_obtained) || 0;
                    const passing = selectedExam?.passing_marks || 0;
                    const hasMarks = entry.marks_obtained !== '' || entry.is_absent;
                    const isPass =
                      !entry.is_absent && marks >= passing && entry.marks_obtained !== '';
                    const isFail =
                      !entry.is_absent && marks < passing && entry.marks_obtained !== '';

                    return (
                      <tr key={entry.student_id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{index + 1}</td>
                        <td className="px-2 py-3">
                          <StudentAvatar
                            name={entry.student_name}
                            photoUrl={entry.photo_url}
                            size="md"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-600">
                            {entry.roll_number || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{entry.student_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              max={selectedExam?.max_marks || 999}
                              step="0.5"
                              value={entry.marks_obtained}
                              onChange={(e) =>
                                handleMarkChange(index, 'marks_obtained', e.target.value)
                              }
                              onKeyDown={(e) => handleMarksKeyDown(e, index)}
                              disabled={entry.is_absent || !!selectedExam?.is_marks_published}
                              placeholder="0"
                              data-marks-row={index}
                              className={`h-9 w-28 font-mono ${entry.marksError ? 'border-red-500' : ''}`}
                            />
                            {!!entry.marksError && (
                              <p className="text-xs text-red-500">{entry.marksError}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox
                            checked={entry.is_absent}
                            onCheckedChange={(checked) =>
                              handleMarkChange(index, 'is_absent', !!checked)
                            }
                            disabled={!!selectedExam?.is_marks_published}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {entry.is_absent && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-500">
                              Absent
                            </Badge>
                          )}
                          {isPass && <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />}
                          {isFail && <XCircle className="mx-auto h-5 w-5 text-red-400" />}
                          {!hasMarks && <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          {/* Action Buttons Footer */}
          <div className="border-t bg-gray-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedExam?.is_marks_published ? (
                  <span className="font-medium text-blue-600">
                    🔒 Marks published — unpublish to allow editing
                  </span>
                ) : enteredCount < markEntries.length ? (
                  <span className="font-medium text-amber-600">
                    ⚠ {markEntries.length - enteredCount} student(s) remaining — enter marks or mark
                    absent
                  </span>
                ) : (
                  <span className="font-medium text-green-600">
                    ✓ All entries completed — ready to publish
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {selectedExam?.is_marks_published && (
                  <Button
                    variant="outline"
                    onClick={() => unpublishMarksMutation.mutate(selectedExamId)}
                    disabled={unpublishMarksMutation.isPending}
                    className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                    title="Unpublish marks to allow editing"
                  >
                    {unpublishMarksMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4" />
                    )}
                    Unpublish
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={handleSaveAll}
                  disabled={
                    isPending || markEntries.length === 0 || !!selectedExam?.is_marks_published
                  }
                  className="gap-2"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>

                {!selectedExam?.is_marks_published && (
                  <Button
                    variant="brand"
                    onClick={handleSaveAndPublish}
                    disabled={
                      bulkUpsertMutation.isPending ||
                      publishMarksMutation.isPending ||
                      markEntries.length === 0 ||
                      enteredCount < markEntries.length
                    }
                    className="gap-2"
                    title={
                      enteredCount < markEntries.length
                        ? `Enter marks for all ${markEntries.length} students before publishing`
                        : 'Save marks and publish results'
                    }
                  >
                    {bulkUpsertMutation.isPending || publishMarksMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="h-4 w-4" />
                    )}
                    Save &amp; Publish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Loading */}
      {selectedExamId && isDataLoading && (
        <Card className="border shadow-sm">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading students and marks...</span>
          </CardContent>
        </Card>
      )}

      {/* No students */}
      {selectedExamId && !isDataLoading && markEntries.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No students found in this class.</p>
          </CardContent>
        </Card>
      )}

      {/* No exam selected */}
      {!selectedExamId && (
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="mb-4 h-12 w-12 text-gray-300" />
              <h4 className="text-lg font-medium text-gray-700">Select Exam to Enter Marks</h4>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Choose a session, class, and subject above to view students and enter marks. Only
                exams with <strong>Completed</strong> status allow marks entry.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MarksEntryPage;
