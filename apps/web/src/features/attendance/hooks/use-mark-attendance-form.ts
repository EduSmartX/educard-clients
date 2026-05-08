import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { AttendanceUiText } from '@/constants';
import {
  useEligibleClasses,
  useComprehensiveAttendance,
  useValidateDate,
  useBulkMarkAttendance,
} from './use-attendance';
import type { StudentRow } from '../types/index';

const formSchema = z.object({
  class_id: z.string().min(1, AttendanceUiText.SELECT_CLASS),
  date: z.date({
    required_error: AttendanceUiText.SELECT_DATE,
  }),
  period: z.enum(['morning', 'afternoon', 'full_day']),
});

export type MarkAttendanceFormData = z.infer<typeof formSchema>;

export function useMarkAttendanceForm() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const initialStudentsRef = useRef<StudentRow[] | null>(null);

  const form = useForm<MarkAttendanceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      class_id: '',
      date: new Date(),
      period: 'full_day',
    },
  });

  const classId = form.watch('class_id');
  const selectedDate = form.watch('date');
  const period = form.watch('period');

  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  // Queries
  const { data: eligibleClasses, isLoading: loadingClasses } = useEligibleClasses();

  // Validate the date
  const { data: dateValidation } = useValidateDate(
    classId,
    dateString,
    !!classId && !!dateString
  );

  // Fetch comprehensive data if it's a working day
  const isWorkingDay = dateValidation?.is_working_day ?? true;
  const { data: comprehensiveData, isLoading: loadingData } =
    useComprehensiveAttendance(
      classId,
      dateString,
      !!classId && !!dateString && isWorkingDay
    );

  const bulkMarkMutation = useBulkMarkAttendance();

  // Process comprehensive data when it loads
  useEffect(() => {
    if (comprehensiveData) {
      const hasExisting = comprehensiveData.some((s) => s.attendance_public_id);

      const studentRows: StudentRow[] = comprehensiveData.map((student) => ({
        ...student,
        canEdit: student.leave_status !== 'approved',
        remarks: student.attendance_remarks || '',
        user: {
          public_id: student.public_id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
        },
        class_assigned: {
          public_id: student.class_id || '',
          class_name: student.class_name || '',
          section: student.section || '',
        },
        roll_number: student.roll_number || '',
      }));

      setStudents(studentRows);
      setIsViewMode(hasExisting);
      initialStudentsRef.current = hasExisting
        ? JSON.parse(JSON.stringify(studentRows))
        : null;
    }
  }, [comprehensiveData]);

  // Reset students when class or date changes
  useEffect(() => {
    if (!classId || !dateString) {
      setStudents([]);
      setIsViewMode(false);
      initialStudentsRef.current = null;
    }
  }, [classId, dateString]);

  const updateStudentStatus = (
    studentId: string,
    field: 'morning_present' | 'afternoon_present',
    value: boolean
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.public_id === studentId && s.canEdit ? { ...s, [field]: value } : s
      )
    );
  };

  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.public_id === studentId && s.canEdit ? { ...s, remarks } : s
      )
    );
  };

  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => {
        if (!s.canEdit) {
          return s;
        }
        return {
          ...s,
          morning_present: true,
          afternoon_present: true,
        };
      })
    );
  };

  const markAllAbsent = () => {
    setStudents((prev) =>
      prev.map((s) => {
        if (!s.canEdit) {
          return s;
        }
        return {
          ...s,
          morning_present: false,
          afternoon_present: false,
        };
      })
    );
  };

  const hasChanges = (): boolean => {
    if (!initialStudentsRef.current) {
      return true;
    }

    return students.some((current, index) => {
      const initial = initialStudentsRef.current![index];
      return (
        current.canEdit &&
        (current.morning_present !== initial.morning_present ||
          current.afternoon_present !== initial.afternoon_present ||
          current.remarks !== initial.remarks)
      );
    });
  };

  const handleEdit = () => {
    setIsViewMode(false);
  };

  const handleCancel = () => {
    if (initialStudentsRef.current) {
      setStudents(JSON.parse(JSON.stringify(initialStudentsRef.current)));
      setIsViewMode(true);
    }
  };

  const handleSubmit = async (data: MarkAttendanceFormData) => {
    const payload = {
      date: format(data.date, 'yyyy-MM-dd'),
      period: data.period,
      attendance_records: students.map((student) => ({
        student_id: student.public_id,
        morning_present: student.morning_present,
        afternoon_present: student.afternoon_present,
        remarks: student.remarks || '',
      })),
    };

    await bulkMarkMutation.mutateAsync({ classId: data.class_id, payload });
    
    // Update view mode and initial state after successful submit
    setIsViewMode(true);
    initialStudentsRef.current = JSON.parse(JSON.stringify(students));
  };

  // Calculate summary stats
  const summary = {
    total: students.length,
    present:
      period === 'morning'
        ? students.filter((s) => s.morning_present).length
        : period === 'afternoon'
          ? students.filter((s) => s.afternoon_present).length
          : students.filter((s) => s.morning_present && s.afternoon_present).length,
    absent:
      period === 'morning'
        ? students.filter((s) => !s.morning_present && s.canEdit).length
        : period === 'afternoon'
          ? students.filter((s) => !s.afternoon_present && s.canEdit).length
          : students.filter(
              (s) => !s.morning_present && !s.afternoon_present && s.canEdit
            ).length,
    onLeave: students.filter((s) => s.leave_status === 'approved').length,
  };

  return {
    form,
    students,
    isViewMode,
    classId,
    selectedDate,
    period,
    dateString,
    eligibleClasses,
    loadingClasses,
    dateValidation,
    isWorkingDay,
    loadingData,
    bulkMarkMutation,
    summary,
    hasChanges: hasChanges(),
    actions: {
      updateStudentStatus,
      updateStudentRemarks,
      markAllPresent,
      markAllAbsent,
      handleEdit,
      handleCancel,
      handleSubmit,
    },
  };
}
