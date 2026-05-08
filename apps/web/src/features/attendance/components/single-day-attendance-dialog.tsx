import { useEffect, useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isBefore,
  isSameDay,
  getDay,
} from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sun, Moon, XCircle, Lock, FileText } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  bulkSubmitEmployeeAttendance,
  getEmployeeAttendance,
} from '@/features/attendance/api/attendance-api';
import { useTimesheetSubmissions } from '../hooks';

interface SingleDayAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  workingDayPolicy?: { sunday_off: boolean; saturday_off_pattern: string } | null;
  holidaySet?: Set<string>;
  exceptionsMap?: Map<string, { type: string; reason: string }>;
  attendanceByDate?: Map<
    string,
    {
      date: string;
      morning_present: boolean;
      afternoon_present: boolean;
      approval_status?: string;
    }
  >;
}

type AttendanceSession = 'MORNING' | 'AFTERNOON';
type AttendanceMode = 'sessions' | 'absent';

export function SingleDayAttendanceDialog({
  open,
  onOpenChange,
  date,
  workingDayPolicy,
  holidaySet,
  exceptionsMap,
  attendanceByDate,
}: SingleDayAttendanceDialogProps) {
  const queryClient = useQueryClient();

  // Pre-fill from existing attendance record
  const existingRecord = attendanceByDate?.get(format(date, 'yyyy-MM-dd'));
  const initialMode = (): AttendanceMode => {
    if (!existingRecord) {
      return 'sessions';
    }
    if (!existingRecord.morning_present && !existingRecord.afternoon_present) {
      return 'absent';
    }
    return 'sessions';
  };
  const initialSessions = (): AttendanceSession[] => {
    if (!existingRecord) {
      return [];
    }
    const sessions: AttendanceSession[] = [];
    if (existingRecord.morning_present) {
      sessions.push('MORNING');
    }
    if (existingRecord.afternoon_present) {
      sessions.push('AFTERNOON');
    }
    return sessions;
  };

  const [mode, setMode] = useState<AttendanceMode>(initialMode);
  const [selectedSessions, setSelectedSessions] = useState<AttendanceSession[]>(initialSessions);
  const [showTimesheetPrompt, setShowTimesheetPrompt] = useState(false);
  const [submittingTimesheet, setSubmittingTimesheet] = useState(false);

  // Re-sync state when dialog opens or date changes
  useEffect(() => {
    if (open) {
      setMode(initialMode());
      setSelectedSessions(initialSessions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date.toISOString()]);

  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 }); // Saturday

  // Check if timesheet for this week is approved
  const { data: timesheetData } = useTimesheetSubmissions({
    week_start_date: format(weekStart, 'yyyy-MM-dd'),
    week_end_date: format(weekEnd, 'yyyy-MM-dd'),
  });

  const timesheetSubmissions = timesheetData?.results || [];
  const weekTimesheet = timesheetSubmissions[0];
  const isTimesheetApproved = weekTimesheet?.submission_status === 'APPROVED';
  const isTimesheetSubmitted =
    weekTimesheet?.submission_status === 'SUBMITTED' ||
    weekTimesheet?.submission_status === 'APPROVED';

  /**
   * Determine if `date` is the last working day of the week (Sun→Sat).
   * Uses working day policy, holidays, and calendar exceptions to find all
   * working days in the week, then checks whether every working day up to
   * and including `date` has attendance recorded (or is the current submission).
   */
  const isLastWorkingDayOfWeek = (): boolean => {
    const policy = workingDayPolicy || { sunday_off: true, saturday_off_pattern: 'ALL' };
    const holidays = holidaySet || new Set<string>();
    const exceptions = exceptionsMap || new Map<string, { type: string; reason: string }>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // Determine which days in the week are working days (up to today)
    const submittedDateKey = format(date, 'yyyy-MM-dd');
    const workingDays = weekDays.filter((day) => {
      if (isBefore(today, day) && !isSameDay(today, day)) {
        return false;
      }

      const key = format(day, 'yyyy-MM-dd');

      // The date being submitted right now is always a working day
      if (key === submittedDateKey) {
        return true;
      }

      // If attendance exists for this day, it's a working day regardless of policy
      if (attendanceByDate?.has(key)) {
        return true;
      }

      const exception = exceptions.get(key);
      if (exception) {
        return exception.type.toUpperCase() === 'FORCE_WORKING';
      }

      if (holidays.has(key)) {
        return false;
      }

      const dayOfWeek = getDay(day);
      if (dayOfWeek === 0 && policy.sunday_off) {
        return false;
      }

      if (dayOfWeek === 6) {
        const pattern = policy.saturday_off_pattern;
        if (pattern === 'ALL') {
          return false;
        }
        if (pattern !== 'NONE') {
          const saturdayOfMonth = Math.ceil(day.getDate() / 7);
          if (pattern === 'SECOND_ONLY' && saturdayOfMonth === 2) {
            return false;
          }
          if (pattern === 'FIRST_AND_THIRD' && (saturdayOfMonth === 1 || saturdayOfMonth === 3)) {
            return false;
          }
          if (pattern === 'SECOND_AND_FOURTH' && (saturdayOfMonth === 2 || saturdayOfMonth === 4)) {
            return false;
          }
        }
      }

      return true;
    });

    if (workingDays.length === 0) {
      return false;
    }

    // The submitted date must be the last working day in the week
    const lastWorkingDay = workingDays[workingDays.length - 1];
    return isSameDay(lastWorkingDay, date);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Determine attendance status based on mode and selected sessions
      let status: 'P' | 'HP' | 'A';
      let morningPresent: boolean;
      let afternoonPresent: boolean;

      if (mode === 'absent') {
        status = 'A';
        morningPresent = false;
        afternoonPresent = false;
      } else {
        morningPresent = selectedSessions.includes('MORNING');
        afternoonPresent = selectedSessions.includes('AFTERNOON');

        if (selectedSessions.length === 2) {
          status = 'P';
        } else if (selectedSessions.length === 1) {
          status = 'HP';
        } else {
          status = 'A';
        }
      }

      const submission = {
        attendance_records: [
          {
            date: dateStr,
            attendance_status: status,
            morning_present: morningPresent,
            afternoon_present: afternoonPresent,
          },
        ],
      };

      return bulkSubmitEmployeeAttendance(submission);
    },
    onSuccess: () => {
      toast.success('Attendance submitted successfully', {
        description: `Submitted for ${format(date, 'MMMM d, yyyy')}`,
      });

      // Invalidate attendance queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['timesheet', 'attendance'] });

      // Check if we should prompt for weekly timesheet submission BEFORE closing
      const shouldPromptTimesheet = !isTimesheetSubmitted && isLastWorkingDayOfWeek();

      // Reset and close the daily attendance dialog
      setMode('sessions');
      setSelectedSessions([]);
      onOpenChange(false);

      // Show the timesheet prompt after closing the attendance dialog
      if (shouldPromptTimesheet) {
        // Small delay to ensure the attendance dialog is fully closed
        setTimeout(() => {
          setShowTimesheetPrompt(true);
        }, 300);
      }
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: {
          data?: {
            detail?: string;
            message?: string;
            data?: { errors?: Array<{ error?: string; date?: string }> };
          };
        };
        message?: string;
      };
      // Extract error from bulk submit response: data.data.errors[0].error
      const bulkErrors = err?.response?.data?.data?.errors;
      const bulkErrorMessage = bulkErrors?.[0]?.error;
      const errorMessage =
        bulkErrorMessage ||
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit attendance';
      toast.error('Submission Failed', {
        description: errorMessage,
        duration: 6000,
      });
    },
  });

  const toggleSession = (session: AttendanceSession) => {
    setMode('sessions');
    setSelectedSessions((prev) =>
      prev.includes(session) ? prev.filter((s) => s !== session) : [...prev, session]
    );
  };

  const handleAbsent = () => {
    setMode('absent');
    setSelectedSessions([]);
  };

  const handleSubmit = () => {
    if (mode === 'sessions' && selectedSessions.length === 0) {
      toast.error('Please select at least one session or mark as absent');
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setMode('sessions');
      setSelectedSessions([]);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Attendance</DialogTitle>
            <DialogDescription>
              Mark your attendance for {format(date, 'EEEE, MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {isTimesheetSubmitted && (
            <Alert className="border-amber-200 bg-amber-50">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {isTimesheetApproved ? (
                  <>
                    <strong>Timesheet Approved:</strong> The timesheet for this week has been
                    approved. You cannot modify attendance for this date.
                  </>
                ) : (
                  <>
                    <strong>Timesheet Submitted:</strong> The timesheet for this week is pending
                    approval. You cannot modify attendance until it is returned to draft.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 bg-white py-4">
            <div className="mb-2 text-sm text-gray-600">
              Select the sessions you were present, or mark as absent:
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={selectedSessions.includes('MORNING') ? 'default' : 'outline'}
                className={`flex h-20 flex-col gap-2 ${
                  selectedSessions.includes('MORNING')
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleSession('MORNING')}
                disabled={mutation.isPending || isTimesheetSubmitted}
              >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Morning</span>
              </Button>

              <Button
                type="button"
                variant={selectedSessions.includes('AFTERNOON') ? 'default' : 'outline'}
                className={`flex h-20 flex-col gap-2 ${
                  selectedSessions.includes('AFTERNOON')
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleSession('AFTERNOON')}
                disabled={mutation.isPending || isTimesheetSubmitted}
              >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Afternoon</span>
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="text-muted-foreground bg-white px-2">Or</span>
              </div>
            </div>

            <Button
              type="button"
              variant={mode === 'absent' ? 'destructive' : 'outline'}
              className={`flex h-16 w-full items-center justify-center gap-2 ${
                mode === 'absent'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={handleAbsent}
              disabled={mutation.isPending || isTimesheetSubmitted}
            >
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Mark as Absent</span>
            </Button>

            {mode === 'sessions' && selectedSessions.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm">
                {selectedSessions.length === 2 ? (
                  <span className="font-medium text-blue-700">✓ Full Day Present</span>
                ) : (
                  <span className="font-medium text-blue-700">
                    ✓ Half Day Present ({selectedSessions[0].toLowerCase()})
                  </span>
                )}
              </div>
            )}

            {mode === 'absent' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm">
                <span className="font-medium text-red-700">✗ Marked as Absent (Full Day)</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                mutation.isPending ||
                (mode === 'sessions' && selectedSessions.length === 0) ||
                isTimesheetSubmitted
              }
              className="flex-1"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Timesheet submission prompt — submit directly from here */}
      <Dialog
        open={showTimesheetPrompt}
        onOpenChange={(open) => {
          if (!submittingTimesheet) {
            setShowTimesheetPrompt(open);
          }
        }}
      >
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Submit Weekly Timesheet?
            </DialogTitle>
            <DialogDescription>
              You&apos;ve completed attendance for the last working day of the week (
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}). Would you like to
              submit your timesheet for the whole week now?
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowTimesheetPrompt(false)}
              disabled={submittingTimesheet}
              className="flex-1"
            >
              Later
            </Button>
            <Button
              onClick={async () => {
                setSubmittingTimesheet(true);
                try {
                  const weekFromDate = format(weekStart, 'yyyy-MM-dd');
                  const weekToDate = format(weekEnd, 'yyyy-MM-dd');

                  // Fetch the full week's attendance records
                  const attendanceResponse = await getEmployeeAttendance({
                    from_date: weekFromDate,
                    to_date: weekToDate,
                  });

                  const records = (attendanceResponse?.records || [])
                    .filter((r) => r.morning_present !== undefined)
                    .map((r) => ({
                      date: r.date,
                      morning_present: r.morning_present,
                      afternoon_present: r.afternoon_present,
                      remarks: r.remarks || '',
                    }));

                  if (records.length === 0) {
                    toast.error('No attendance records found for this week.');
                    return;
                  }

                  // Submit with submit_timesheet: true to create the timesheet submission
                  await bulkSubmitEmployeeAttendance({
                    attendance_records: records,
                    week_start_date: weekFromDate,
                    week_end_date: weekToDate,
                    submit_timesheet: true,
                  });

                  toast.success('Timesheet submitted successfully!', {
                    description: `Week of ${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`,
                  });

                  // Refresh all related queries
                  queryClient.invalidateQueries({ queryKey: ['timesheet'] });
                  queryClient.invalidateQueries({ queryKey: ['attendance'] });
                  queryClient.invalidateQueries({ queryKey: ['timesheet-status'] });
                  queryClient.invalidateQueries({ queryKey: ['timesheet-submissions'] });
                  queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });

                  setShowTimesheetPrompt(false);
                } catch (error: unknown) {
                  const err = error as {
                    response?: {
                      data?: {
                        message?: string;
                        errors?: {
                          timesheet_submission?: string[];
                          attendance_records?: string[];
                        };
                      };
                    };
                  };
                  const tsErrors = err?.response?.data?.errors?.timesheet_submission;
                  const recErrors = err?.response?.data?.errors?.attendance_records;
                  const errorMessage =
                    (tsErrors && tsErrors[0]) ||
                    (recErrors && typeof recErrors[0] === 'string' && recErrors[0]) ||
                    err?.response?.data?.message ||
                    'Failed to submit timesheet';
                  toast.error('Submission Failed', {
                    description: errorMessage,
                    duration: 6000,
                  });
                } finally {
                  setSubmittingTimesheet(false);
                }
              }}
              disabled={submittingTimesheet}
              className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {submittingTimesheet ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Timesheet
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
