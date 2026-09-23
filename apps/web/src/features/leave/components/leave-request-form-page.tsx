/**
 * Leave Request Form Page
 * Handles create, edit, and view modes for leave requests
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Loader2,
  AlertCircle,
  Calendar,
  Paperclip,
  X,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { ErrorMessages, FormPlaceholders, SuccessMessages, ToastTitles } from '@/constants';
import { getErrorMessage, applyFieldErrors } from '@/lib/utils/error-handler';
import { getMediaUrl } from '@/lib/utils/media-utils';
import {
  formatDate,
  formatLocalDate,
  parseLocalDate,
  validateDateRange,
} from '@/lib/utils/date-utils';
import {
  useLeaveRequest,
  useMyLeaveBalancesSummary,
  useCreateLeaveRequest,
  useUpdateLeaveRequest,
  useCalculateWorkingDays,
} from '../hooks';
import { leaveRequestFormSchema, type LeaveRequestFormData } from '../schemas';
import { LEAVE_STATUS_CONFIG, type WorkingDaysCalculation } from '../types';
import { getLeaveTypeName } from '../utils/leave-name-helper';

type PageMode = 'create' | 'edit' | 'view';

export function LeaveRequestFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [workingDaysInfo, setWorkingDaysInfo] = useState<WorkingDaysCalculation | null>(null);
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  const [conflictingLeaves, setConflictingLeaves] = useState<string[]>([]);

  const isInitialMount = useRef(true);
  const formPopulated = useRef(false);

  // Determine mode based on URL
  const getMode = (): PageMode => {
    if (!id) {
      return 'create';
    }
    if (location.pathname.endsWith('/edit')) {
      return 'edit';
    }
    return 'view';
  };

  const mode = getMode();

  // Fetch leave balances
  const { data: balancesData, isLoading: isLoadingBalances } = useMyLeaveBalancesSummary();

  // Fetch existing request if editing or viewing
  const {
    data: requestData,
    isLoading: isLoadingRequest,
    error: requestError,
    isError: isRequestError,
  } = useLeaveRequest(id, false);

  const balances = balancesData?.data || [];
  const request = requestData?.data;

  // Redirect to dashboard if request not found (404) or unauthorized
  useEffect(() => {
    if (isRequestError && id && (mode === 'edit' || mode === 'view')) {
      const error = requestError as { response?: { status?: number } };
      const status = error?.response?.status;

      if (status === 404 || status === 403) {
        toast.error(
          status === 404
            ? 'Leave request not found'
            : 'You are not authorized to view this leave request'
        );
        navigate('/leave/dashboard', { replace: true });
      }
    }
  }, [isRequestError, requestError, id, mode, navigate]);

  // Mutations
  const createMutation = useCreateLeaveRequest();
  const updateMutation = useUpdateLeaveRequest();
  const calculateMutation = useCalculateWorkingDays();

  // Form
  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestFormSchema),
    defaultValues: {
      leave_balance: '',
      start_date: '',
      end_date: '',
      number_of_days: 1,
      reason: '',
      attachment: null,
      remove_attachment: false,
    },
  });

  // Populate form for edit/view mode
  useEffect(() => {
    if (request && (mode === 'edit' || mode === 'view') && !formPopulated.current) {
      form.reset(
        {
          leave_balance: request.leave_balance_public_id,
          start_date: request.start_date,
          end_date: request.end_date,
          number_of_days: Number.parseFloat(request.number_of_days.toString()),
          reason: request.reason,
          attachment: null,
          remove_attachment: false,
        },
        { keepDefaultValues: false }
      );

      formPopulated.current = true;
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    }
  }, [request, mode, form]);

  // Auto-calculate working days
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  useEffect(() => {
    if (startDate && endDate) {
      // Skip in view mode
      if (mode === 'view') {
        return;
      }

      // Skip initial load in edit mode
      if (mode === 'edit' && isInitialMount.current) {
        return;
      }

      const dateError = validateDateRange(startDate, endDate, 'Start date', 'End date');
      if (dateError) {
        setDateRangeError(dateError);
        setWorkingDaysInfo(null);
        form.setValue('number_of_days', 0);
        return;
      }

      setDateRangeError(null);

      // Clear previous conflicting leaves before a fresh calculation
      setConflictingLeaves([]);

      calculateMutation.mutate(
        { start_date: startDate, end_date: endDate },
        {
          onSuccess: (response) => {
            const calculation = response.data;
            setWorkingDaysInfo(calculation);
            const days = calculation.working_days ?? calculation.leave_days ?? 0;
            form.setValue('number_of_days', days);
            // Clear any conflicts when calculation succeeds
            setConflictingLeaves([]);
          },
          onError: (error) => {
            const apiError = error as {
              response?: { data?: { data?: { conflicting_leaves?: string[] } } };
            };
            if (apiError?.response?.data?.data?.conflicting_leaves) {
              setConflictingLeaves(apiError.response.data.data.conflicting_leaves);
              setDateRangeError(null);
            } else {
              const errorMessage = getErrorMessage(error, 'Failed to calculate working days');
              setDateRangeError(errorMessage);
              setConflictingLeaves([]);
            }
            setWorkingDaysInfo(null);
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, mode]);

  const isHalfDay = form.watch('is_half_day');

  useEffect(() => {
    if (!workingDaysInfo) {
      return;
    }

    const base = workingDaysInfo.working_days ?? workingDaysInfo.leave_days ?? 0;
    const adjusted = Math.max(0, base - (isHalfDay ? 0.5 : 0));
    form.setValue('number_of_days', adjusted);
  }, [isHalfDay, workingDaysInfo, form]);

  const handleMutationError = (error: unknown, fallbackMessage: string) => {
    const result = applyFieldErrors(error, form.setError);

    const apiError = error as {
      response?: { data?: { data?: { conflicting_leaves?: string[] } } };
    };
    if (apiError?.response?.data?.data?.conflicting_leaves) {
      setConflictingLeaves(apiError.response.data.data.conflicting_leaves);
    }

    if (!result.hasFieldErrors) {
      const errorMessage = getErrorMessage(error, fallbackMessage);
      toast.error(ToastTitles.ERROR, { description: errorMessage });
    }
  };

  const onSubmit = (data: LeaveRequestFormData) => {
    // Clear any previous conflicts
    setConflictingLeaves([]);

    if (mode === 'create') {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success(SuccessMessages.LEAVE.REQUEST_SUBMITTED);
          navigate('/leave/dashboard');
        },
        onError: (error: unknown) => {
          handleMutationError(error, ErrorMessages.LEAVE.CREATE_REQUEST_FAILED);
        },
      });
    } else if (mode === 'edit') {
      updateMutation.mutate(
        {
          publicId: id!,
          data: {
            start_date: data.start_date,
            end_date: data.end_date,
            number_of_days: data.number_of_days,
            reason: data.reason,
            ...(data.attachment instanceof File ? { attachment: data.attachment } : {}),
            ...(data.remove_attachment ? { remove_attachment: true } : {}),
          },
        },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.LEAVE.REQUEST_UPDATED);
            navigate(`/leave/requests/${id}`);
          },
          onError: (error: unknown) => {
            handleMutationError(error, ErrorMessages.LEAVE.UPDATE_REQUEST_FAILED);
          },
        }
      );
    }
  };

  const handleBack = () => {
    navigate('/leave/dashboard');
  };

  const handleEdit = () => {
    navigate(`/leave/requests/${id}/edit`);
  };

  const isLoading = isLoadingBalances || (!!id && isLoadingRequest);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const titleByMode: Record<PageMode, string> = {
    create: 'Apply Leave',
    edit: 'Edit Leave Request',
    view: 'Leave Request Details',
  };
  const title = titleByMode[mode];

  const hasNoAllocatedBalances = mode === 'create' && balances.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title={title} icon={Briefcase}>
        {mode === 'view' && request?.status === 'pending' && (
          <Button onClick={handleEdit} variant="brandOutline">
            Edit
          </Button>
        )}
        <Button onClick={handleBack} variant="brandOutline">
          Back to Dashboard
        </Button>
      </PageHeader>

      {hasNoAllocatedBalances && (
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto max-w-2xl space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No Allocated Leave Balances</h3>
              <p className="text-muted-foreground text-sm">
                You don&apos;t have any allocated leave balances yet, so you cannot submit a leave
                request right now.
              </p>
              <p className="text-muted-foreground text-sm">
                Please contact your supervisor or administrator to allocate leave balances for your
                account.
              </p>
              <div className="pt-2">
                <Button onClick={handleBack} variant="brandOutline">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasNoAllocatedBalances && (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Leave Type */}
                <FormField
                  control={form.control}
                  name="leave_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type *</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          key={`${id}-${field.value}`}
                          options={balances.map((balance) => ({
                            value: balance.public_id,
                            label: `${getLeaveTypeName(balance)} (${balance.available} available)`,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={FormPlaceholders.SELECT_LEAVE_TYPE}
                          searchPlaceholder="Search leave types..."
                          disabled={mode === 'view'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date Range */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? parseLocalDate(field.value) : null}
                            onChange={(date) => {
                              field.onChange(date ? formatLocalDate(date) : '');
                            }}
                            disabled={mode === 'view'}
                            placeholder={FormPlaceholders.SELECT_START_DATE}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? parseLocalDate(field.value) : null}
                            onChange={(date) => {
                              field.onChange(date ? formatLocalDate(date) : '');
                            }}
                            disabled={mode === 'view'}
                            placeholder={FormPlaceholders.SELECT_END_DATE}
                            minDate={
                              form.watch('start_date')
                                ? parseLocalDate(form.watch('start_date'))
                                : undefined
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Date Range Error */}
                {dateRangeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{dateRangeError}</AlertDescription>
                  </Alert>
                )}

                {/* Conflicting Leaves Error */}
                {conflictingLeaves.length > 0 && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold">
                          You already have a pending or approved leave request that overlaps with
                          the selected dates.
                        </div>
                        <div className="mt-2 font-medium">Conflicting Leaves:</div>
                        <ul className="ml-2 list-inside list-disc space-y-1">
                          {conflictingLeaves.map((leave) => (
                            <li key={leave} className="text-sm text-red-800">
                              {leave}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Working Days Info */}
                {workingDaysInfo && !dateRangeError && (
                  <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Total Days:</span>
                            <span className="font-semibold text-gray-900">
                              {workingDaysInfo.total_days}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Weekends + Holidays:</span>
                            <span className="font-semibold text-gray-900">
                              {workingDaysInfo.holidays.length}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-blue-200 pt-2 text-sm">
                            <span className="font-semibold text-gray-900">Leave Days:</span>
                            <span className="text-base font-bold text-blue-700">
                              {workingDaysInfo.leave_days}
                            </span>
                          </div>
                        </div>

                        {/* Holidays & Non-Working Days Table */}
                        {workingDaysInfo.holidays.length > 0 && (
                          <div className="mt-4">
                            <h4 className="mb-2 text-sm font-semibold text-gray-900">
                              Holidays & Non-Working Days
                            </h4>
                            <div className="overflow-hidden rounded border border-gray-200 bg-white">
                              <table className="w-full text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                      Date
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                      Description
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">
                                      Type
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workingDaysInfo.holidays.map((holiday) => (
                                    <tr
                                      key={holiday.date}
                                      className="border-b border-gray-100 last:border-0"
                                    >
                                      <td className="px-3 py-2 text-gray-900">
                                        {formatDate(holiday.date)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-700">
                                        {holiday.description || holiday.name || 'N/A'}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span
                                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                            holiday.type === 'WEEKEND'
                                              ? 'bg-purple-100 text-purple-800'
                                              : 'bg-orange-100 text-orange-800'
                                          }`}
                                        >
                                          {holiday.type}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Half Day Checkbox */}
                        <FormField
                          control={form.control}
                          name="is_half_day"
                          render={({ field }) => (
                            <FormItem className="mt-3 flex items-center gap-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  disabled={mode === 'view'}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </FormControl>
                              <div className="space-y-0">
                                <FormLabel className="cursor-pointer text-sm font-medium">
                                  Half Day Leave
                                </FormLabel>
                                <p className="text-xs text-gray-500">
                                  Check this to reduce 0.5 days from the total
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Number of Days (Auto-filled from API) */}
                <FormField
                  control={form.control}
                  name="number_of_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Days *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          {...field}
                          value={field.value}
                          readOnly
                          disabled
                          className="bg-gray-100 font-semibold text-gray-900"
                        />
                      </FormControl>
                      <p className="mt-1 text-xs text-gray-500">
                        Automatically calculated based on dates and half-day selection
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={FormPlaceholders.ENTER_LEAVE_REASON}
                          rows={4}
                          disabled={mode === 'view'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Attachment */}
                {mode !== 'view' && (
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={({ field: { onChange, value, ...field } }) => {
                      const currentFile = value instanceof File ? value : null;
                      const existingAttachment =
                        request?.attachment_url && !form.watch('remove_attachment') && !currentFile
                          ? {
                              url: getMediaUrl(request.attachment_url),
                              name: request.attachment_name,
                            }
                          : null;

                      return (
                        <FormItem>
                          <FormLabel>
                            Supporting Document{' '}
                            <span className="text-muted-foreground font-normal">(Optional)</span>
                          </FormLabel>
                          <div className="space-y-2">
                            {/* Show selected file preview */}
                            {currentFile && (
                              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                                <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                                <span className="flex-1 truncate text-sm text-blue-800">
                                  {currentFile.name}
                                </span>
                                <span className="text-xs text-blue-600">
                                  {(currentFile.size / 1024).toFixed(0)} KB
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onChange(null)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}

                            {/* Show existing attachment (edit mode) */}
                            {!currentFile && existingAttachment && (
                              <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
                                <FileText className="h-4 w-4 shrink-0 text-green-600" />
                                <span className="flex-1 truncate text-sm text-green-800">
                                  {existingAttachment.name || 'Attached document'}
                                </span>
                                <a
                                  href={existingAttachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    form.setValue('remove_attachment', true);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}

                            {/* File input */}
                            {!currentFile && !existingAttachment && (
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <label className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
                                    <Paperclip className="h-4 w-4" />
                                    <span>Click to attach a supporting document</span>
                                    <input
                                      {...field}
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        onChange(file);
                                        // Reset remove_attachment when a new file is picked
                                        form.setValue('remove_attachment', false);
                                      }}
                                    />
                                  </label>
                                </div>
                              </FormControl>
                            )}
                          </div>
                          <FormDescription>PDF, JPEG, PNG, or WebP. Max 5 MB.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                {/* Attachment (View mode only) */}
                {mode === 'view' && request?.attachment_url && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Supporting Document</span>
                    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2">
                      <FileText className="h-4 w-4 shrink-0 text-green-600" />
                      <span className="flex-1 truncate text-sm text-green-800">
                        {request.attachment_name || 'Attached document'}
                      </span>
                      <a
                        href={getMediaUrl(request.attachment_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                      >
                        <Download className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  </div>
                )}

                {/* Status (View mode only) */}
                {mode === 'view' && request && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Status</span>
                    <div>
                      <Badge className={LEAVE_STATUS_CONFIG[request.status].className}>
                        {LEAVE_STATUS_CONFIG[request.status].label}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                {mode !== 'view' && (
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="brandOutline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="brand" disabled={isSubmitting} className="gap-2">
                      {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {mode === 'create' ? 'Submit Request' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
