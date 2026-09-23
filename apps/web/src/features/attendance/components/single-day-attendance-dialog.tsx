import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sun, Moon, XCircle, Lock } from 'lucide-react';
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
import { bulkSubmitEmployeeAttendance } from '@/features/attendance/api/attendance-api';
import { useTimesheetSubmissions } from '../hooks';
import { isLastWorkingDayOfWeek } from '../utils';
import { TimesheetSubmitPrompt } from './timesheet-submit-prompt';

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

  const checkIsLastWorkingDay = (): boolean => {
    return isLastWorkingDayOfWeek({
      date,
      weekStart,
      weekEnd,
      workingDayPolicy,
      holidaySet,
      exceptionsMap,
      attendanceByDate,
    });
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
      const shouldPromptTimesheet = !isTimesheetSubmitted && checkIsLastWorkingDay();

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
            errors?: Record<string, string[]>;
          };
        };
        message?: string;
      };

      // Extract error from different response formats
      // Format 1: data.data.errors[0].error (old bulk submit)
      const bulkErrors = err?.response?.data?.data?.errors;
      const bulkErrorMessage = bulkErrors?.[0]?.error;

      // Format 2: errors.attendance_records[0] (new validation format)
      const validationErrors = err?.response?.data?.errors;
      const validationErrorMessage = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : undefined;

      const errorMessage =
        bulkErrorMessage ||
        validationErrorMessage ||
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
        <DialogContent className="w-[calc(100vw-1.5rem)] bg-white sm:w-full sm:max-w-md">
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

      {/* Timesheet submission prompt */}
      <TimesheetSubmitPrompt
        open={showTimesheetPrompt}
        onOpenChange={setShowTimesheetPrompt}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
    </>
  );
}
