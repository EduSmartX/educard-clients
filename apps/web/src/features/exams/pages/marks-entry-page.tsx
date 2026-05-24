/**
 * Marks Entry Page
 * Select exam session -> exam (subject+class), then enter marks for students
 * Uses the new JSONB marks_data model
 * Supports keyboard navigation (Arrow Up/Down, Enter, Tab)
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
import { bulkUpsertMarks, type BulkMarkUpsertPayload } from '../api/exams-api';
import { studentApi } from '@/lib/api/student-api';
import type { Exam, BulkMarkEntry } from '@educard/shared';

interface StudentMarkEntry {
  student_id: string;
  student_name: string;
  roll_number: string;
  photo_url?: string | null;
  marks_obtained: string;
  is_absent: boolean;
  marksError?: string; // Validation error for marks
}

export function MarksEntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Pre-select from URL params if available
  const initialSessionId = searchParams.get('session') || '';
  const initialExamId = searchParams.get('exam') || '';

  // Selection state
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);

  // Data queries
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: examsData, isLoading: examsLoading } = useExams({
    page: 1,
    page_size: 100,
    session: selectedSessionId || undefined,
  });

  const sessions = sessionsData?.data || [];
  const exams = useMemo(() => examsData?.data || [], [examsData?.data]);

  // Selected exam info
  const selectedExam: Exam | undefined = useMemo(
    () => exams.find((e) => e.public_id === selectedExamId),
    [exams, selectedExamId]
  );

  // Fetch students for the class when exam is selected
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students-for-marks', selectedExam?.class_public_id],
    queryFn: () => studentApi.getAll({ class_id: selectedExam!.class_public_id, page_size: 200 }),
    enabled: !!selectedExam?.class_public_id,
  });

  const students = useMemo(() => studentsData?.results || [], [studentsData?.results]);

  // Student marks entries
  const [markEntries, setMarkEntries] = useState<StudentMarkEntry[]>([]);

  const tableContainerRef = useRef<HTMLDivElement>(null);

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
          return; // Don't prevent default for other keys
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

  // Initialize mark entries when students are loaded
  useEffect(() => {
    if (students.length > 0 && selectedExamId) {
      setMarkEntries(
        students.map((s) => ({
          student_id: s.id,
          student_name: `${s.user.first_name} ${s.user.last_name}`.trim(),
          roll_number: s.roll_number || '',
          photo_url: s.profile_image,
          marks_obtained: '',
          is_absent: false,
          marksError: undefined,
        }))
      );
    } else {
      setMarkEntries([]);
    }
  }, [students, selectedExamId]);

  // Reset downstream selections when parent changes
  useEffect(() => {
    setSelectedExamId('');
    setMarkEntries([]);
  }, [selectedSessionId]);

  // Bulk upsert mutation
  const bulkUpsertMutation = useMutation({
    mutationFn: (data: BulkMarkUpsertPayload) => bulkUpsertMarks(data),
    onSuccess: () => {
      toast.success('Marks saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save marks');
    },
  });

  const handleMarkChange = (
    index: number,
    field: keyof StudentMarkEntry,
    value: string | boolean
  ) => {
    setMarkEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // If marking absent, clear marks and error
      if (field === 'is_absent' && value === true) {
        updated[index].marks_obtained = '';
        updated[index].marksError = undefined;
      }
      // Validate marks when they change
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
      toast.error(ValidationMessages.SELECT_SESSION_AND_EXAM);
      return;
    }

    // Filter entries that have marks or are absent
    const validEntries = markEntries.filter((e) => e.marks_obtained || e.is_absent);
    if (validEntries.length === 0) {
      toast.warning('No marks to save. Enter marks or mark students as absent.');
      return;
    }

    // Check for any validation errors
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

    bulkUpsertMutation.mutate({
      session_id: selectedSessionId,
      exam_id: selectedExamId,
      marks,
    });
  };

  const isPending = bulkUpsertMutation.isPending;

  // Stats
  const enteredCount = markEntries.filter((e) => e.marks_obtained || e.is_absent).length;
  const absentCount = markEntries.filter((e) => e.is_absent).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Enter Marks">
        <Button variant="brandOutline" onClick={() => navigate(ROUTES.EXAMS)} className="gap-2">
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Session */}
            <div className="space-y-2">
              <Label>Exam Session</Label>
              <SearchableSelect
                options={sessions.map((s) => ({
                  value: s.public_id,
                  label: `${s.name} (${s.academic_year})`,
                }))}
                value={selectedSessionId}
                onValueChange={setSelectedSessionId}
                placeholder="Select session..."
                searchPlaceholder="Search sessions..."
              />
            </div>

            {/* Exam (Subject + Class) */}
            <div className="space-y-2">
              <Label>Exam (Subject) - Only Completed Exams</Label>
              <SearchableSelect
                options={exams
                  .filter((e) => e.status === 'completed')
                  .map((e) => ({
                    value: e.public_id,
                    label: `${e.subject_name} - ${e.class_name}`,
                  }))}
                value={selectedExamId}
                onValueChange={setSelectedExamId}
                disabled={!selectedSessionId || examsLoading}
                placeholder={examsLoading ? 'Loading...' : 'Select exam...'}
                searchPlaceholder="Search exams..."
                emptyText="No completed exams in this session. Mark exams as Completed first."
              />
              {selectedSessionId &&
                exams.length > 0 &&
                exams.filter((e) => e.status === 'completed').length === 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ No completed exams found. Only completed exams allow marks entry.
                  </p>
                )}
            </div>
          </div>

          {/* Info bar for selected exam */}
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
                <span className="font-medium text-gray-700">Status:</span>
                <Badge
                  variant="outline"
                  className={
                    selectedExam.status === 'completed'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }
                >
                  {selectedExam.status.charAt(0).toUpperCase() +
                    selectedExam.status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Max Marks:</span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Table */}
      {selectedExamId && (
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/30 flex flex-row items-center justify-between border-b px-6 py-4">
            <div>
              <CardTitle className="text-lg">Student Marks</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Entered: {enteredCount} / {markEntries.length} • Absent: {absentCount}
                <span className="ml-2 text-xs text-gray-400">• Use ↑↓ or Enter to navigate</span>
              </p>
            </div>
            <Button
              variant="brand"
              onClick={handleSaveAll}
              disabled={isPending || markEntries.length === 0}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Marks
            </Button>
          </CardHeader>
          <CardContent className="p-0" ref={tableContainerRef}>
            {studentsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading students...</span>
              </div>
            )}
            {!studentsLoading && markEntries.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-600">
                      <th className="w-12 px-4 py-3">#</th>
                      <th className="w-16 px-4 py-3">Photo</th>
                      <th className="w-20 px-4 py-3">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="w-32 px-4 py-3">
                        Marks <span className="text-gray-400">/ {selectedExam?.max_marks}</span>
                      </th>
                      <th className="w-20 px-4 py-3 text-center">Absent</th>
                      <th className="w-20 px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {markEntries.map((entry, index) => {
                      const marks = Number(entry.marks_obtained) || 0;
                      const passing = selectedExam?.passing_marks || 0;
                      const isPass = !entry.is_absent && marks >= passing;
                      return (
                        <tr key={entry.student_id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 py-3">
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
                                disabled={entry.is_absent}
                                placeholder="0"
                                data-marks-row={index}
                                className={`h-9 w-24 font-mono ${entry.marksError ? 'border-red-500' : ''}`}
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
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {entry.is_absent && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                Absent
                              </Badge>
                            )}
                            {!entry.is_absent &&
                              entry.marks_obtained &&
                              (isPass ? (
                                <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
                              ) : (
                                <XCircle className="mx-auto h-5 w-5 text-red-400" />
                              ))}
                            {!entry.is_absent && !entry.marks_obtained && (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!studentsLoading && markEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">No students found in this class.</p>
              </div>
            )}
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
                Choose an exam session and exam (subject) above to view students and enter marks.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MarksEntryPage;
