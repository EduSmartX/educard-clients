import type { StudentMarksEntry, StudentExamMark } from '../api/exams-api';

interface StudentMarkEntry {
  studentId: string;
  rollNumber: string;
  name: string;
  photo?: string;
  gender?: string;
  marks: Record<string, string>;
}

interface SubjectInfo {
  exam_public_id: string;
}

interface StudentData {
  student_public_id: string;
  roll_number?: string | null;
  student_name: string;
  profile_photo_thumbnail?: string | null;
  gender?: string | null;
  marks?: Record<string, { marks_obtained: number; is_absent: boolean }>;
}

/** Convert backend student data to mark entry format for input fields */
export function buildStudentMarkEntries(students: StudentData[]): StudentMarkEntry[] {
  return students.map((student) => {
    const marksMap: Record<string, string> = {};
    if (student.marks) {
      Object.entries(student.marks).forEach(([examId, markData]) => {
        if (markData.is_absent) {
          marksMap[examId] = 'AB';
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
}

/** Build the bulk save payload from student marks and subjects */
export function buildBulkSavePayload(
  studentMarks: StudentMarkEntry[],
  subjects: SubjectInfo[]
): StudentMarksEntry[] {
  const studentsPayload: StudentMarksEntry[] = [];

  studentMarks.forEach((student) => {
    const examMarks: StudentExamMark[] = [];

    subjects.forEach((subject) => {
      const markValue = student.marks[subject.exam_public_id];
      if (markValue !== undefined && markValue !== '') {
        const isAbsent = markValue.toUpperCase() === 'AB';
        if (isAbsent) {
          examMarks.push({
            exam_id: subject.exam_public_id,
            is_absent: true,
          });
        } else {
          examMarks.push({
            exam_id: subject.exam_public_id,
            marks_obtained: Number.parseFloat(markValue) || 0,
          });
        }
      }
    });

    if (examMarks.length > 0) {
      studentsPayload.push({
        student_id: student.studentId,
        marks: examMarks,
      });
    }
  });

  return studentsPayload;
}

/** Validate and normalize marks input value. Returns null if invalid. */
export function normalizeMarksInput(
  value: string,
  maxMarks: number
): { normalized: string; isAbsent: boolean } | null {
  const upper = value.toUpperCase();
  if (upper === 'A' || upper === 'AB') {
    return { normalized: 'AB', isAbsent: true };
  }
  if (value === '') {
    return { normalized: '', isAbsent: false };
  }
  const numValue = Number.parseFloat(value);
  if (Number.isNaN(numValue) || numValue < 0 || numValue > maxMarks) {
    return null; // Invalid
  }
  return { normalized: value, isAbsent: false };
}
