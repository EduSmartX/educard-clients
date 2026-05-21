import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Loader2,
  AlertCircle,
  Users,
  UserX,
  CheckCircle2,
  XCircle,
  Sun,
  Sunset,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  useEligibleClasses,
  useComprehensiveAttendance,
  useValidateDate,
  useBulkMarkAttendance,
} from '../hooks/use-attendance';
import { StudentAttendanceTable } from './student-attendance-table';
import type { StudentRow } from '../types/index';
import { AttendanceUiText, CommonUiText } from '@/constants';

const formSchema = z.object({
  class_id: z.string().min(1, AttendanceUiText.SELECT_CLASS),
  date: z.date({
    required_error: AttendanceUiText.SELECT_DATE,
  }),
  period: z.enum(['morning', 'afternoon', 'full_day']),
});

type FormData = z.infer<typeof formSchema>;

export function MarkAttendanceForm() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const initialStudentsRef = useRef<StudentRow[] | null>(null);

  const form = useForm<FormData>({
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

  // First validate the date
  const { data: dateValidation } = useValidateDate(classId, dateString, !!classId && !!dateString);

  // Only fetch comprehensive data if it's a working day
  const isWorkingDay = dateValidation?.is_working_day ?? true;
  const { data: comprehensiveData, isLoading: loadingData } = useComprehensiveAttendance(
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
        // Determine if user can edit: only if leave is NOT approved
        canEdit: student.leave_status !== 'approved',
        // Map comprehensive fields to table-expected fields
        remarks: student.attendance_remarks || '',
        user: {
          public_id: student.public_id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
        },
        class_assigned: {
          public_id: classId,
          display_name: '',
        },
        leave_info: student.leave_status
          ? {
              leave_status: student.leave_status,
              leave_type: student.leave_type,
              leave_reason: student.leave_reason,
            }
          : undefined,
        // Ensure booleans are not null
        morning_present: student.morning_present ?? false,
        afternoon_present: student.afternoon_present ?? false,
        // Fix attendance_status type (null -> undefined)
        attendance_status: student.attendance_status ?? undefined,
      }));

      setStudents(studentRows);
      setIsViewMode(hasExisting);
      // store a snapshot of the initial students so Reset can revert to it
      initialStudentsRef.current = studentRows.map((s) => ({ ...s }));
    }
  }, [comprehensiveData, classId]);

  const handleReset = () => {
    // Preserve current selections (class, date, period) and reset other form values
    const currentClass = form.getValues('class_id');
    const currentDate = form.getValues('date');
    const currentPeriod = form.getValues('period');

    form.reset({
      class_id: currentClass,
      date: currentDate,
      period: currentPeriod,
    });

    if (initialStudentsRef.current) {
      setStudents(initialStudentsRef.current.map((s) => ({ ...s })));
      const hadExisting = initialStudentsRef.current.some((s) => !!s.attendance_public_id);
      setIsViewMode(hadExisting);
    } else {
      setStudents([]);
      setIsViewMode(false);
    }
  };

  const handleStudentChange = (
    studentPublicId: string,
    field: 'morning_present' | 'afternoon_present' | 'remarks',
    value: boolean | string
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.public_id !== studentPublicId) {
          return student;
        }

        if (field === 'remarks') {
          return { ...student, remarks: value as string, attendance_remarks: value as string };
        }
        return { ...student, [field]: value as boolean };
      })
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        morning_present: student.canEdit ? true : student.morning_present,
        afternoon_present: student.canEdit ? true : student.afternoon_present,
      }))
    );
  };

  const handleMarkAllAbsent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        morning_present: student.canEdit ? false : student.morning_present,
        afternoon_present: student.canEdit ? false : student.afternoon_present,
      }))
    );
  };

  const onSubmit = async (data: FormData) => {
    // Only submit students who can be edited (not on approved leave)
    const attendanceRecords = students
      .filter((s) => s.canEdit)
      .map((student) => ({
        user: student.public_id,
        morning_present: student.morning_present ?? false,
        afternoon_present: student.afternoon_present ?? false,
        remarks: student.attendance_remarks ?? '',
      }));

    await bulkMarkMutation.mutateAsync({
      classId: data.class_id,
      payload: {
        date: format(data.date, 'yyyy-MM-dd'),
        period: data.period,
        attendance_records: attendanceRecords,
      },
    });

    setIsViewMode(true);
  };

  const isSubmitting = bulkMarkMutation.isPending;
  const canSubmit = students.length > 0 && !isViewMode && isWorkingDay;
  const hasNoStudentsForSelection =
    !!classId &&
    !!dateString &&
    !loadingData &&
    isWorkingDay &&
    Array.isArray(comprehensiveData) &&
    comprehensiveData.length === 0;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Class, Date, and Period Card with background color */}
          <Card className="shadow-sm" style={{ backgroundColor: '#C5D89D' }}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Class Selection */}
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        {AttendanceUiText.CLASS_LABEL}
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={
                            eligibleClasses?.map((cls) => ({
                              value: cls.public_id,
                              label: cls.display_name,
                            })) || []
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={AttendanceUiText.SELECT_CLASS_PLACEHOLDER}
                          searchPlaceholder="Search classes..."
                          disabled={loadingClasses}
                          emptyText={loadingClasses ? 'Loading...' : 'No classes found'}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Selection */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        {AttendanceUiText.DATE_LABEL}
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || null}
                          onChange={field.onChange}
                          placeholder={AttendanceUiText.SELECT_DATE_PLACEHOLDER}
                          maxDate={new Date()}
                          minDate={new Date('2020-01-01')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Period Selection */}
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        {AttendanceUiText.PERIOD_LABEL}
                      </FormLabel>
                      <FormControl>
                        <div className="flex h-11 items-center rounded-md border border-gray-300 bg-white px-3">
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex gap-3"
                          >
                            <FormItem className="flex items-center space-y-0 space-x-1.5">
                              <FormControl>
                                <RadioGroupItem value="morning" />
                              </FormControl>
                              <FormLabel className="flex cursor-pointer items-center gap-1 font-normal whitespace-nowrap">
                                <Sun className="h-4 w-4 text-amber-500" />
                                <span className="hidden sm:inline">
                                  {AttendanceUiText.PERIOD_MORNING}
                                </span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-y-0 space-x-1.5">
                              <FormControl>
                                <RadioGroupItem value="afternoon" />
                              </FormControl>
                              <FormLabel className="flex cursor-pointer items-center gap-1 font-normal whitespace-nowrap">
                                <Sunset className="h-4 w-4 text-orange-500" />
                                <span className="hidden sm:inline">
                                  {AttendanceUiText.PERIOD_AFTERNOON}
                                </span>
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-y-0 space-x-1.5">
                              <FormControl>
                                <RadioGroupItem value="full_day" />
                              </FormControl>
                              <FormLabel className="flex cursor-pointer items-center gap-1 font-normal whitespace-nowrap">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="hidden sm:inline">
                                  {AttendanceUiText.PERIOD_FULL_DAY}
                                </span>
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {dateValidation && !dateValidation.is_working_day && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-8">
                <div className="mx-auto max-w-2xl space-y-3 text-center">
                  <h3 className="text-lg font-semibold text-red-900">
                    Cannot Submit Attendance On -{' '}
                    {dateValidation.reason || AttendanceUiText.NOT_WORKING_DAY}
                  </h3>
                  <p className="text-sm text-red-700">
                    {dateValidation.reason
                      ? `This date is marked as "${dateValidation.reason}" (Exceptional Holiday). Please select a valid working day.`
                      : 'Attendance cannot be marked for holidays or weekends. Please select a valid working day.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loadingData && classId && isWorkingDay && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <span className="text-muted-foreground ml-2">
                {AttendanceUiText.LOADING_ATTENDANCE}
              </span>
            </div>
          )}

          {/* No Students Info */}
          {hasNoStudentsForSelection && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="py-8">
                <div className="mx-auto max-w-2xl space-y-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-amber-900">
                    No Students Found for This Class
                  </h3>
                  <p className="text-sm text-amber-800">
                    There are no students available to mark attendance for the selected class and
                    date.
                  </p>
                  <p className="text-sm text-amber-800">
                    Please contact your supervisor or administrator to verify class assignments and
                    student enrollment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student List with Leave Info - Only show if working day */}
          {students.length > 0 && !loadingData && isWorkingDay && (
            <div className="space-y-4">
              {isViewMode && (
                <Alert>
                  <AlertDescription className="flex items-center justify-between">
                    <span>{AttendanceUiText.ALREADY_MARKED}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsViewMode(false)}
                    >
                      {AttendanceUiText.EDIT_ATTENDANCE}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Bulk Actions */}
              {!isViewMode && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllPresent}
                    className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    <span className="leading-tight">
                      <span className="sm:hidden">
                        Mark All
                        <br />
                        Present
                      </span>
                      <span className="hidden sm:inline">{AttendanceUiText.MARK_ALL_PRESENT}</span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAbsent}
                    className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    <span className="leading-tight">
                      <span className="sm:hidden">
                        Mark All
                        <br />
                        Absent
                      </span>
                      <span className="hidden sm:inline">{AttendanceUiText.MARK_ALL_ABSENT}</span>
                    </span>
                  </Button>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      {(() => {
                        const editableStudents = students.filter((s) => s.canEdit);
                        const presentCount = editableStudents.filter(
                          (s) => s.morning_present && s.afternoon_present
                        ).length;
                        return presentCount;
                      })()}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserX className="h-4 w-4 text-orange-600" />
                      {(() => {
                        const editableStudents = students.filter((s) => s.canEdit);
                        const absentCount = editableStudents.filter(
                          (s) => !s.morning_present && !s.afternoon_present
                        ).length;
                        return absentCount;
                      })()}
                    </span>
                  </div>
                </div>
              )}

              {/* Render custom table with leave badges */}
              <StudentAttendanceTable
                students={students}
                period={period}
                isViewMode={isViewMode}
                onStudentChange={handleStudentChange}
                onMarkAllPresent={handleMarkAllPresent}
                onMarkAllAbsent={handleMarkAllAbsent}
              />
            </div>
          )}

          {/* Submit Button */}
          {canSubmit && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="brandOutline"
                onClick={handleReset}
                disabled={isSubmitting || !isWorkingDay}
                className="px-6"
              >
                {CommonUiText.RESET}
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={isSubmitting || !isWorkingDay}
                className="px-6"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? CommonUiText.SUBMITTING : AttendanceUiText.SUBMIT_ATTENDANCE}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
