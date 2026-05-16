/**
 * Leave Allocation Form Component
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ErrorMessages, FormPlaceholders, SuccessMessages } from '@/constants';
import { leaveApi, type LeaveAllocationPayload } from '@/lib/api/leave-api';
import { getCurrentAcademicYear } from '@/lib/api/organization-api';
import {
  createLeaveAllocationSchema,
  type LeaveAllocationFormValues,
} from '../schemas/leave-allocation-schema';
import {
  formatDateForApi,
  getDefaultFormValues,
  getFormValuesFromAllocation,
  validateCarryForward,
} from '../utils/leave-allocation-helpers';
import { setFormFieldErrors, parseApiError } from '@/lib/utils/error-handler';
// import { cn } from '@/lib/utils';

interface LeaveAllocationFormProps {
  mode?: 'create' | 'edit' | 'view';
  allocationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeaveAllocationForm({
  mode = 'create',
  allocationId,
  onSuccess,
  onCancel,
}: LeaveAllocationFormProps) {
  const queryClient = useQueryClient();
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // Fetch leave types from backend
  const {
    data: leaveTypes,
    isLoading: loadingLeaveTypes,
    error: leaveTypesError,
    refetch: refetchLeaveTypes,
  } = useQuery({
    queryKey: ['leave-types'],
    queryFn: leaveApi.getLeaveTypes,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  // Fetch organization roles from backend
  const {
    data: organizationRoles,
    isLoading: loadingRoles,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['organization-roles'],
    queryFn: leaveApi.getOrganizationRoles,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  // Fetch current academic year from backend (optional - graceful fallback)
  const { data: academicYearData, isLoading: loadingAcademicYear } = useQuery({
    queryKey: ['academic-year'],
    queryFn: getCurrentAcademicYear,
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    retry: 0, // Don't retry if endpoint doesn't exist
    enabled: mode === 'create', // Only fetch for create mode
  });

  // Fetch existing allocation for edit/view mode
  const {
    data: existingAllocation,
    isLoading: loadingAllocation,
    error: allocationError,
  } = useQuery({
    queryKey: ['leave-allocation', allocationId],
    queryFn: () => leaveApi.getAllocation(allocationId!),
    enabled: (isEditMode || isViewMode) && !!allocationId,
    retry: 2,
  });

  // Initialize form
  const form = useForm<LeaveAllocationFormValues>({
    resolver: zodResolver(createLeaveAllocationSchema(mode)),
    defaultValues: getDefaultFormValues(),
    mode: 'onChange',
  });

  // Reset form when data loads
  useEffect(() => {
    if (existingAllocation && organizationRoles && leaveTypes) {
      const formValues = getFormValuesFromAllocation(existingAllocation, organizationRoles);
      form.reset(formValues);
    }
  }, [existingAllocation, organizationRoles, leaveTypes, form]);

  // Auto-populate effective dates from academic year for create mode
  useEffect(() => {
    if (mode === 'create' && academicYearData?.data) {
      const { start_date, end_date } = academicYearData.data;
      const currentEffectiveFrom = form.getValues('effective_from');

      // Only auto-populate if user hasn't manually set dates yet
      if (!currentEffectiveFrom) {
        form.setValue('effective_from', new Date(start_date));
        form.setValue('effective_to', new Date(end_date));
      }
    }
  }, [academicYearData, mode, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: LeaveAllocationPayload) => leaveApi.createAllocation(data),
    onSuccess: (data) => {
      toast.success(SuccessMessages.CREATE_SUCCESS, {
        description: `${data.leave_type_name} policy has been created`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      queryClient.invalidateQueries({ queryKey: ['leave-allocations'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const { hasFieldError, nonFieldErrors } = setFormFieldErrors(error, form.setError);

      // Check for non-field errors first (like duplicate allocation)
      if (nonFieldErrors.length > 0) {
        toast.error(ErrorMessages.CREATE_FAILED, {
          description: nonFieldErrors[0],
          icon: <AlertCircle className="h-4 w-4" />,
          duration: 6000,
        });
      } else if (hasFieldError) {
        // For field-specific errors, show a brief info toast since error is already on the field
        toast.error(ErrorMessages.FORM.INVALID_INPUT, {
          description: 'Check the highlighted fields below for specific error details',
          icon: <AlertCircle className="h-4 w-4" />,
          duration: 4000,
        });
      } else {
        // Fallback to generic error
        const errorMessage = parseApiError(error, ErrorMessages.CREATE_FAILED);
        toast.error(ErrorMessages.CREATE_FAILED, {
          description: errorMessage,
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveAllocationPayload> }) =>
      leaveApi.updateAllocation(id, data),
    onSuccess: (data) => {
      toast.success(SuccessMessages.UPDATE_SUCCESS, {
        description: `${data.leave_type_name} policy has been updated`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      queryClient.invalidateQueries({ queryKey: ['leave-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['leave-allocation', allocationId] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const { hasFieldError, nonFieldErrors } = setFormFieldErrors(error, form.setError);

      // Check for non-field errors first
      if (nonFieldErrors.length > 0) {
        toast.error(ErrorMessages.UPDATE_FAILED, {
          description: nonFieldErrors[0],
          icon: <AlertCircle className="h-4 w-4" />,
          duration: 6000,
        });
      } else if (hasFieldError) {
        // For field-specific errors, show a brief info toast since error is already on the field
        toast.error(ErrorMessages.FORM.INVALID_INPUT, {
          description: 'Check the highlighted fields below for specific error details',
          icon: <AlertCircle className="h-4 w-4" />,
          duration: 4000,
        });
      } else {
        const errorMessage = parseApiError(error, ErrorMessages.UPDATE_FAILED);
        toast.error(ErrorMessages.UPDATE_FAILED, {
          description: errorMessage,
          icon: <AlertCircle className="h-4 w-4" />,
        });
      }
    },
  });

  // Form submission handler
  const onSubmit = (values: LeaveAllocationFormValues) => {
    // Validate carry forward
    const validation = validateCarryForward(values.total_days, values.max_carry_forward_days);
    if (!validation.valid) {
      form.setError('max_carry_forward_days', {
        type: 'manual',
        message: validation.message,
      });
      return;
    }

    const payload: LeaveAllocationPayload = {
      leave_type: values.leave_type!,
      name: values.name || '',
      description: values.description || '',
      total_days: values.total_days,
      max_carry_forward_days: values.max_carry_forward_days,
      applies_to_all_roles: values.applies_to_all_roles,
      roles: values.applies_to_all_roles ? [] : values.roles,
      effective_from: formatDateForApi(values.effective_from),
      effective_to: values.effective_to ? formatDateForApi(values.effective_to) : undefined,
    };

    if (isEditMode && allocationId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { leave_type, ...updatePayload } = payload;
      updateMutation.mutate({ id: allocationId, data: updatePayload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Loading state
  if (
    loadingLeaveTypes ||
    loadingRoles ||
    loadingAcademicYear ||
    (allocationId && loadingAllocation)
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-4 text-center">
          <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">Loading form data...</p>
        </div>
      </div>
    );
  }

  // Error state - Failed to load leave types or roles
  if (leaveTypesError || rolesError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load form data</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              {leaveTypesError
                ? 'Unable to fetch leave types from the backend.'
                : 'Unable to fetch organization roles from the backend.'}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  refetchLeaveTypes();
                  refetchRoles();
                }}
              >
                Try Again
              </Button>
              {onCancel && (
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  Go Back
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state - Failed to load existing allocation
  if (allocationError && (isEditMode || isViewMode)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load allocation</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Unable to fetch the leave allocation details from the backend.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCancel}>
                Go Back
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state - No leave types available
  if (!leaveTypes || leaveTypes.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Leave Types Available</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              No leave types are configured in the system. Please contact your administrator to set
              up leave types first.
            </p>
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                Go Back
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state - No organization roles available
  if (!organizationRoles || organizationRoles.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Organization Roles Available</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              No organization roles are configured in the system. Please contact your administrator
              to set up roles first.
            </p>
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                Go Back
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const applies_to_all_roles = form.watch('applies_to_all_roles');
  const selectedLeaveType = leaveTypes?.find((type) => type.id === form.watch('leave_type'));
  const selectedRoles =
    organizationRoles?.filter((role) => form.watch('roles').includes(role.id)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' && 'Create Leave Allocation Policy'}
            {mode === 'edit' && 'Edit Leave Allocation Policy'}
            {mode === 'view' && 'Leave Allocation Policy Details'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'create' && 'Define leave entitlements for your organization'}
            {mode === 'edit' && 'Update the leave allocation policy settings'}
            {mode === 'view' && 'Review the leave allocation policy'}
          </p>
        </div>
        {isViewMode && (
          <Button variant="brandOutline" onClick={onCancel}>
            Close
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <fieldset disabled={isViewMode}>
            {/* Two Column Layout: 3 Cards on Left + Summary on Right */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* LEFT COLUMN - 3 Cards Stacked */}
              <div className="space-y-6 lg:col-span-2">
                {/* Card 1: Policy Type */}
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-blue-900">
                      Policy Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Leave Type Selection */}
                    <FormField
                      control={form.control}
                      name="leave_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Policy Type</FormLabel>
                          <Select
                            key={field.value}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                            disabled={isEditMode || isViewMode}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder={FormPlaceholders.SELECT_LEAVE_TYPE} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {leaveTypes?.map((type) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Policy Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Policy Name (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={FormPlaceholders.LEAVE_POLICY_NAME_EXAMPLE}
                              className="bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Policy Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Description (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={FormPlaceholders.LEAVE_POLICY_DETAILS}
                              className="resize-none bg-white"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Card 2: Allowance Rules */}
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-green-900">
                      Allowance Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Number of Days */}
                      <FormField
                        control={form.control}
                        name="total_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Number of Days</FormLabel>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 bg-white"
                                onClick={() => {
                                  const currentValue = parseFloat(field.value || '0');
                                  if (currentValue > 0) {
                                    field.onChange((currentValue - 1).toString());
                                  }
                                }}
                              >
                                -
                              </Button>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  max="365"
                                  className="bg-white text-center text-lg font-semibold"
                                  {...field}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 bg-white"
                                onClick={() => {
                                  const currentValue = parseFloat(field.value || '0');
                                  field.onChange((currentValue + 1).toString());
                                }}
                              >
                                +
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Carry Forward with Input */}
                      <FormField
                        control={form.control}
                        name="max_carry_forward_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Carry Forward</FormLabel>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="allow-carry-forward"
                                  checked={field.value !== '0'}
                                  onCheckedChange={(checked) => {
                                    if (!checked) {
                                      field.onChange('0');
                                    } else {
                                      field.onChange('5');
                                    }
                                  }}
                                  className="bg-white"
                                />
                                <FormLabel
                                  htmlFor="allow-carry-forward"
                                  className="cursor-pointer text-sm font-medium"
                                >
                                  Allow Carry Forward
                                </FormLabel>
                              </div>

                              {/* Carry Forward Days Input - Shows when enabled */}
                              {field.value !== '0' && (
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    placeholder={FormPlaceholders.MAX_CARRY_FORWARD_DAYS}
                                    className="bg-white"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                    }}
                                  />
                                </FormControl>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Target Roles */}
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-purple-900">
                      Target Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Applies to All Roles */}
                    <FormField
                      control={form.control}
                      name="applies_to_all_roles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Apply Policy To</FormLabel>
                          <Select
                            key={field.value ? 'all' : 'specific'}
                            onValueChange={(value) => field.onChange(value === 'all')}
                            defaultValue={field.value ? 'all' : 'specific'}
                            disabled={isViewMode}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="all">All Roles</SelectItem>
                              <SelectItem value="specific">Specific Roles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Role Selection in 2 Columns */}
                    {!applies_to_all_roles && (
                      <FormField
                        control={form.control}
                        name="roles"
                        render={() => (
                          <FormItem>
                            <FormLabel className="mb-2 block text-sm font-medium">
                              Select Roles
                            </FormLabel>
                            <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-white p-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {organizationRoles?.map((role) => (
                                  <FormField
                                    key={role.id}
                                    control={form.control}
                                    name="roles"
                                    render={({ field }) => (
                                      <FormItem
                                        key={role.id}
                                        className="flex flex-row items-center space-y-0 space-x-2 rounded-lg border border-transparent p-2 transition-colors hover:border-purple-200 hover:bg-purple-50/50"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(role.id)}
                                            onCheckedChange={(checked) => {
                                              const updatedRoles = checked
                                                ? [...field.value, role.id]
                                                : field.value?.filter((value) => value !== role.id);
                                              field.onChange(updatedRoles);
                                            }}
                                          />
                                        </FormControl>
                                        <div className="flex min-w-0 flex-1 items-center gap-2">
                                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-semibold text-white">
                                            {role.name.charAt(0)}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <FormLabel className="block cursor-pointer truncate text-sm font-medium">
                                              {role.name}
                                            </FormLabel>
                                          </div>
                                        </div>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Card 4: Effective Period */}
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-orange-900">
                      Effective Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Effective From Date */}
                      <FormField
                        control={form.control}
                        name="effective_from"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-medium">From Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder={FormPlaceholders.PICK_A_DATE}
                                minDate={new Date('1900-01-01')}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Effective To Date */}
                      <FormField
                        control={form.control}
                        name="effective_to"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-medium">To Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder={FormPlaceholders.PICK_A_DATE}
                                minDate={form.watch('effective_from') || new Date('1900-01-01')}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Academic Year Info */}
                    {academicYearData?.data && mode === 'create' && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">
                          <strong>Academic Year:</strong> {academicYearData.data.name}
                          <br />
                          Dates automatically filled from current academic year
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN - Policy Summary (Sticky) */}
              <div className="lg:col-span-1">
                <Card className="sticky top-6 border-teal-200 bg-gradient-to-br from-teal-50 to-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-teal-900">
                      Policy Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedLeaveType ? (
                      <div className="space-y-3">
                        {/* Policy Type */}
                        <div className="flex items-center justify-between rounded-lg bg-white/60 p-2">
                          <span className="text-sm text-gray-600">Policy Type</span>
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>

                        {/* Leave Type Display */}
                        <div className="rounded-lg bg-white p-3">
                          <p className="mb-1 text-xs text-gray-500">Selected Leave Type</p>
                          <p className="font-semibold text-gray-900">{selectedLeaveType.name}</p>
                        </div>

                        {/* Total Days */}
                        {form.watch('total_days') && parseFloat(form.watch('total_days')) > 0 && (
                          <div className="rounded-lg bg-white p-3">
                            <p className="mb-1 text-xs text-gray-500">Total Days</p>
                            <p className="text-2xl font-bold text-green-600">
                              {form.watch('total_days')}
                            </p>
                          </div>
                        )}

                        {/* Carry Forward */}
                        {parseFloat(form.watch('max_carry_forward_days') || '0') > 0 && (
                          <div className="rounded-lg bg-white p-3">
                            <p className="mb-1 text-xs text-gray-500">Carry Forward Days</p>
                            <p className="text-xl font-bold text-blue-600">
                              {form.watch('max_carry_forward_days')}
                            </p>
                          </div>
                        )}

                        {/* Applicable To */}
                        {applies_to_all_roles ? (
                          <div className="rounded-lg bg-white p-3">
                            <p className="mb-1 text-xs text-gray-500">Applicable To</p>
                            <p className="font-semibold text-purple-600">All Roles</p>
                          </div>
                        ) : selectedRoles.length > 0 ? (
                          <div className="rounded-lg bg-white p-3">
                            <p className="mb-2 text-xs text-gray-500">
                              Selected Roles ({selectedRoles.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedRoles.map((role) => (
                                <div
                                  key={role.id}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700"
                                >
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-[10px] font-semibold text-white">
                                    {role.name.charAt(0)}
                                  </div>
                                  <span className="max-w-[120px] truncate">{role.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-lg bg-white/60 p-3">
                            <p className="text-xs text-gray-400">No roles selected</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No leave type selected</AlertTitle>
                        <AlertDescription>
                          Select a leave type to see the policy summary
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Form Actions - Inside Policy Summary */}
                    {!isViewMode && (
                      <div className="flex flex-col gap-3 border-t border-teal-200 pt-4">
                        <Button
                          type="submit"
                          size="lg"
                          variant="brand"
                          className="w-full font-semibold shadow-md transition-all hover:shadow-lg"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {(createMutation.isPending || updateMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {isEditMode ? 'Update Policy' : 'Create Policy'}
                        </Button>
                        <Button
                          type="button"
                          variant="brandOutline"
                          size="lg"
                          className="w-full border-2 font-semibold hover:bg-gray-100"
                          onClick={onCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
