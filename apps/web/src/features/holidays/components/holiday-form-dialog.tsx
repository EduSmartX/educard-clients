/**
 * Holiday Form Dialog Component
 * Unified dialog for creating and editing holidays
 */

import { useState, useEffect } from 'react';
import { Calendar, Loader2, Pencil, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Holiday, CreateHolidayPayload, HolidayType } from '../types';
import { getDefaultHolidayFormData } from '../utils/holiday-utils';
import { useCreateHoliday, useUpdateHoliday, type FieldErrors } from '../hooks';
import { HolidayFormFields } from './holiday-form-fields';

interface HolidayFormData {
  start_date: string;
  end_date: string;
  holiday_type: Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>;
  description: string;
}

interface HolidayFormDialogProps {
  mode: 'create' | 'edit';
  holiday?: Holiday | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultDate?: string;
  showTrigger?: boolean;
}

export function HolidayFormDialog({
  mode,
  holiday,
  open: controlledOpen,
  onOpenChange,
  defaultDate,
  showTrigger = false,
}: HolidayFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [formData, setFormData] = useState<HolidayFormData>(getDefaultHolidayFormData());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | undefined>();

  useEffect(() => {
    if (mode === 'edit' && holiday && open) {
      setFormData({
        start_date: holiday.start_date,
        end_date: holiday.end_date || '',
        holiday_type: holiday.holiday_type as Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>,
        description: holiday.description,
      });
      setFieldErrors(undefined);
    } else if (mode === 'create' && defaultDate && open) {
      setFormData({
        ...getDefaultHolidayFormData(),
        start_date: defaultDate,
      });
      setFieldErrors(undefined);
    } else if (mode === 'create' && open) {
      setFormData(getDefaultHolidayFormData());
      setFieldErrors(undefined);
    }
  }, [mode, holiday, defaultDate, open]);

  const createMutation = useCreateHoliday({
    onSuccess: () => {
      setOpen(false);
      setFormData(getDefaultHolidayFormData());
      setFieldErrors(undefined);
    },
    onError: (_error, errors) => {
      setFieldErrors(errors);
    },
  });

  const updateMutation = useUpdateHoliday({
    onSuccess: () => {
      setOpen(false);
      setFieldErrors(undefined);
    },
    onError: (_error, errors) => {
      setFieldErrors(errors);
    },
  });

  const updateField = (field: keyof CreateHolidayPayload, value: string | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'end_date' && value === '' ? { end_date: undefined } : {}),
    }));
  };

  const handleSubmit = () => {
    setFieldErrors(undefined);

    const payload: CreateHolidayPayload = {
      start_date: formData.start_date,
      end_date: formData.end_date || formData.start_date,
      holiday_type: formData.holiday_type,
      description: formData.description.trim(),
    };

    if (mode === 'create') {
      createMutation.mutate(payload);
    } else if (mode === 'edit' && holiday) {
      updateMutation.mutate({
        id: holiday.public_id,
        payload,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditMode = mode === 'edit';

  const config = {
    title: isEditMode ? 'Edit Holiday' : 'Add Holiday',
    description: isEditMode
      ? 'Update holiday information'
      : 'Create a new holiday for your organization',
    submitLabel: isEditMode ? 'Update Holiday' : 'Create Holiday',
    submitIcon: isEditMode ? Pencil : Calendar,
    headerGradient: isEditMode
      ? 'from-blue-600 via-indigo-600 to-blue-600'
      : 'from-emerald-600 via-teal-600 to-emerald-600',
    buttonGradient: isEditMode
      ? 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
      : 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    iconBg: isEditMode ? 'bg-blue-600' : 'bg-emerald-600',
  };

  const SubmitIcon = config.submitIcon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === 'create' && showTrigger && (
        <DialogTrigger asChild>
          <Button
            className={`gap-2 bg-gradient-to-r ${config.buttonGradient} shadow-lg hover:shadow-xl transition-all duration-200`}
          >
            <Calendar className="h-4 w-4" />
            Add Holiday
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-0 p-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div
          className={`sticky top-0 z-10 relative overflow-hidden bg-gradient-to-r ${config.headerGradient} px-6 py-8`}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>

          <DialogHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                <SubmitIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">{config.title}</DialogTitle>
                <DialogDescription className="text-blue-50 mt-1">
                  {config.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-6">
          {mode === 'create' && (
            <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`rounded-lg ${config.iconBg} p-2`}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900 mb-1">Quick Tip</h4>
                  <p className="text-sm text-emerald-700">
                    For adding multiple holidays at once, use the{' '}
                    <Badge
                      variant="secondary"
                      className="inline-flex items-center gap-1 bg-emerald-600 text-white"
                    >
                      <Upload className="h-3 w-3" />
                      Bulk Upload
                    </Badge>{' '}
                    feature with an Excel file.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <HolidayFormFields
                startDate={formData.start_date}
                endDate={formData.end_date || ''}
                holidayType={formData.holiday_type}
                description={formData.description}
                onStartDateChange={(value) => updateField('start_date', value)}
                onEndDateChange={(value) => updateField('end_date', value)}
                onHolidayTypeChange={(value) => updateField('holiday_type', value)}
                onDescriptionChange={(value) => updateField('description', value)}
                errors={fieldErrors}
              />
            </CardContent>
          </Card>
        </div>

        <div className="sticky bottom-0 z-10 border-t bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-gray-300 hover:bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`bg-gradient-to-r ${config.buttonGradient} shadow-lg hover:shadow-xl transition-all duration-200 min-w-[160px]`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <SubmitIcon className="mr-2 h-4 w-4" />
                  {config.submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
