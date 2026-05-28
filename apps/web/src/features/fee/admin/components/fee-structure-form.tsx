/**
 * Fee Structure Form Component
 * Form for creating and editing fee structures
 */

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, IndianRupee } from 'lucide-react';
import { FeeComponentsEditor } from '../../components/fee-components-editor';
import { DatePicker } from '@/components/ui/date-picker';
import { ClassesMultiSelectField } from '@/components/form/classes-multi-select-field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  type FeeStructure,
  type FeeStructureCreatePayload,
  type FeeComponent,
  type ComponentType,
  FEE_UI_TEXT,
} from '@educard/shared';
import { applyFieldErrors } from '@/lib/utils/error-handler';

// Form validation schema
const feeStructureSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().optional(),
  total_amount: z.coerce.number().min(0.01, 'Add at least one fee component'),
  due_date: z.string().min(1, 'Due date is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  class_public_ids: z.array(z.string()).min(1, 'Select at least one class'),
  components: z.record(z.number().min(0)).optional(),
  is_active: z.boolean().default(true),
});

type FeeStructureFormValues = z.infer<typeof feeStructureSchema>;

interface FeeStructureFormProps {
  initialData?: FeeStructure;
  onSubmit: (data: FeeStructureCreatePayload) => void;
  isLoading?: boolean;
  classes: Array<{ public_id: string; name: string }>;
  academicYears: string[];
  defaultAcademicYear?: string;
  apiError?: unknown;
}

