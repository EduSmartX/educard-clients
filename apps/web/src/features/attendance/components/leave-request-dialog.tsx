/**
 * Leave Request Dialog Component
 * Allows employees to submit leave requests from the timesheet page
 */

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { CalendarDays, Loader2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  calculateWorkingDays,
  createLeaveRequest,
  fetchMyLeaveBalances,
} from '@/features/leave/api/leave-api';
import {
  getTimesheetSubmissions,
  type TimesheetSubmission,
} from '@/features/attendance/api/attendance-api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
  onSuccess?: () => void;
}

type ConflictStatus = 'none' | 'partial' | 'all_blocked';

interface TimesheetConflictResult {
  status: ConflictStatus;
  blockedDates: string[];
  freeCount: number;
  totalDays: number;
}

/** Compute timesheet conflict for leave dates */
function computeTimesheetConflict(
  startDate: Date | null,
  endDate: Date | null,
  timesheetResults: TimesheetSubmission[] | undefined
): TimesheetConflictResult {
  const empty: TimesheetConflictResult = {
    status: 'none',
    blockedDates: [],
    freeCount: 0,
    totalDays: 0,
  };
  if (!startDate || !endDate || !timesheetResults) {
    return empty;
  }

  const lockedSheets = timesheetResults.filter(
    (ts) => ts.submission_status === 'SUBMITTED' || ts.submission_status === 'APPROVED'
  );
  if (lockedSheets.length === 0) {
    return empty;
  }

  const lockedDateSet = buildLockedDateSet(lockedSheets);
  const leaveDays = eachDayOfInterval({ start: startDate, end: endDate });
  const blockedDates: string[] = [];
  let freeCount = 0;
  for (const day of leaveDays) {
    const key = format(day, 'yyyy-MM-dd');
    if (lockedDateSet.has(key)) {
      blockedDates.push(key);
    } else {
      freeCount++;
    }
  }

  const totalDays = leaveDays.length;
  if (blockedDates.length === totalDays) {
    return { status: 'all_blocked', blockedDates, freeCount, totalDays };
  }
  if (blockedDates.length > 0) {
    return { status: 'partial', blockedDates, freeCount, totalDays };
  }
  return empty;
}

function buildLockedDateSet(lockedSheets: TimesheetSubmission[]): Set<string> {
  const set = new Set<string>();
  for (const ts of lockedSheets) {
    eachDayOfInterval({
      start: parseISO(ts.week_start_date),
      end: parseISO(ts.week_end_date),
    }).forEach((d) => set.add(format(d, 'yyyy-MM-dd')));
  }
  return set;
}

