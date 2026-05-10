import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  SaturdayOffPattern,
  SaturdayOffPatternLabels,
  type SaturdayOffPatternType,
  CommonUiText,
  ErrorMessages,
  FormPlaceholders,
  SuccessMessages,
  ToastTitles,
} from '@/constants';
import {
  createWorkingDayPolicy,
  getCurrentWorkingDayPolicy,
  updateWorkingDayPolicy,
  type CreateWorkingDayPolicyPayload,
} from '@/lib/api/working-day-policy-api';
import {
  workingDayPolicySchema,
  type WorkingDayPolicyFormValues,
} from '../schemas/working-day-policy-schema';

export function WorkingDayPolicyForm() {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<WorkingDayPolicyFormValues>({
    resolver: zodResolver(workingDayPolicySchema),
    shouldFocusError: true,
    defaultValues: {
      sunday_off: true,
      saturday_off_pattern: SaturdayOffPattern.SECOND_ONLY,
      effective_from: new Date(),
      effective_to: null,
    },
  });

  // Fetch current policy
  const {
    data: policyData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['working-day-policy'],
    queryFn: getCurrentWorkingDayPolicy,
    retry: 1,
  });

  // Set initial values when data loads
  useEffect(() => {
    if (policyData) {
      // getCurrentWorkingDayPolicy returns WorkingDayPolicy | null
      form.reset({
        sunday_off: policyData.sunday_off,
        saturday_off_pattern: policyData.saturday_off_pattern,
        effective_from: policyData.effective_from
          ? new Date(policyData.effective_from)
          : new Date(),
        effective_to: policyData.effective_to ? new Date(policyData.effective_to) : null,
      });
    }
  }, [policyData, form]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (payload: CreateWorkingDayPolicyPayload) => {
      if (policyData) {
        return updateWorkingDayPolicy(policyData.public_id, payload);
      } else {
        return createWorkingDayPolicy(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-day-policy'] });
      queryClient.invalidateQueries({ queryKey: ['holiday-calendar'] });
      form.reset(form.getValues()); // Reset form dirty state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success(ToastTitles.SUCCESS, {
        description: SuccessMessages.PREFERENCES.WORKING_DAY_POLICY_UPDATED,
      });
    },
    onError: (error: Error) => {
      toast.error(ToastTitles.ERROR, {
        description: error?.message || ErrorMessages.UPDATE_FAILED,
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: WorkingDayPolicyFormValues) => {
    const payload: CreateWorkingDayPolicyPayload = {
      sunday_off: data.sunday_off,
      saturday_off_pattern: data.saturday_off_pattern as SaturdayOffPatternType,
      effective_from: data.effective_from.toISOString().split('T')[0],
      effective_to: data.effective_to ? data.effective_to.toISOString().split('T')[0] : null,
    };

    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading policy...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader className="border-b bg-gray-50 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <CardTitle className="text-lg">Working Day Policy</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load working day policy'}
            </AlertDescription>
          </Alert>
        )}

        {showSuccess && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">✓ Settings updated successfully</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sunday Off Toggle */}
            <FormField
              control={form.control}
              name="sunday_off"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-white shadow-sm">
                  <div className="space-y-1">
                    <FormLabel>Sunday Off</FormLabel>
                    <FormDescription>Mark all Sundays as holidays</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Saturday Off Pattern Select */}
            <FormField
              control={form.control}
              name="saturday_off_pattern"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4 bg-white shadow-sm">
                  <div className="space-y-3">
                    <FormLabel>Saturday Off Pattern</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={FormPlaceholders.SELECT_SATURDAY_PATTERN} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SaturdayOffPatternLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which Saturdays should be marked as holidays
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Effective Date Range */}
            <div className="rounded-lg border p-4 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-medium">Effective Period</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="effective_from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Effective From <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || null}
                          onChange={(date) => field.onChange(date || new Date())}
                          placeholder={FormPlaceholders.SELECT_START_DATE}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Effective To <span className="text-sm text-gray-500">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value || null}
                          onChange={(date) => field.onChange(date)}
                          placeholder={FormPlaceholders.SELECT_END_DATE}
                          minDate={form.watch('effective_from') || undefined}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changes to the working day policy will affect the holiday
                calendar. Weekends will be automatically marked as holidays based on this
                configuration.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="brand"
                disabled={!form.formState.isDirty || saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {CommonUiText.SAVING}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {CommonUiText.SAVE_CHANGES}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
