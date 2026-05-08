/**
 * Marks Overview Table Component
 * Displays student marks in a table format with:
 * - Student name and roll number
 * - Subject columns with marks (obtained/max)
 * - Final percentage column
 */

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarksOverviewResponse, MarksOverviewStudent, MarksOverviewSubject } from '../api/exams-api';

interface MarksOverviewTableProps {
  data: MarksOverviewResponse;
}

function PassFailBadge({ isPass }: { isPass: boolean | null }) {
  if (isPass === null) {
    return <Badge variant="outline" className="text-xs">N/A</Badge>;
  }
  return (
    <Badge 
      variant={isPass ? 'default' : 'destructive'} 
      className={cn(
        'text-xs',
        isPass && 'bg-emerald-500 hover:bg-emerald-600'
      )}
    >
      {isPass ? 'Pass' : 'Fail'}
    </Badge>
  );
}

function MarksCell({ 
  marks, 
  maxMarks, 
  passingMarks,
  isAbsent 
}: { 
  marks: number; 
  maxMarks: number; 
  passingMarks: number;
  isAbsent: boolean;
}) {
  if (isAbsent) {
    return (
      <span className="text-sm font-medium text-gray-400">AB</span>
    );
  }
  
  const isPassing = marks >= passingMarks;
  
  return (
    <div className="text-center">
      <span className={cn(
        'text-sm font-medium',
        isPassing ? 'text-emerald-600' : 'text-red-600'
      )}>
        {marks}
      </span>
      <span className="text-xs text-gray-400">/{maxMarks}</span>
    </div>
  );
}

export function MarksOverviewTable({ data }: MarksOverviewTableProps) {
  const { subjects, students, stats } = data;

  // Sort students by name
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => 
      a.student_name.localeCompare(b.student_name)
    );
  }, [students]);

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-500">
          No exams found for this session and class.
        </p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-500">
          No students found in this class.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-6 rounded-lg border bg-muted/30 px-4 py-3">
        <div className="text-sm">
          <span className="text-gray-500">Total Students:</span>{' '}
          <span className="font-semibold">{stats.total_students}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Passed:</span>{' '}
          <span className="font-semibold text-emerald-600">{stats.passed_count}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Failed:</span>{' '}
          <span className="font-semibold text-red-600">{stats.failed_count}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Pass %:</span>{' '}
          <span className="font-semibold">{stats.pass_percentage}%</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[50px] text-center font-semibold">#</TableHead>
              <TableHead className="min-w-[180px] font-semibold">Name</TableHead>
              <TableHead className="w-[100px] font-semibold">Roll No</TableHead>
              {subjects.map((subject) => (
                <TableHead 
                  key={subject.exam_public_id} 
                  className="min-w-[100px] text-center font-semibold"
                >
                  <div className="flex flex-col">
                    <span>{subject.subject_name}</span>
                    <span className="text-[10px] font-normal text-gray-400">
                      Pass: {subject.passing_marks}/{subject.max_marks}
                    </span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-center font-semibold">Total</TableHead>
              <TableHead className="w-[80px] text-center font-semibold">%</TableHead>
              <TableHead className="w-[80px] text-center font-semibold">Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student, index) => (
              <StudentRow 
                key={student.student_public_id}
                student={student}
                subjects={subjects}
                index={index + 1}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface StudentRowProps {
  student: MarksOverviewStudent;
  subjects: MarksOverviewSubject[];
  index: number;
}

function StudentRow({ student, subjects, index }: StudentRowProps) {
  // Handle optional marks and summary fields
  const marks = student.marks || {};
  const summary = student.summary || { total_max: 0, total_obtained: 0, percentage: 0, is_pass: null };
  
  // Check if any marks have been entered
  const hasMarks = Object.keys(marks).length > 0 && summary.total_max > 0;

  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="text-center text-sm text-gray-500">{index}</TableCell>
      <TableCell className="font-medium">{student.student_name}</TableCell>
      <TableCell className="text-sm text-gray-600">
        {student.admission_number || student.roll_number || '-'}
      </TableCell>
      {subjects.map((subject) => {
        const subjectMarks = marks[subject.exam_public_id];
        if (!subjectMarks) {
          return (
            <TableCell key={subject.exam_public_id} className="text-center">
              <span className="text-sm text-gray-300">-</span>
            </TableCell>
          );
        }
        return (
          <TableCell key={subject.exam_public_id} className="text-center">
            <MarksCell 
              marks={subjectMarks.marks_obtained}
              maxMarks={subjectMarks.max_marks}
              passingMarks={subjectMarks.passing_marks}
              isAbsent={subjectMarks.is_absent}
            />
          </TableCell>
        );
      })}
      <TableCell className="text-center">
        {hasMarks ? (
          <span className="text-sm font-medium">
            {summary.total_obtained}/{summary.total_max}
          </span>
        ) : (
          <span className="text-sm text-gray-300">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        {hasMarks ? (
          <span className={cn(
            'text-sm font-semibold',
            summary.percentage >= 60 ? 'text-emerald-600' : 
            summary.percentage >= 35 ? 'text-amber-600' : 'text-red-600'
          )}>
            {summary.percentage}%
          </span>
        ) : (
          <span className="text-sm text-gray-300">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <PassFailBadge isPass={summary.is_pass} />
      </TableCell>
    </TableRow>
  );
}

export default MarksOverviewTable;
