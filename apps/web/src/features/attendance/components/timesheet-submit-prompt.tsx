import { useState } from 'react';
import { format } from 'date-fns';
import { Loader2, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  bulkSubmitEmployeeAttendance,
  getEmployeeAttendance,
} from '@/features/attendance/api/attendance-api';

interface TimesheetSubmitPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStart: Date;
  weekEnd: Date;
}

export function TimesheetSubmitPrompt({
  open,
  onOpenChange,
  weekStart,
  weekEnd,
}: TimesheetSubmitPromptProps) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const weekFromDate = format(weekStart, 'yyyy-MM-dd');
      const weekToDate = format(weekEnd, 'yyyy-MM-dd');

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

      await bulkSubmitEmployeeAttendance({
        attendance_records: records,
        week_start_date: weekFromDate,
        week_end_date: weekToDate,
        submit_timesheet: true,
      });

      toast.success('Timesheet submitted successfully!', {
        description: `Week of ${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`,
      });

      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-status'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-attendance'] });

      onOpenChange(false);
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
        tsErrors?.[0] ||
        (typeof recErrors?.[0] === 'string' ? recErrors[0] : undefined) ||
        err?.response?.data?.message ||
        'Failed to submit timesheet';
      toast.error('Submission Failed', {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitting) {
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-1.5rem)] bg-white sm:w-full sm:max-w-md">
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
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="flex-1"
          >
            Later
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {submitting ? (
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
  );
}