export function FeeStructureForm({
  initialData,
  onSubmit,
  isLoading,
  classes,
  academicYears,
  defaultAcademicYear,
  apiError,
}: FeeStructureFormProps) {
  const isEditing = !!initialData;

  // Transform components from array to object format for editing
  const transformedComponents = React.useMemo(() => {
    if (!initialData?.components) {
      return {};
    }

    // If components is already an object, return as is
    if (!Array.isArray(initialData.components)) {
      return initialData.components as FeeComponent;
    }

    // If components is an array, transform to object { name: amount }
    const componentsObj: FeeComponent = {};
    initialData.components.forEach(
      (comp: { name: string; amount: string | number; component_type?: ComponentType }) => {
        componentsObj[comp.name] = Number.parseFloat(String(comp.amount));
      }
    );
    return componentsObj;
  }, [initialData?.components]);

  // Extract component types from initial data
  const initialComponentTypes = React.useMemo(() => {
    if (!initialData?.components || !Array.isArray(initialData.components)) {
      return {};
    }

    const types: Record<string, ComponentType> = {};
    initialData.components.forEach((comp: { name: string; component_type?: ComponentType }) => {
      types[comp.name] = comp.component_type || 'mandatory';
    });
    return types;
  }, [initialData?.components]);

  const [componentTypes, setComponentTypes] =
    useState<Record<string, ComponentType>>(initialComponentTypes);

  const form = useForm<FeeStructureFormValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      total_amount: Number.parseFloat(String(initialData?.total_amount ?? 0)),
      due_date: initialData?.due_date ?? '',
      academic_year: initialData?.academic_year ?? defaultAcademicYear ?? '',
      class_public_ids: initialData?.class_public_ids ?? [],
      components: transformedComponents,
      is_active: initialData?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (!isEditing && defaultAcademicYear && !form.getValues('academic_year')) {
      form.setValue('academic_year', defaultAcademicYear, { shouldValidate: true });
    }
  }, [defaultAcademicYear, isEditing, form]);

  // Apply backend field errors inline whenever the mutation fails
  useEffect(() => {
    if (apiError) {
      applyFieldErrors(apiError, form.setError);
    }
  }, [apiError, form.setError]);

  const handleSubmit = (values: FeeStructureFormValues) => {
    // Transform components from dict { name: amount } to list [{ name, amount, component_type }]
    const componentsDict = values.components ?? {};
    const componentsList = Object.entries(componentsDict).map(([name, amount], index) => ({
      name,
      amount,
      component_type: componentTypes[name] || ('mandatory' as const),
      order: index,
    }));

    const payload: FeeStructureCreatePayload = {
      name: values.name,
      description: values.description,
      total_amount: values.total_amount,
      due_date: values.due_date,
      academic_year: values.academic_year,
      class_public_ids: values.class_public_ids,
      components: componentsList,
      is_active: values.is_active,
    };
    onSubmit(payload);
  };

  // Auto-calculate total amount from components
  const componentsValue = form.watch('components');
  const calculatedTotal = Object.values(componentsValue ?? {}).reduce(
    (sum: number, amt: number) => sum + (amt || 0),
    0
  );

  // Sync total_amount whenever components change
  React.useEffect(() => {
    if (calculatedTotal > 0) {
      form.setValue('total_amount', calculatedTotal);
    }
  }, [calculatedTotal, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Active Status - Issue #6: Keep on top */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="py-4">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-semibold">Active Status</FormLabel>
                    <FormDescription>
                      When disabled, this fee structure won&apos;t be applied to new students
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Main Form Card */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-lg text-gray-800">
              {isEditing ? FEE_UI_TEXT.FORM.EDIT_STRUCTURE : FEE_UI_TEXT.FORM.CREATE_STRUCTURE}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">{FEE_UI_TEXT.LABELS.NAME}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Term 1 Fee, Annual Fee"
                      className="border-gray-300 bg-gray-50 focus:bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">{FEE_UI_TEXT.LABELS.DESCRIPTION}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description of this fee structure"
                      className="resize-none border-gray-300 bg-gray-50 focus:bg-white"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Total Amount - Auto-calculated from components */}
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">{FEE_UI_TEXT.LABELS.TOTAL_AMOUNT}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IndianRupee className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          className="border-gray-300 bg-gray-100 pl-9 font-semibold"
                          readOnly
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Auto-calculated from fee components below
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date - Issue #9: Use reusable DatePicker */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">{FEE_UI_TEXT.LABELS.DUE_DATE}</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : null}
                        onChange={(date) => {
                          if (date) {
                            const formatted = date.toISOString().split('T')[0];
                            field.onChange(formatted);
                          } else {
                            field.onChange('');
                          }
                        }}
                        placeholder="Select due date"
                        minDate={new Date()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Academic Year - Searchable dropdown */}
              <FormField
                control={form.control}
                name="academic_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">
                      {FEE_UI_TEXT.LABELS.ACADEMIC_YEAR}
                    </FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={academicYears.map((year) => ({
                          value: year,
                          label: year === defaultAcademicYear ? `${year} (Active)` : year,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select academic year"
                        searchPlaceholder="Search academic year..."
                        className="border-gray-300 bg-gray-50 focus:bg-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Classes Multi-Select - Master class names with searchable component */}
              <ClassesMultiSelectField
                control={form.control}
                name="class_public_ids"
                label={FEE_UI_TEXT.LABELS.CLASSES}
                placeholder="Select classes"
                classes={classes}
                description="Only classes without an active fee structure are shown"
              />
            </div>
          </CardContent>
        </Card>

        {/* Fee Components Card - Issue #3: Single label only */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-gray-50">
            <CardTitle className="text-lg text-gray-800">Fee Components</CardTitle>
            <p className="text-muted-foreground text-sm">
              Break down the fee into components (optional). Total should match the fee amount.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="components"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FeeComponentsEditor
                      value={(field.value ?? {}) as FeeComponent}
                      onChange={field.onChange}
                      componentTypes={componentTypes}
                      onComponentTypesChange={setComponentTypes}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-2">
          <Button type="button" variant="outline" onClick={() => form.reset()} className="px-6">
            {FEE_UI_TEXT.BUTTONS.RESET}
          </Button>
          <Button type="submit" variant="success" disabled={isLoading} className="px-6">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? FEE_UI_TEXT.BUTTONS.UPDATE : FEE_UI_TEXT.BUTTONS.CREATE}
          </Button>
        </div>
      </form>
    </Form>
  );
}
