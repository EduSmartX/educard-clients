/**
 * Marks Overview Page
 * Colorful, visual marks entry interface with subject color coding
 *
 * Features:
 * - Session and Class dropdown filters
 * - Tabular format with color-coded subjects
 * - Student photos (with gender-based fallback), roll numbers
 * - Loads existing marks from backend
 * - Easy marks entry per subject
 * - Keyboard navigation (Arrow keys, Tab, Enter)
 */

import { useState, useMemo, useEffect } from 'react';
import { Save, AlertCircle, BookOpen, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader, StudentAvatar } from '@/components/common';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { useExamSessions, useMarksOverview } from '../hooks/use-exams';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { bulkSaveAllMarks } from '../api/exams-api';
import {
  buildStudentMarkEntries,
  buildBulkSavePayload,
  normalizeMarksInput,
} from '../utils/marks-overview-helpers';
import { useQueryClient } from '@tanstack/react-query';
import { useGridKeyboardNavigation } from '@/hooks/use-grid-keyboard-navigation';
import { toast } from 'sonner';

// Subject color schemes (same as exam overview)
const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', header: 'bg-blue-200' },
  {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    header: 'bg-purple-200',
  },
  {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    header: 'bg-green-200',
  },
  {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    header: 'bg-yellow-200',
  },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', header: 'bg-pink-200' },
  {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    header: 'bg-indigo-200',
  },
  {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    header: 'bg-orange-200',
  },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', header: 'bg-teal-200' },
];

interface StudentMarkEntry {
  studentId: string;
  rollNumber: string;
  name: string;
  photo?: string;
  gender?: string;
  marks: Record<string, string>; // examId -> marks value (string for input)
}

function getMarkInputStyle({
  editable,
  isAbsent,
  isPassing,
  isFailing,
}: {
  editable: boolean;
  isAbsent: boolean;
  isPassing: boolean;
  isFailing: boolean;
}): string {
  if (!editable) {
    return 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500';
  }
  if (isAbsent) {
    return 'border-gray-400 bg-gray-200 text-gray-600';
  }
  if (isPassing) {
    return 'border-green-400 bg-green-100 text-green-800';
  }
  if (isFailing) {
    return 'border-red-400 bg-red-100 text-red-800';
  }
  return 'bg-white';
}

/** Get a color for a subject name */
function getSubjectColor(subjectName: string) {
  const hash = subjectName.split('').reduce((acc, char) => acc + (char.codePointAt(0) ?? 0), 0);
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
}

