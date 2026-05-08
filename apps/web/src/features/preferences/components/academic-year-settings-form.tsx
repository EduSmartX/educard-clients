import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from 'sonner';
import {
  getCurrentAcademicYear,
  updateAcademicYear,
  type UpdateAcademicYearPayload,
} from '@/lib/api/academic-year-api';
import { CommonUiText, ErrorMessages, FormPlaceholders, SuccessMessages, ToastTitles } from '@/constants';

const academicYearSchema = z
  .object({
    name: z.string().min(1, 'Academic year name is required'),
    start_date: z.date({
      required_error: 'Start date is required',
    }),
    end_date: z.date({
      required_error: 'End date is required',
    }),
    is_current: z.boolean().default(true),
  })
  .refine(
    (data) => {
      return data.end_date > data.start_date;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

type AcademicYearFormValues = z.infer<typeof academicYearSchema>;

export function AcademicYearSettingsForm() {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch current academic year
  const {
    data: academicYear,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['current-academic-year'],
    queryFn: getCurrentAcademicYear,
    retry: 1,
  });

  // Initialize form
  const form = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: '',
      start_date: new Date(),
      end_date: new Date(),
      is_current: true,
    },
  });

  // Set initial values when data loads
  useEffect(() => {
    if (academicYear) {
      form.reset({
        name: academicYear.name,
        start_date: new Date(academicYear.start_date),
        end_date: new Date(academicYear.end_date),
        is_current: academicYear.is_current,
      });
    }
  }, [academicYear, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateAcademicYearPayload) => {
      return updateAcademicYear(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-academic-year'] });
      form.reset(form.getValues()); // Reset form dirty state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      toast.success(ToastTitles.SUCCESS, {
        description: SuccessMessages.PREFERENCES.ACADEMIC_YEAR_UPDATED,
      });
    },
    onError: (error: Error) => {
      toast.error(ToastTitles.ERROR, {
        description: error?.message || ErrorMessages.UPDATE_FAILED,
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: AcademicYearFormValues) => {
    const payload: UpdateAcademicYearPayload = {
      name: data.name,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date.toISOString().split('T')[0],
      is_current: data.is_current,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Loading academic year...</span>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">Failed to load academic year settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
      <CardHeader className="border-b bg-gray-50 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Academic Year</CardTitle>
            </div>
          </div>
          {showSuccess && (
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-green-700 border border-green-200">
              <span className="text-sm font-medium">✓ Settings updated</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Academic Year Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={FormPlaceholders.ACADEMIC_YEAR_EXAMPLE} className="h-11" />
                  </FormControl>
                  <FormDescription className="text-sm text-gray-600">
                    Enter the name or label for the academic year (e.g., 2025-26)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      Start Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={FormPlaceholders.SELECT_START_DATE}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-600">
                      The first day of the academic year
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>
                      End Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={FormPlaceholders.SELECT_END_DATE}
                        minDate={form.watch('start_date')}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-600">
                      The last day of the academic year
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The academic year defines the period for attendance tracking,
                leave management, and academic activities. Changes will affect all date-based
                features throughout the system.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="brand"
                disabled={!form.formState.isDirty || updateMutation.isPending}
                className="gap-2 h-11 px-6"
              >
                {updateMutation.isPending ? (
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