export function LeaveRequestDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
}: LeaveRequestDialogProps) {
  const queryClient = useQueryClient();
  const [leaveBalanceId, setLeaveBalanceId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(selectedDate || null);
  const [endDate, setEndDate] = useState<Date | null>(selectedDate || null);
  const [reason, setReason] = useState('');
  const [workingDays, setWorkingDays] = useState<number | null>(null);
  const [calculatingDays, setCalculatingDays] = useState(false);

  // Fetch leave balances
  const { data: leaveBalancesData, isLoading: loadingBalances } = useQuery({
    queryKey: ['leave-balances', 'my'],
    queryFn: () => fetchMyLeaveBalances({ page_size: 100 }),
    enabled: open,
  });

  const leaveBalances = useMemo(() => leaveBalancesData?.data || [], [leaveBalancesData]);

  // Calculate working days when dates change
  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) {
      setWorkingDays(null);
      return;
    }
    setCalculatingDays(true);
    calculateWorkingDays({
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
    })
      .then((response) => setWorkingDays(response.data?.working_days || 0))
      .catch(() => {
        setWorkingDays(null);
        toast.error('Failed to calculate working days');
      })
      .finally(() => setCalculatingDays(false));
  }, [startDate, endDate]);

  // --- Timesheet conflict check ---
  // Query timesheet submissions covering the full week range of selected leave dates
  const timesheetQueryFrom = useMemo(
    () =>
      startDate ? format(startOfWeek(startDate, { weekStartsOn: 0 }), 'yyyy-MM-dd') : undefined,
    [startDate]
  );
  const timesheetQueryTo = useMemo(
    () => (endDate ? format(endOfWeek(endDate, { weekStartsOn: 0 }), 'yyyy-MM-dd') : undefined),
    [endDate]
  );

  const { data: timesheetData } = useQuery({
    queryKey: ['timesheet-submissions', 'leave-conflict', timesheetQueryFrom, timesheetQueryTo],
    queryFn: () =>
      getTimesheetSubmissions({
        from_date: timesheetQueryFrom,
        to_date: timesheetQueryTo,
      }),
    enabled: open && !!startDate && !!endDate && !!timesheetQueryFrom && !!timesheetQueryTo,
    staleTime: 30_000,
  });

  // Compute which leave dates are blocked by submitted/approved timesheets
  const timesheetConflict = useMemo(
    () => computeTimesheetConflict(startDate, endDate, timesheetData?.results),
    [startDate, endDate, timesheetData]
  );

  // Reset form when dialog opens with selected date
  useEffect(() => {
    if (open && selectedDate) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  }, [open, selectedDate]);

  // Create leave request mutation
  const createMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      toast.success('Leave application submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      handleClose();
      onSuccess?.();
    },
    onError: (error: Error & { response?: { data?: { message?: string; errors?: string[] } } }) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.join(', ') ||
        'Failed to submit leave application';
      toast.error(message);
    },
  });

  const validateForm = (): string | null => {
    if (!leaveBalanceId) {
      return 'Please select a leave type';
    }
    if (!startDate || !endDate) {
      return 'Please select start and end dates';
    }
    if (startDate > endDate) {
      return 'End date must be after start date';
    }
    if (!reason.trim()) {
      return 'Please provide a reason';
    }
    if (workingDays === null || workingDays <= 0) {
      return 'Invalid number of working days';
    }
    return null;
  };

  const handleSubmit = () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    createMutation.mutate({
      leave_balance: leaveBalanceId,
      start_date: format(startDate!, 'yyyy-MM-dd'),
      end_date: format(endDate!, 'yyyy-MM-dd'),
      number_of_days: workingDays!,
      reason: reason.trim(),
    });
  };

  const handleClose = () => {
    setLeaveBalanceId('');
    setStartDate(null);
    setEndDate(null);
    setReason('');
    setWorkingDays(null);
    onOpenChange(false);
  };

  const selectedBalance = leaveBalances.find((lb) => lb.public_id === leaveBalanceId);
  const selectedAvailableBalance = selectedBalance
    ? ((selectedBalance as unknown as { available_balance?: number; available?: number })
        .available_balance ??
      (selectedBalance as unknown as { available?: number }).available ??
      0)
    : 0;
  const selectedUsedBalance = selectedBalance
    ? ((selectedBalance as unknown as { used_balance?: number; used?: number }).used_balance ??
      (selectedBalance as unknown as { used?: number }).used ??
      0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto border-2 border-gray-300 bg-white shadow-2xl sm:max-w-[600px]">
        <DialogHeader className="space-y-3 border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900">Apply for Leave</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Submit a leave application for your timesheet. Approved leaves will be automatically
            marked in your attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-6">
          {/* Leave Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="leave-type" className="text-base font-semibold text-gray-900">
              Leave Type *
            </Label>
            {loadingBalances ? (
              <div className="flex items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Loading leave types...</span>
              </div>
            ) : leaveBalances.length === 0 ? (
              <Alert className="border-2 border-orange-400 bg-orange-50">
                <AlertDescription className="text-base font-semibold text-orange-900">
                  ⚠ No leave balances available. Please contact your administrator to set up your
                  leave allocations.
                </AlertDescription>
              </Alert>
            ) : (
              <SearchableSelect
                options={leaveBalances.map((balance) => ({
                  value: balance.public_id,
                  label: `${(balance as unknown as { leave_type_name?: string; leave_name?: string }).leave_type_name || (balance as unknown as { leave_name?: string }).leave_name || 'Leave'} - Available: ${
                    (balance as unknown as { available_balance?: number; available?: number })
                      .available_balance ??
                    (balance as unknown as { available?: number }).available ??
                    0
                  } days`,
                }))}
                value={leaveBalanceId}
                onValueChange={setLeaveBalanceId}
                placeholder="Select leave type"
                searchPlaceholder="Search leave types..."
                className="h-12 border-2 border-gray-300 text-base focus:border-blue-500"
              />
            )}
          </div>

          {/* Selected Balance Info */}
          {selectedBalance && (
            <Alert className="border-2 border-blue-400 bg-blue-50">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-blue-900">
                      Available Balance:
                    </span>
                    <span className="text-xl font-bold text-blue-900">
                      {selectedAvailableBalance} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">Used:</span>
                    <span className="text-lg font-semibold text-blue-800">
                      {selectedUsedBalance} days
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <Label htmlFor="start-date" className="text-base font-semibold text-gray-900">
                Start Date *
              </Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                minDate={new Date()}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="end-date" className="text-base font-semibold text-gray-900">
                End Date *
              </Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                minDate={startDate || new Date()}
                placeholder="Select end date"
              />
            </div>
          </div>

          {/* Timesheet Conflict Alerts */}
          {timesheetConflict.status === 'all_blocked' && (
            <Alert className="border-2 border-red-400 bg-red-50">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-sm font-medium text-red-900">
                <strong>Cannot apply leave:</strong> All the selected dates fall within a timesheet
                that has already been submitted or approved. You cannot apply for leave on dates
                with a submitted/approved timesheet.
                <div className="mt-2 text-xs text-red-700">
                  Blocked dates:{' '}
                  {timesheetConflict.blockedDates
                    .map((d) => format(parseISO(d), 'MMM dd'))
                    .join(', ')}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {timesheetConflict.status === 'partial' && (
            <Alert className="border-2 border-amber-400 bg-amber-50">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <AlertDescription className="text-sm font-medium text-amber-900">
                <strong>Some dates are blocked:</strong> {timesheetConflict.blockedDates.length} of
                your selected dates fall within a submitted/approved timesheet and cannot be
                included in a leave request. Please adjust your leave dates to exclude them.
                <div className="mt-2 text-xs text-amber-800">
                  Blocked dates:{' '}
                  {timesheetConflict.blockedDates
                    .map((d) => format(parseISO(d), 'MMM dd'))
                    .join(', ')}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Working Days Display */}
          {calculatingDays ? (
            <Alert className="border-2 border-gray-400 bg-gray-50">
              <div className="flex items-center">
                <Loader2 className="mr-3 h-5 w-5 animate-spin text-blue-600" />
                <AlertDescription className="text-base font-medium text-gray-700">
                  Calculating working days...
                </AlertDescription>
              </div>
            </Alert>
          ) : workingDays !== null && workingDays > 0 ? (
            <Alert
              className={
                selectedBalance && workingDays > selectedAvailableBalance
                  ? 'border-2 border-red-400 bg-red-50'
                  : 'border-2 border-green-400 bg-green-50'
              }
            >
              <div className="flex items-start">
                <CalendarDays className="mt-1 mr-3 h-6 w-6 text-green-700" />
                <AlertDescription className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-green-900">Working Days:</span>
                    <span className="text-2xl font-bold text-green-900">{workingDays} days</span>
                  </div>
                  {selectedBalance && workingDays > selectedAvailableBalance && (
                    <div className="mt-3 rounded border border-red-300 bg-red-100 p-3 text-base font-semibold text-red-800">
                      ⚠ Insufficient balance! You only have {selectedAvailableBalance} days
                      available.
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          ) : null}

          {/* Reason */}
          <div className="space-y-3">
            <Label htmlFor="reason" className="text-base font-semibold text-gray-900">
              Reason *
            </Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for your leave request"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none border-2 border-gray-300 text-base focus:border-blue-500"
            />
            <div className="text-right text-sm font-medium text-gray-600">
              {reason.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 border-t pt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="h-12 border-2 px-8 text-base font-semibold"
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="h-12 bg-blue-600 px-8 text-base font-bold shadow-lg hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={
              createMutation.isPending ||
              !leaveBalanceId ||
              !startDate ||
              !endDate ||
              !reason.trim() ||
              workingDays === null ||
              workingDays <= 0 ||
              timesheetConflict.status !== 'none' ||
              (selectedBalance && workingDays > selectedAvailableBalance)
            }
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting Application...
              </>
            ) : (
              'Submit Leave Application'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