export function MarksOverviewPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentMarks, setStudentMarks] = useState<StudentMarkEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch sessions and classes (always fetch these)
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({ page: 1, page_size: 200 });

  // Fetch marks overview only when both session and class are selected
  const marksOverviewParams =
    selectedSessionId && selectedClassId
      ? { session_id: selectedSessionId, class_id: selectedClassId }
      : null;

  const { data: marksOverviewData, isLoading: isLoadingMarks } =
    useMarksOverview(marksOverviewParams);

  const sessionsList = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const classesList = useMemo(() => classesData?.data || [], [classesData]);

  // Extract data from marks overview response
  const marksOverview = marksOverviewData?.data;
  const subjects = useMemo(() => marksOverview?.subjects || [], [marksOverview]);
  const permissions = marksOverview?.permissions;

  // Helper to check if a subject is editable
  const isSubjectEditable = (subjectPublicId: string): boolean => {
    if (!permissions) {
      return true;
    }
    if (permissions.is_admin || permissions.is_class_teacher) {
      return true;
    }
    if (permissions.editable_subject_ids === null) {
      return true;
    }
    return permissions.editable_subject_ids.includes(subjectPublicId);
  };

  // Check if user can edit ANY marks
  const canEditAny = useMemo(() => !permissions || permissions.can_edit, [permissions]);

  // Keyboard navigation for the marks grid
  const { containerRef, handleKeyDown } = useGridKeyboardNavigation({
    rows: studentMarks.length,
    cols: subjects.length,
    wrap: false,
  });

  // Initialize/update student marks when marks overview data changes
  useEffect(() => {
    if (marksOverview?.students && marksOverview.subjects.length > 0) {
      setStudentMarks(buildStudentMarkEntries(marksOverview.students));
    } else {
      setStudentMarks([]);
    }
  }, [marksOverview]);

  // Handle marks change
  const handleMarksChange = (
    studentId: string,
    examId: string,
    value: string,
    maxMarks: number
  ) => {
    const result = normalizeMarksInput(value, maxMarks);
    if (result === null) {
      toast.error(`Marks must be between 0 and ${maxMarks}`);
      return;
    }

    setStudentMarks((prev) =>
      prev.map((student) =>
        student.studentId === studentId
          ? { ...student, marks: { ...student.marks, [examId]: result.normalized } }
          : student
      )
    );
  };

  // Handle save - calls bulk save all API (single call for all data)
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!selectedSessionId || !selectedClassId || subjects.length === 0) {
      toast.error('Please select a session and class first');
      return;
    }

    const studentsPayload = buildBulkSavePayload(studentMarks, subjects);
    if (studentsPayload.length === 0) {
      toast.warning('No marks to save');
      return;
    }

    setIsSaving(true);
    try {
      const result = await bulkSaveAllMarks({
        session_id: selectedSessionId,
        class_id: selectedClassId,
        students: studentsPayload,
      });
      queryClient.invalidateQueries({ queryKey: ['marks-overview'] });
      toast.success(result.message || `Marks saved for ${result.data.count} student(s)`);
    } catch {
      toast.error('Failed to save marks');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalStudents = studentMarks.length;
    const totalExams = subjects.length;
    let filledCount = 0;
    let totalCells = 0;

    studentMarks.forEach((student) => {
      subjects.forEach((subject) => {
        totalCells++;
        if (student.marks[subject.exam_public_id]) {
          filledCount++;
        }
      });
    });

    const completionPercent = totalCells > 0 ? Math.round((filledCount / totalCells) * 100) : 0;

    return { totalStudents, totalExams, filledCount, totalCells, completionPercent };
  }, [studentMarks, subjects]);

  // Per-subject analytics
  const subjectStats = useMemo(() => {
    const statsMap: Record<
      string,
      { absent: number; entered: number; total: number; avg: number }
    > = {};
    subjects.forEach((subject) => {
      let absent = 0;
      let entered = 0;
      let sum = 0;
      studentMarks.forEach((student) => {
        const val = student.marks[subject.exam_public_id];
        if (val === 'AB') {
          absent++;
        } else if (val && !Number.isNaN(Number.parseFloat(val))) {
          entered++;
          sum += Number.parseFloat(val);
        }
      });
      statsMap[subject.exam_public_id] = {
        absent,
        entered,
        total: studentMarks.length,
        avg: entered > 0 ? Math.round((sum / entered) * 100) / 100 : 0,
      };
    });
    return statsMap;
  }, [studentMarks, subjects]);

  // Per-student totals
  const studentTotals = useMemo(() => {
    const totalsMap: Record<
      string,
      {
        total: number;
        maxTotal: number;
        percentage: number;
        subjectsAttempted: number;
        absent: number;
      }
    > = {};
    studentMarks.forEach((student) => {
      let total = 0;
      let maxTotal = 0;
      let attempted = 0;
      let absentCount = 0;
      subjects.forEach((subject) => {
        const val = student.marks[subject.exam_public_id];
        if (val === 'AB') {
          absentCount++;
        } else if (val && !Number.isNaN(Number.parseFloat(val))) {
          total += Number.parseFloat(val);
          maxTotal += subject.max_marks;
          attempted++;
        }
      });
      totalsMap[student.studentId] = {
        total,
        maxTotal,
        percentage: maxTotal > 0 ? Math.round((total / maxTotal) * 10000) / 100 : 0,
        subjectsAttempted: attempted,
        absent: absentCount,
      };
    });
    return totalsMap;
  }, [studentMarks, subjects]);

  // Get selected session info for display
  const selectedSession = sessionsList.find((s) => s.public_id === selectedSessionId);

  return (
    <div className="space-y-6">
      <PageHeader title="Marks Overview" />

      {/* Filters Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Select Session & Class</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Session Filter */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700">Exam Session *</span>
              <SearchableSelect
                key={`session-${selectedSessionId || 'empty'}`}
                options={sessionsList.map((session) => ({
                  value: session.public_id,
                  label: `${session.name} (${session.academic_year})`,
                }))}
                value={selectedSessionId}
                onValueChange={(value) => {
                  setSelectedSessionId(value);
                  setSelectedClassId('');
                }}
                placeholder="Select session"
                searchPlaceholder="Search sessions..."
              />
            </label>

            {/* Class Filter */}
            <label className="block space-y-2">
              <span className="text-sm font-medium text-gray-700">Class *</span>
              <SearchableSelect
                key={`class-${selectedClassId || 'empty'}`}
                options={classesList.map((cls) => ({
                  value: cls.public_id,
                  label: `${cls.class_master?.name || 'Unknown'} - ${cls.name}`,
                }))}
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={!selectedSessionId}
                placeholder={selectedSessionId ? 'Select class' : 'Select session first'}
                searchPlaceholder="Search classes..."
              />
            </label>
          </div>

          {/* Session Info */}
          {selectedSession && selectedClassId && marksOverview && (
            <div className="from-brand-50 to-brand-100 border-brand-200 rounded-lg border-2 bg-gradient-to-r p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{marksOverview.session.name}</h3>
                  <p className="text-sm text-gray-600">{marksOverview.session.session_type}</p>
                  <p className="mt-1 text-sm font-medium text-gray-600">
                    Class: {marksOverview.class_info.class_master_name} -{' '}
                    {marksOverview.class_info.section_name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="px-3 py-1 text-base">
                    <Users className="mr-1 h-4 w-4" />
                    {stats.totalStudents} Students
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-base">
                    <BookOpen className="mr-1 h-4 w-4" />
                    {stats.totalExams} Exams
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 text-base">
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    {stats.completionPercent}% Complete
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      {(!selectedSessionId || !selectedClassId) && (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg">Please select both Session and Class to view marks entry</p>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedSessionId && selectedClassId && isLoadingMarks && (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <Loader2 className="text-brand-500 mx-auto mb-4 h-16 w-16 animate-spin" />
              <p className="text-lg">Loading marks data...</p>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedSessionId && selectedClassId && !isLoadingMarks && subjects.length === 0 && (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-lg">No exams found for this session and class</p>
            </div>
          </CardContent>
        </Card>
      )}
      {selectedSessionId &&
        selectedClassId &&
        !isLoadingMarks &&
        subjects.length > 0 &&
        studentMarks.length === 0 && (
          <Card>
            <CardContent className="py-20">
              <div className="text-center text-gray-500">
                <Users className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                <p className="text-lg">No students found in this class</p>
              </div>
            </CardContent>
          </Card>
        )}
      {selectedSessionId &&
        selectedClassId &&
        !isLoadingMarks &&
        subjects.length > 0 &&
        studentMarks.length > 0 && (
          <Card className="border-2">
            <CardHeader className="from-brand-50 to-brand-100 border-b-2 bg-gradient-to-r">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Marks Entry</CardTitle>
                  <p className="mt-1 text-xs text-gray-500">
                    {canEditAny
                      ? 'Use Arrow keys, Tab, or Enter to navigate between cells'
                      : 'View only - You can only edit marks for subjects assigned to you'}
                  </p>
                </div>
                {canEditAny && (
                  <Button
                    variant="success"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save All Marks'}
                  </Button>
                )}
              </div>
            </CardHeader>
            {/* View-only banner */}
            {!canEditAny && (
              <div className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                <AlertCircle className="h-4 w-4" />
                <span>
                  You are viewing marks in read-only mode. Only teachers assigned to specific
                  subjects can edit them.
                </span>
              </div>
            )}
            <CardContent className="p-0">
              {/* Scrollable container with max height and sticky header */}
              <div className="relative max-h-[70vh] overflow-auto" ref={containerRef}>
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-20 bg-gray-100">
                    <tr>
                      <th className="sticky top-0 left-0 z-30 min-w-[80px] border-2 border-gray-300 bg-gray-100 p-3 text-left font-semibold">
                        S.No
                      </th>
                      <th className="sticky top-0 left-[80px] z-30 min-w-[80px] border-2 border-gray-300 bg-gray-100 p-3 text-left font-semibold">
                        Photo
                      </th>
                      <th className="sticky top-0 left-[160px] z-30 min-w-[120px] border-2 border-gray-300 bg-gray-100 p-3 text-left font-semibold">
                        Roll No
                      </th>
                      <th className="sticky top-0 left-[280px] z-30 min-w-[200px] border-2 border-gray-300 bg-gray-100 p-3 text-left font-semibold">
                        Student Name
                      </th>
                      {subjects.map((subject) => {
                        const colors = getSubjectColor(subject.subject_name);
                        return (
                          <th
                            key={subject.exam_public_id}
                            className={`border-2 ${colors.border} p-3 text-center font-semibold ${colors.header} sticky top-0 z-20 min-w-[150px]`}
                          >
                            <div className="space-y-1">
                              <div className={`font-bold ${colors.text}`}>
                                {subject.subject_name}
                              </div>
                              <div className="text-xs text-gray-600">
                                Max: {subject.max_marks} | Pass: {subject.passing_marks}
                              </div>
                              {!!subject.date && (
                                <div className="text-xs text-gray-500">
                                  {new Date(subject.date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </th>
                        );
                      })}
                      {/* Total & Percentage columns */}
                      <th className="sticky top-0 z-20 min-w-[100px] border-2 border-gray-300 bg-emerald-200 p-3 text-center font-semibold">
                        <div className="space-y-1">
                          <div className="font-bold text-emerald-800">Total</div>
                          <div className="text-xs text-gray-600">
                            Max: {subjects.reduce((s, sub) => s + sub.max_marks, 0)}
                          </div>
                        </div>
                      </th>
                      <th className="sticky top-0 z-20 min-w-[90px] border-2 border-gray-300 bg-amber-200 p-3 text-center font-semibold">
                        <div className="font-bold text-amber-800">%</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarks.map((student, rowIndex) => (
                      <tr
                        key={student.studentId}
                        className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="sticky left-0 z-10 border-2 border-gray-300 bg-inherit p-3 text-center font-medium">
                          {rowIndex + 1}
                        </td>
                        <td className="sticky left-[80px] z-10 border-2 border-gray-300 bg-inherit p-3">
                          <StudentAvatar
                            name={student.name}
                            photoUrl={student.photo}
                            gender={student.gender}
                            size="md"
                          />
                        </td>
                        <td className="sticky left-[160px] z-10 border-2 border-gray-300 bg-inherit p-3 font-medium">
                          {student.rollNumber}
                        </td>
                        <td className="sticky left-[280px] z-10 border-2 border-gray-300 bg-inherit p-3 font-medium">
                          {student.name}
                        </td>
                        {subjects.map((subject, colIndex) => {
                          const colors = getSubjectColor(subject.subject_name);
                          const markValue = student.marks[subject.exam_public_id] || '';
                          const numMark = Number.parseFloat(markValue);
                          const isPassing =
                            !Number.isNaN(numMark) && numMark >= subject.passing_marks;
                          const isFailing =
                            markValue &&
                            markValue !== 'AB' &&
                            !Number.isNaN(numMark) &&
                            numMark < subject.passing_marks;
                          const isAbsent = markValue === 'AB';
                          const editable = isSubjectEditable(subject.subject_public_id);

                          return (
                            <td
                              key={subject.exam_public_id}
                              className={`border-2 ${colors.border} p-2 ${colors.bg}`}
                            >
                              <Input
                                type="text"
                                value={markValue}
                                data-row={rowIndex}
                                data-col={colIndex}
                                onKeyDown={handleKeyDown}
                                disabled={!editable}
                                onChange={(e) =>
                                  handleMarksChange(
                                    student.studentId,
                                    subject.exam_public_id,
                                    e.target.value,
                                    subject.max_marks
                                  )
                                }
                                className={`text-center font-semibold ${getMarkInputStyle({ editable, isAbsent, isPassing, isFailing: !!isFailing })}`}
                                placeholder="--"
                              />
                            </td>
                          );
                        })}
                        {/* Total marks cell */}
                        {(() => {
                          const t = studentTotals[student.studentId];
                          if (!t || t.subjectsAttempted === 0) {
                            return (
                              <>
                                <td className="border-2 border-gray-300 bg-emerald-50 p-3 text-center font-medium text-gray-400">
                                  --
                                </td>
                                <td className="border-2 border-gray-300 bg-amber-50 p-3 text-center font-medium text-gray-400">
                                  --
                                </td>
                              </>
                            );
                          }
                          const pct = t.percentage;
                          const getPctColor = (p: number) => {
                            if (p >= 75) {
                              return 'text-green-700 bg-green-50';
                            }
                            if (p >= 50) {
                              return 'text-amber-700 bg-amber-50';
                            }
                            if (p >= 35) {
                              return 'text-orange-700 bg-orange-50';
                            }
                            return 'text-red-700 bg-red-50';
                          };
                          const pctColor = getPctColor(pct);
                          return (
                            <>
                              <td className="border-2 border-gray-300 bg-emerald-50 p-3 text-center font-bold text-emerald-800">
                                {t.total}
                                <span className="text-xs font-normal text-gray-500">
                                  /{t.maxTotal}
                                </span>
                              </td>
                              <td
                                className={`border-2 border-gray-300 p-3 text-center font-bold ${pctColor}`}
                              >
                                {pct}%
                              </td>
                            </>
                          );
                        })()}
                      </tr>
                    ))}
                  </tbody>
                  {/* Analytics Footer */}
                  <tfoot>
                    <tr className="bg-gray-200 font-semibold">
                      <td
                        colSpan={4}
                        className="sticky left-0 z-10 border-2 border-gray-300 bg-gray-200 p-3 text-right"
                      >
                        📊 Analytics
                      </td>
                      {subjects.map((subject) => {
                        const st = subjectStats[subject.exam_public_id];
                        const colors = getSubjectColor(subject.subject_name);
                        return (
                          <td
                            key={subject.exam_public_id}
                            className={`border-2 ${colors.border} p-2 ${colors.bg} text-center text-xs`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-red-600">AB: {st?.absent || 0}</div>
                              <div className="text-gray-600">
                                Entered: {st?.entered || 0}/{st?.total || 0}
                              </div>
                              <div className="font-medium text-blue-700">Avg: {st?.avg || 0}</div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="border-2 border-gray-300 bg-emerald-100 p-2 text-center text-xs">
                        <div className="font-bold text-emerald-700">
                          Class Avg:{' '}
                          {(() => {
                            const vals = Object.values(studentTotals).filter(
                              (t) => t.subjectsAttempted > 0
                            );
                            if (vals.length === 0) {
                              return '--';
                            }
                            const avg = vals.reduce((s, t) => s + t.total, 0) / vals.length;
                            return Math.round(avg * 100) / 100;
                          })()}
                        </div>
                      </td>
                      <td className="border-2 border-gray-300 bg-amber-100 p-2 text-center text-xs">
                        <div className="font-bold text-amber-700">
                          Avg:{' '}
                          {(() => {
                            const vals = Object.values(studentTotals).filter(
                              (t) => t.subjectsAttempted > 0
                            );
                            if (vals.length === 0) {
                              return '--';
                            }
                            const avg = vals.reduce((s, t) => s + t.percentage, 0) / vals.length;
                            return `${Math.round(avg * 100) / 100}%`;
                          })()}
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
