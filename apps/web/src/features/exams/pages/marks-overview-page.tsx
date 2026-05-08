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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useExamSessions, useMarksOverview } from '../hooks/use-exams';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { bulkSaveAllMarks, type StudentMarksEntry, type StudentExamMark } from '../api/exams-api';
import { useQueryClient } from '@tanstack/react-query';
import { useGridKeyboardNavigation } from '@/hooks/use-grid-keyboard-navigation';
import { toast } from 'sonner';

// Subject color schemes (same as exam overview)
const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', header: 'bg-blue-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', header: 'bg-purple-200' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', header: 'bg-green-200' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', header: 'bg-yellow-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', header: 'bg-pink-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', header: 'bg-indigo-200' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', header: 'bg-orange-200' },
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

export function MarksOverviewPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [studentMarks, setStudentMarks] = useState<StudentMarkEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch sessions and classes (always fetch these)
  const { data: sessionsData } = useExamSessions({ page: 1, page_size: 100 });
  const { data: classesData } = useClasses({ page: 1, page_size: 200 });

  // Fetch marks overview only when both session and class are selected
  const marksOverviewParams = selectedSessionId && selectedClassId
    ? { session_id: selectedSessionId, class_id: selectedClassId }
    : null;
  
  const { data: marksOverviewData, isLoading: isLoadingMarks } = useMarksOverview(marksOverviewParams);

  const sessionsList = useMemo(() => sessionsData?.data || [], [sessionsData]);
  const classesList = useMemo(() => classesData?.data || [], [classesData]);

  // Extract data from marks overview response
  const marksOverview = marksOverviewData?.data;
  const subjects = useMemo(() => marksOverview?.subjects || [], [marksOverview]);
  const permissions = marksOverview?.permissions;

  // Helper to check if a subject is editable
  const isSubjectEditable = (subjectPublicId: string): boolean => {
    if (!permissions) return true; // Default to editable if no permissions
    if (permissions.is_admin || permissions.is_class_teacher) return true;
    if (permissions.editable_subject_ids === null) return true; // null means all
    return permissions.editable_subject_ids.includes(subjectPublicId);
  };

  // Check if user can edit ANY marks
  const canEditAny = useMemo(() => {
    if (!permissions) return true;
    return permissions.can_edit;
  }, [permissions]);

  // Keyboard navigation for the marks grid
  const { containerRef, handleKeyDown } = useGridKeyboardNavigation({
    rows: studentMarks.length,
    cols: subjects.length,
    wrap: false,
  });

  // Initialize/update student marks when marks overview data changes
  useEffect(() => {
    if (marksOverview?.students && marksOverview.subjects.length > 0) {
      const entries: StudentMarkEntry[] = marksOverview.students.map((student) => {
        // Convert existing marks to string values for input fields
        const marksMap: Record<string, string> = {};
        // Handle optional marks field
        if (student.marks) {
          Object.entries(student.marks).forEach(([examId, markData]) => {
            if (markData.is_absent) {
              marksMap[examId] = 'AB'; // Absent marker
            } else if (markData.marks_obtained > 0) {
              marksMap[examId] = String(markData.marks_obtained);
            }
          });
        }

        return {
          studentId: student.student_public_id,
          rollNumber: student.roll_number || '-',
          name: student.student_name,
          photo: student.profile_photo_thumbnail || undefined,
          gender: student.gender || undefined,
          marks: marksMap,
        };
      });
      setStudentMarks(entries);
    } else {
      setStudentMarks([]);
    }
  }, [marksOverview]);

  // Get subject color
  const getSubjectColor = (subjectName: string) => {
    const hash = subjectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return SUBJECT_COLORS[hash % SUBJECT_COLORS.length];
  };

  // Handle marks change
  const handleMarksChange = (studentId: string, examId: string, value: string, maxMarks: number) => {
    // Auto-convert 'a' or 'A' to 'AB' (absent)
    const upper = value.toUpperCase();
    if (upper === 'A' || upper === 'AB') {
      setStudentMarks((prev) =>
        prev.map((student) =>
          student.studentId === studentId
            ? { ...student, marks: { ...student.marks, [examId]: 'AB' } }
            : student
        )
      );
      return;
    }

    // Allow empty or valid number
    if (value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > maxMarks) {
        toast.error(`Marks must be between 0 and ${maxMarks}`);
        return;
      }
    }

    setStudentMarks((prev) =>
      prev.map((student) =>
        student.studentId === studentId
          ? {
              ...student,
              marks: { ...student.marks, [examId]: value },
            }
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

    setIsSaving(true);
    try {
      // Build payload: group all marks by student
      const studentsPayload: StudentMarksEntry[] = [];

      studentMarks.forEach((student) => {
        const examMarks: StudentExamMark[] = [];
        
        subjects.forEach((subject) => {
          const markValue = student.marks[subject.exam_public_id];
          
          // Only include if there's a value
          if (markValue !== undefined && markValue !== '') {
            const isAbsent = markValue.toUpperCase() === 'AB';
            const marksObtained = isAbsent ? 0 : parseFloat(markValue) || 0;

            examMarks.push({
              exam_id: subject.exam_public_id,
              marks_obtained: marksObtained,
              is_absent: isAbsent,
            });
          }
        });

        // Only include students who have at least one mark
        if (examMarks.length > 0) {
          studentsPayload.push({
            student_id: student.studentId,
            marks: examMarks,
          });
        }
      });

      if (studentsPayload.length === 0) {
        toast.warning('No marks to save');
        setIsSaving(false);
        return;
      }

      // Single API call to save all marks
      const result = await bulkSaveAllMarks({
        session_id: selectedSessionId,
        class_id: selectedClassId,
        students: studentsPayload,
      });
      
      // Invalidate the marks overview query to refresh data
      queryClient.invalidateQueries({ queryKey: ['marks-overview'] });
      
      toast.success(result.message || `Marks saved for ${result.data.count} student(s)`);
    } catch (error) {
      toast.error('Failed to save marks');
      console.error(error);
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
    const statsMap: Record<string, { absent: number; entered: number; total: number; avg: number }> = {};
    subjects.forEach((subject) => {
      let absent = 0;
      let entered = 0;
      let sum = 0;
      studentMarks.forEach((student) => {
        const val = student.marks[subject.exam_public_id];
        if (val === 'AB') {
          absent++;
        } else if (val && !isNaN(parseFloat(val))) {
          entered++;
          sum += parseFloat(val);
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
    const totalsMap: Record<string, { total: number; maxTotal: number; percentage: number; subjectsAttempted: number; absent: number }> = {};
    studentMarks.forEach((student) => {
      let total = 0;
      let maxTotal = 0;
      let attempted = 0;
      let absentCount = 0;
      subjects.forEach((subject) => {
        const val = student.marks[subject.exam_public_id];
        if (val === 'AB') {
          absentCount++;
        } else if (val && !isNaN(parseFloat(val))) {
          total += parseFloat(val);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Session Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Exam Session *</label>
              <Select
                key={`session-${selectedSessionId || 'empty'}`}
                value={selectedSessionId}
                onValueChange={(value) => {
                  setSelectedSessionId(value);
                  setSelectedClassId(''); // Reset class when session changes
                }}
              >
                <SelectTrigger>
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
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Class *</label>
              <Select
                key={`class-${selectedClassId || 'empty'}`}
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={!selectedSessionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedSessionId ? "Select class" : "Select session first"} />
                </SelectTrigger>
                <SelectContent>
                  {classesList.map((cls) => (
                    <SelectItem key={cls.public_id} value={cls.public_id}>
                      {cls.class_master.name} - {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session Info */}
          {selectedSession && selectedClassId && marksOverview && (
            <div className="p-4 rounded-lg border-2 bg-gradient-to-r from-brand-50 to-brand-100 border-brand-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{marksOverview.session.name}</h3>
                  <p className="text-sm text-gray-600">
                    {marksOverview.session.session_type}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    Class: {marksOverview.class_info.class_master_name} - {marksOverview.class_info.section_name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="text-base px-3 py-1">
                    <Users className="h-4 w-4 mr-1" />
                    {stats.totalStudents} Students
                  </Badge>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {stats.totalExams} Exams
                  </Badge>
                  <Badge variant="outline" className="text-base px-3 py-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    {stats.completionPercent}% Complete
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marks Entry Table */}
      {!selectedSessionId || !selectedClassId ? (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Please select both Session and Class to view marks entry</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoadingMarks ? (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <Loader2 className="h-16 w-16 mx-auto mb-4 text-brand-500 animate-spin" />
              <p className="text-lg">Loading marks data...</p>
            </div>
          </CardContent>
        </Card>
      ) : subjects.length === 0 ? (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No exams found for this session and class</p>
            </div>
          </CardContent>
        </Card>
      ) : studentMarks.length === 0 ? (
        <Card>
          <CardContent className="py-20">
            <div className="text-center text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">No students found in this class</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-brand-50 to-brand-100 border-b-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Marks Entry</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  {canEditAny 
                    ? 'Use Arrow keys, Tab, or Enter to navigate between cells'
                    : 'View only - You can only edit marks for subjects assigned to you'}
                </p>
              </div>
              {canEditAny && (
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save All Marks'}
                </Button>
              )}
            </div>
          </CardHeader>
          {/* View-only banner */}
          {!canEditAny && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>You are viewing marks in read-only mode. Only teachers assigned to specific subjects can edit them.</span>
            </div>
          )}
          <CardContent className="p-0">
            <div className="overflow-x-auto" ref={containerRef}>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-2 border-gray-300 p-3 text-left font-semibold sticky left-0 bg-gray-100 z-10 min-w-[80px]">
                      S.No
                    </th>
                    <th className="border-2 border-gray-300 p-3 text-left font-semibold sticky left-[80px] bg-gray-100 z-10 min-w-[80px]">
                      Photo
                    </th>
                    <th className="border-2 border-gray-300 p-3 text-left font-semibold sticky left-[160px] bg-gray-100 z-10 min-w-[120px]">
                      Roll No
                    </th>
                    <th className="border-2 border-gray-300 p-3 text-left font-semibold sticky left-[280px] bg-gray-100 z-10 min-w-[200px]">
                      Student Name
                    </th>
                    {subjects.map((subject) => {
                      const colors = getSubjectColor(subject.subject_name);
                      return (
                        <th
                          key={subject.exam_public_id}
                          className={`border-2 ${colors.border} p-3 text-center font-semibold ${colors.header} min-w-[150px]`}
                        >
                          <div className="space-y-1">
                            <div className={`font-bold ${colors.text}`}>{subject.subject_name}</div>
                            <div className="text-xs text-gray-600">
                              Max: {subject.max_marks} | Pass: {subject.passing_marks}
                            </div>
                            {subject.date && (
                              <div className="text-xs text-gray-500">
                                {new Date(subject.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </th>
                      );
                    })}
                    {/* Total & Percentage columns */}
                    <th className="border-2 border-gray-300 p-3 text-center font-semibold bg-emerald-200 min-w-[100px]">
                      <div className="space-y-1">
                        <div className="font-bold text-emerald-800">Total</div>
                        <div className="text-xs text-gray-600">
                          Max: {subjects.reduce((s, sub) => s + sub.max_marks, 0)}
                        </div>
                      </div>
                    </th>
                    <th className="border-2 border-gray-300 p-3 text-center font-semibold bg-amber-200 min-w-[90px]">
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
                      <td className="border-2 border-gray-300 p-3 text-center font-medium sticky left-0 bg-inherit z-10">
                        {rowIndex + 1}
                      </td>
                      <td className="border-2 border-gray-300 p-3 sticky left-[80px] bg-inherit z-10">
                        <StudentAvatar 
                          name={student.name}
                          photoUrl={student.photo}
                          gender={student.gender}
                          size="md"
                        />
                      </td>
                      <td className="border-2 border-gray-300 p-3 font-medium sticky left-[160px] bg-inherit z-10">
                        {student.rollNumber}
                      </td>
                      <td className="border-2 border-gray-300 p-3 font-medium sticky left-[280px] bg-inherit z-10">
                        {student.name}
                      </td>
                      {subjects.map((subject, colIndex) => {
                        const colors = getSubjectColor(subject.subject_name);
                        const markValue = student.marks[subject.exam_public_id] || '';
                        const numMark = parseFloat(markValue);
                        const isPassing = !isNaN(numMark) && numMark >= subject.passing_marks;
                        const isFailing = markValue && markValue !== 'AB' && !isNaN(numMark) && numMark < subject.passing_marks;
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
                              className={`text-center font-semibold ${
                                !editable
                                  ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                                  : isAbsent
                                  ? 'bg-gray-200 border-gray-400 text-gray-600'
                                  : isPassing
                                  ? 'bg-green-100 border-green-400 text-green-800'
                                  : isFailing
                                  ? 'bg-red-100 border-red-400 text-red-800'
                                  : 'bg-white'
                              }`}
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
                              <td className="border-2 border-gray-300 p-3 text-center bg-emerald-50 font-medium text-gray-400">--</td>
                              <td className="border-2 border-gray-300 p-3 text-center bg-amber-50 font-medium text-gray-400">--</td>
                            </>
                          );
                        }
                        const pct = t.percentage;
                        const pctColor = pct >= 75 ? 'text-green-700 bg-green-50' : pct >= 50 ? 'text-amber-700 bg-amber-50' : pct >= 35 ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50';
                        return (
                          <>
                            <td className="border-2 border-gray-300 p-3 text-center bg-emerald-50 font-bold text-emerald-800">
                              {t.total}
                              <span className="text-xs font-normal text-gray-500">/{t.maxTotal}</span>
                            </td>
                            <td className={`border-2 border-gray-300 p-3 text-center font-bold ${pctColor}`}>
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
                    <td colSpan={4} className="border-2 border-gray-300 p-3 text-right sticky left-0 bg-gray-200 z-10">
                      📊 Analytics
                    </td>
                    {subjects.map((subject) => {
                      const st = subjectStats[subject.exam_public_id];
                      const colors = getSubjectColor(subject.subject_name);
                      return (
                        <td key={subject.exam_public_id} className={`border-2 ${colors.border} p-2 ${colors.bg} text-center text-xs`}>
                          <div className="space-y-0.5">
                            <div className="text-red-600 font-bold">AB: {st?.absent || 0}</div>
                            <div className="text-gray-600">Entered: {st?.entered || 0}/{st?.total || 0}</div>
                            <div className="text-blue-700 font-medium">Avg: {st?.avg || 0}</div>
                          </div>
                        </td>
                      );
                    })}
                    <td className="border-2 border-gray-300 p-2 bg-emerald-100 text-center text-xs">
                      <div className="text-emerald-700 font-bold">
                        Class Avg: {(() => {
                          const vals = Object.values(studentTotals).filter(t => t.subjectsAttempted > 0);
                          if (vals.length === 0) return '--';
                          const avg = vals.reduce((s, t) => s + t.total, 0) / vals.length;
                          return Math.round(avg * 100) / 100;
                        })()}
                      </div>
                    </td>
                    <td className="border-2 border-gray-300 p-2 bg-amber-100 text-center text-xs">
                      <div className="text-amber-700 font-bold">
                        Avg: {(() => {
                          const vals = Object.values(studentTotals).filter(t => t.subjectsAttempted > 0);
                          if (vals.length === 0) return '--';
                          const avg = vals.reduce((s, t) => s + t.percentage, 0) / vals.length;
                          return Math.round(avg * 100) / 100 + '%';
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
