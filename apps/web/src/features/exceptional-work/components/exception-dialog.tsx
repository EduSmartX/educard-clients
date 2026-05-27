/**
 * Add/Edit Calendar Exception Dialog
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { fetchClasses } from '@/features/classes/api/classes-api';
import { useCreateCalendarException, useUpdateCalendarException } from '../hooks';
import type { CalendarException, CalendarExceptionCreate, OverrideType } from '../types';
import { ExceptionFormContent } from './exception-form-content';

/** Focus on the first field with an error */
function focusFirstErrorField(
  fieldErrors: Record<string, string>,
  dateContainerRef: React.RefObject<HTMLDivElement | null>,
  reasonInputRef: React.RefObject<HTMLTextAreaElement | null>
) {
  if (Object.keys(fieldErrors).length === 0) {
    return;
  }
  setTimeout(() => {
    if (fieldErrors.date && dateContainerRef.current) {
      dateContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const button = dateContainerRef.current.querySelector('button');
      button?.focus();
    } else if (fieldErrors.reason && reasonInputRef.current) {
      reasonInputRef.current.focus();
      reasonInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

interface ExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exception?: CalendarException; // If provided, edit mode
  onSuccess?: () => void;
}

/** Extracted class selector to reduce parent complexity */
function ClassSelectorSection({
  classes,
  isLoadingClasses,
  selectedClasses,
  toggleClass,
  errors,
}: {
  classes: { public_id: string; name: string; class_master?: { name: string } | null }[];
  isLoadingClasses: boolean;
  selectedClasses: string[];
  toggleClass: (id: string) => void;
  errors: Record<string, string>;
}) {
  if (isLoadingClasses) {
    return (
      <div className="flex items-center justify-center rounded-xl border-2 border-purple-200 bg-purple-50 py-12">
        <div className="text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm font-medium text-purple-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'max-h-64 overflow-y-auto rounded-xl border-2 bg-gradient-to-br from-white to-purple-50/30 p-4',
          errors.classes && 'border-red-500'
        )}
      >
        {classes.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">No classes available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {classes.map((cls) => {
              const isSelected = selectedClasses.includes(cls.public_id);
              return (
                <button
                  key={cls.public_id}
                  type="button"
                  onClick={() => toggleClass(cls.public_id)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-left text-sm shadow-sm transition-all hover:shadow-md',
                    isSelected
                      ? 'border-purple-500 bg-purple-100 text-purple-900'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2',
                      isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                    )}
                  >
                    {isSelected && <div className="h-2.5 w-2.5 rounded-sm bg-white" />}
                  </div>
                  <span className="flex-1 truncate">
                    {cls.class_master?.name}-{cls.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {selectedClasses.length > 0 && (
        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="mb-2 text-xs font-medium text-purple-900">
            Selected Classes ({selectedClasses.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedClasses.map((classId) => {
              const cls = classes.find((c) => c.public_id === classId);
              return cls ? (
                <Badge
                  key={classId}
                  variant="secondary"
                  className="gap-1.5 bg-purple-600 pr-1 text-white shadow-sm hover:bg-purple-700"
                >
                  {cls.class_master?.name}-{cls.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 rounded-full p-0 hover:bg-white/20"
                    onClick={() => toggleClass(classId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
      {!!errors.classes && (
        <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
          <AlertTriangle className="h-3.5 w-3.5" />
          {errors.classes}
        </p>
      )}
    </>
  );
}

function validateExceptionForm(
  date: Date | undefined,
  reason: string,
  isAllClasses: boolean,
  selectedClasses: string[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!date) {
    errors.date = 'Date is required';
  }
  if (!reason.trim()) {
    errors.reason = 'Reason is required';
  } else if (reason.length > 500) {
    errors.reason = 'Reason must be 500 characters or less';
  }
  if (!isAllClasses && selectedClasses.length === 0) {
    errors.classes = 'Please select at least one class';
  }
  return errors;
}

export function ExceptionDialog({
  open,
  onOpenChange,
  exception,
  onSuccess,
}: ExceptionDialogProps) {
  const isEditMode = !!exception;

  // Form refs for focus management
  const dateContainerRef = useRef<HTMLDivElement>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);

  // Form state
  const [date, setDate] = useState<Date | undefined>(
    exception ? new Date(exception.date) : undefined
  );
  const [overrideType, setOverrideType] = useState<OverrideType>(
    exception?.override_type || 'FORCE_WORKING'
  );
  const [reason, setReason] = useState(exception?.reason || '');
  const [isAllClasses, setIsAllClasses] = useState(exception?.is_applicable_to_all_classes ?? true);
  const [isAllTeachers, setIsAllTeachers] = useState(
    exception?.is_applicable_to_all_teachers ?? true
  );
  const [selectedClasses, setSelectedClasses] = useState<string[]>(exception?.classes || []);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch classes - Only fetch when dialog is open
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: () => fetchClasses({ page_size: 1000 }),
    enabled: open, // Only fetch when dialog is open
  });

  const classes = classesData?.data || [];

  // Reset form when dialog closes or exception changes
  useEffect(() => {
    if (!open) {
      return;
    }
    setDate(exception ? new Date(exception.date) : undefined);
    setOverrideType(exception?.override_type || 'FORCE_WORKING');
    setReason(exception?.reason || '');
    setIsAllClasses(exception?.is_applicable_to_all_classes ?? true);
    setIsAllTeachers(exception?.is_applicable_to_all_teachers ?? true);
    setSelectedClasses(exception?.classes || []);
    setErrors({});
  }, [open, exception]);

  // Create mutation
  const createMutation = useCreateCalendarException({
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (_error, fieldErrors) => {
      if (Object.keys(fieldErrors).length === 0) {
        return;
      }
      setErrors(fieldErrors);
      focusFirstErrorField(fieldErrors, dateContainerRef, reasonInputRef);
    },
  });

  // Update mutation
  const updateMutation = useUpdateCalendarException({
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (_error, fieldErrors) => {
      if (Object.keys(fieldErrors).length === 0) {
        return;
      }
      setErrors(fieldErrors);
      focusFirstErrorField(fieldErrors, dateContainerRef, reasonInputRef);
    },
  });

  // Validation
  const validate = (): boolean => {
    const newErrors = validateExceptionForm(date, reason, isAllClasses, selectedClasses);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      focusFirstErrorField(newErrors, dateContainerRef, reasonInputRef);
    }
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      toast.error('Please fix the form errors before submitting.');
      return;
    }

    const data: CalendarExceptionCreate = {
      date: format(date ?? new Date(), 'yyyy-MM-dd'),
      override_type: overrideType,
      reason: reason.trim(),
      is_applicable_to_all_classes: isAllClasses,
      is_applicable_to_all_teachers: isAllTeachers,
      classes: isAllClasses ? [] : selectedClasses,
    };

    if (isEditMode) {
      updateMutation.mutate({ publicId: exception?.public_id ?? '', payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle class toggle
  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
    if (errors.classes) {
      setErrors((prev) => ({ ...prev, classes: '' }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const dialogTitle = isEditMode ? 'Edit Calendar Exception' : 'Add Calendar Exception';
  const dialogDescription = isEditMode
    ? 'Update the exception details below'
    : 'Override working days or holidays for specific dates';
  const headerIcon = isEditMode ? (
    <AlertTriangle className="h-6 w-6 text-white sm:h-7 sm:w-7" />
  ) : (
    <Plus className="h-6 w-6 text-white sm:h-7 sm:w-7" />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] flex-col overflow-hidden bg-white p-0 sm:max-w-[700px]">
        <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
        <DialogDescription className="sr-only">{dialogDescription}</DialogDescription>
        {/* Modern Gradient Header - Fixed */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-lg backdrop-blur-sm sm:h-14 sm:w-14">
              {headerIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">{dialogTitle}</h2>
              <p className="text-sm text-purple-100 sm:text-base">{dialogDescription}</p>
            </div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <ExceptionFormContent
          date={date}
          setDate={setDate}
          overrideType={overrideType}
          setOverrideType={setOverrideType}
          reason={reason}
          setReason={setReason}
          isAllClasses={isAllClasses}
          setIsAllClasses={setIsAllClasses}
          isAllTeachers={isAllTeachers}
          setIsAllTeachers={setIsAllTeachers}
          setSelectedClasses={setSelectedClasses}
          errors={errors}
          setErrors={setErrors}
          dateContainerRef={dateContainerRef}
          reasonInputRef={reasonInputRef}
          classSelectorNode={
            <ClassSelectorSection
              classes={classes}
              isLoadingClasses={isLoadingClasses}
              selectedClasses={selectedClasses}
              toggleClass={toggleClass}
              errors={errors}
            />
          }
        />

        {/* Footer Actions - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 p-6 sm:p-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="brandOutline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-11 w-full border-2 transition-colors hover:bg-gray-100 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-11 w-full shadow-md transition-all hover:shadow-xl sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEditMode ? 'Update Exception' : 'Create Exception'}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
