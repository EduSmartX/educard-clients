import { Check, X, Sun, Sunset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { UserAvatar } from '@/components/common/user-avatar';
import { AttendanceUiText } from '@/constants';
import type { AttendancePeriod } from '../types/index';

interface StudentAttendanceRow {
  public_id: string;
  user: {
    public_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  roll_number: string | null;
  gender?: string;
  profile_photo_thumbnail?: string | null;
  morning_present: boolean;
  afternoon_present: boolean;
  remarks: string;
  attendance_status?: string;
  leave_info?: {
    leave_status: 'approved' | 'pending' | null;
    leave_type: string | null;
    leave_reason: string | null;
  };
}

interface StudentAttendanceTableProps {
  students: StudentAttendanceRow[];
  period: AttendancePeriod;
  isViewMode: boolean;
  onStudentChange: (
    studentId: string,
    field: 'morning_present' | 'afternoon_present' | 'remarks',
    value: boolean | string
  ) => void;
}

// Extracted outside parent component for S6478 compliance
function AttendanceToggle({
  present,
  disabled,
  onChange,
}: Readonly<{
  present: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}>) {
  return (
    <div className="flex justify-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={present ? 'default' : 'outline'}
        className={cn('h-8 w-8 p-0', present && 'bg-green-500 text-white hover:bg-green-600')}
        onClick={() => onChange(true)}
        disabled={disabled}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!present ? 'default' : 'outline'}
        className={cn('h-8 w-8 p-0', !present && 'bg-red-500 text-white hover:bg-red-600')}
        onClick={() => onChange(false)}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function StudentAttendanceTable({
  students,
  period,
  isViewMode,
  onStudentChange,
}: StudentAttendanceTableProps) {
  const showMorning = period === 'morning' || period === 'full_day';
  const showAfternoon = period === 'afternoon' || period === 'full_day';

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: '#E8F5E9' }}>
              {/* Roll No - always visible */}
              <TableHead className="w-[60px] px-2 text-xs font-bold text-gray-900 sm:w-[80px] sm:px-3 sm:text-sm">
                {AttendanceUiText.ROLL_NO}
              </TableHead>
              {/* Photo - visible on sm+, no header text needed */}
              <TableHead className="hidden w-[50px] px-1 sm:table-cell sm:px-2">
                {/* Photo column - no header text for cleaner look */}
              </TableHead>
              {/* Student Name */}
              <TableHead className="px-2 text-xs font-bold text-gray-900 sm:px-4 sm:text-sm">
                {AttendanceUiText.STUDENT_NAME}
              </TableHead>
              {showMorning && (
                <TableHead className="w-[80px] px-1 text-center text-xs font-bold text-gray-900 sm:w-[130px] sm:px-4 sm:text-sm">
                  <div className="flex items-center justify-center gap-1">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span className="hidden sm:inline">{AttendanceUiText.PERIOD_MORNING}</span>
                  </div>
                </TableHead>
              )}
              {showAfternoon && (
                <TableHead className="w-[80px] px-1 text-center text-xs font-bold text-gray-900 sm:w-[130px] sm:px-4 sm:text-sm">
                  <div className="flex items-center justify-center gap-1">
                    <Sunset className="h-4 w-4 text-orange-500" />
                    <span className="hidden sm:inline">{AttendanceUiText.PERIOD_AFTERNOON}</span>
                  </div>
                </TableHead>
              )}
              <TableHead className="hidden w-[200px] font-bold text-gray-900 sm:table-cell">
                {AttendanceUiText.REMARKS}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  {AttendanceUiText.NO_STUDENTS}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => {
                const canEdit = !isViewMode && student.leave_info?.leave_status !== 'approved';

                return (
                  <TableRow
                    key={student.public_id}
                    className="hover:bg-muted/30 border-b transition-colors"
                  >
                    <TableCell className="px-2 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm">
                      {student.roll_number}
                    </TableCell>
                    {/* Photo — visible on sm+ screens as a separate column */}
                    <TableCell className="hidden px-1 py-1.5 sm:table-cell sm:px-2 sm:py-2">
                      <UserAvatar
                        thumbnailUrl={student.profile_photo_thumbnail}
                        gender={student.gender}
                        name={`${student.user.first_name} ${student.user.last_name}`}
                        className="h-8 w-8"
                      />
                    </TableCell>
                    <TableCell className="px-2 py-1.5 sm:px-4 sm:py-2">
                      <div className="flex items-center gap-2">
                        {/* Avatar inline on mobile only */}
                        <div className="shrink-0 sm:hidden">
                          <UserAvatar
                            thumbnailUrl={student.profile_photo_thumbnail}
                            gender={student.gender}
                            name={`${student.user.first_name} ${student.user.last_name}`}
                            className="h-7 w-7"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium sm:text-sm">
                            {student.user.first_name} {student.user.last_name}
                          </div>
                          {/* email removed intentionally - show only student name */}
                          {student.leave_info?.leave_status && (
                            <div className="mt-1">
                              {student.leave_info.leave_status === 'approved' ? (
                                <Badge
                                  variant="outline"
                                  className="border-blue-200 bg-blue-50 text-blue-700"
                                >
                                  {AttendanceUiText.ON_LEAVE}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-yellow-200 bg-yellow-50 text-yellow-700"
                                >
                                  {AttendanceUiText.LEAVE_PENDING}
                                </Badge>
                              )}
                              {student.leave_info.leave_type && (
                                <span className="text-muted-foreground ml-2 text-xs">
                                  ({student.leave_info.leave_type})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    {showMorning && (
                      <TableCell className="px-1 py-1.5 text-center sm:px-4 sm:py-2">
                        <AttendanceToggle
                          present={student.morning_present}
                          disabled={!canEdit}
                          onChange={(value) =>
                            onStudentChange(student.public_id, 'morning_present', value)
                          }
                        />
                      </TableCell>
                    )}
                    {showAfternoon && (
                      <TableCell className="px-1 py-1.5 text-center sm:px-4 sm:py-2">
                        <AttendanceToggle
                          present={student.afternoon_present}
                          disabled={!canEdit}
                          onChange={(value) =>
                            onStudentChange(student.public_id, 'afternoon_present', value)
                          }
                        />
                      </TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell">
                      <Input
                        type="text"
                        value={student.remarks}
                        onChange={(e) =>
                          onStudentChange(student.public_id, 'remarks', e.target.value)
                        }
                        placeholder={AttendanceUiText.ADD_REMARKS}
                        disabled={!canEdit}
                        className="text-sm"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
