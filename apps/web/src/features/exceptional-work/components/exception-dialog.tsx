/**
 * Add/Edit Calendar Exception Dialog
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { AlertTriangle, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { fetchClasses } from '@/features/classes/api/classes-api';
import { useCreateCalendarException, useUpdateCalendarException } from '../hooks';
import type { CalendarException, CalendarExceptionCreate, OverrideType } from '../types';

interface ExceptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exception?: CalendarException; // If provided, edit mode
  onSuccess?: () => void;
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
  const [isAllTeachers, setIsAllTeachers] = useState(exception?.is_applicable_to_all_teachers ?? true);
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
    if (open) {
      if (exception) {
        setDate(new Date(exception.date));
        setOverrideType(exception.override_type);
        setReason(exception.reason);
        setIsAllClasses(exception.is_applicable_to_all_classes);
        setIsAllTeachers(exception.is_applicable_to_all_teachers);
        setSelectedClasses(exception.classes || []);
      } else {
        setDate(undefined);
        setOverrideType('FORCE_WORKING');
        setReason('');
        setIsAllClasses(true);
        setIsAllTeachers(true);
        setSelectedClasses([]);
      }
      setErrors({});
    }
  }, [open, exception]);

  // Create mutation
  const createMutation = useCreateCalendarException({
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (_error, fieldErrors) => {
      // Set field-level errors on form (toast already shown by mutation hook)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);

        // Focus on first error field
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
    },
  });

  // Update mutation
  const updateMutation = useUpdateCalendarException({
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (_error, fieldErrors) => {
      // Set field-level errors on form (toast already shown by mutation hook)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);

        // Focus on first error field
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
    },
  });

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = 'Date is required';
    }
    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (reason.length > 500) {
      newErrors.reason = 'Reason must be 500 characters or less';
    }
    if (!isAllClasses && selectedClasses.length === 0) {
      newErrors.classes = 'Please select at least one class';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    const data: CalendarExceptionCreate = {
      date: format(date!, 'yyyy-MM-dd'),
      override_type: overrideType,
      reason: reason.trim(),
      is_applicable_to_all_classes: isAllClasses,
      is_applicable_to_all_teachers: isAllTeachers,
      classes: isAllClasses ? [] : selectedClasses,
    };

    if (isEditMode) {
      updateMutation.mutate({
        publicId: exception!.public_id,
        payload: data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  // Handle class toggle
  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
    // Clear error when user makes a selection
    if (errors.classes) {
      setErrors((prev) => ({ ...prev, classes: '' }));
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] p-0 bg-white flex flex-col overflow-hidden">
        {/* Modern Gradient Header - Fixed */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 p-6 sm:p-8 text-white flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
              {isEditMode ? (
                <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              ) : (
                <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {isEditMode ? 'Edit Calendar Exception' : 'Add Calendar Exception'}
              </h2>
              <p className="text-purple-100 text-sm sm:text-base">
                {isEditMode
                  ? 'Update the exception details below'
                  : 'Override working days or holidays for specific dates'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
          {/* Step 1: Date Picker */}
          <div className="space-y-3 pb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-md flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <Label className="text-base font-semibold">
                  Select Date <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Choose the date for this exception
                </p>

                <div ref={dateContainerRef} className="relative w-full max-w-sm">
                  <DatePicker
                    value={date ?? null}
                    onChange={(newDate: Date | null) => {
                      setDate(newDate ?? undefined);
                      if (errors.date) {
                        setErrors((prev) => ({ ...prev, date: '' }));
                      }
                    }}
                    placeholder="Select date"
                    className={cn(
                      'w-full h-11 border-2 hover:border-purple-300 transition-colors',
                      errors.date && 'border-red-500'
                    )}
                  />
                </div>

                {errors.date && (
                  <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errors.date}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Override Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                2
              </div>
              <div>
                <Label className="text-base font-semibold">
                  Exception Type <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Choose how to override this date</p>
              </div>
            </div>
            <Select
              value={overrideType}
              onValueChange={(value: string) => setOverrideType(value as OverrideType)}
            >
              <SelectTrigger className="h-11 border-2 hover:border-purple-300 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FORCE_WORKING" className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm" />
                    <div>
                      <div className="font-medium">Force Working Day</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="FORCE_HOLIDAY" className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm" />
                    <div>
                      <div className="font-medium">Force Holiday</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Apply to All Classes Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                3
              </div>
              <div>
                <Label className="text-base font-semibold">Applicable To</Label>
                <p className="text-xs text-muted-foreground">
                  Choose which classes this applies to
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsAllClasses(true);
                  setSelectedClasses([]);
                  setErrors((prev) => ({ ...prev, classes: '' }));
                }}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-left transition-all',
                  isAllClasses
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                )}
              >
                <div className="font-semibold text-base">All Classes</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Apply to all classes in the organization
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsAllClasses(false)}
                className={cn(
                  'flex-1 rounded-xl border-2 p-4 text-left transition-all',
                  !isAllClasses
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                )}
              >
                <div className="font-semibold text-base">Specific Classes</div>
                <div className="text-xs text-muted-foreground mt-1">Select specific classes</div>
              </button>
            </div>
          </div>

          {/* Step 4: Apply to All Teachers Toggle */}
          <div className="space-y-3 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-md flex-shrink-0">
                  4
                </div>
                <div>
                  <Label className="text-base font-semibold">
                    Apply to All Teachers
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Include this exception for teacher/employee attendance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllTeachers(!isAllTeachers)}
                className={cn(
                  'relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex-shrink-0',
                  isAllTeachers ? 'bg-purple-600' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md',
                    isAllTeachers ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Step 5: Class Selection (only if not all classes) */}
          {!isAllClasses && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                  5
                </div>
                <div>
                  <Label className="text-base font-semibold">
                    Select Classes <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose the classes for this exception
                  </p>
                </div>
              </div>
              {isLoadingClasses ? (
                <div className="flex items-center justify-center py-12 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-purple-600 font-medium">Loading classes...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={cn(
                      'rounded-xl border-2 p-4 max-h-64 overflow-y-auto bg-gradient-to-br from-white to-purple-50/30',
                      errors.classes && 'border-red-500'
                    )}
                  >
                    {classes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No classes available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {classes.map((cls: { public_id: string; name: string; class_master?: { name: string } }) => {
                          const isSelected = selectedClasses.includes(cls.public_id);
                          return (
                            <button
                              key={cls.public_id}
                              type="button"
                              onClick={() => toggleClass(cls.public_id)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-sm transition-all text-left shadow-sm hover:shadow-md',
                                isSelected
                                  ? 'border-purple-500 bg-purple-100 text-purple-900'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white'
                              )}
                            >
                              <div
                                className={cn(
                                  'h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0',
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
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mt-3">
                      <p className="text-xs font-medium text-purple-900 mb-2">
                        Selected Classes ({selectedClasses.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedClasses.map((classId) => {
                          const cls = classes.find(
                            (c: { public_id: string; name: string; class_master?: { name: string } }) => c.public_id === classId
                          );
                          return cls ? (
                            <Badge
                              key={classId}
                              variant="secondary"
                              className="gap-1.5 pr-1 bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                            >
                              {cls.class_master?.name}-{cls.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-white/20 rounded-full"
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
                  {errors.classes && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {errors.classes}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 6: Reason */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                {isAllClasses ? '5' : '6'}
              </div>
              <div>
                <Label className="text-base font-semibold">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Explain why this exception is needed
                </p>
              </div>
            </div>
            <Textarea
              ref={reasonInputRef}
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors((prev) => ({ ...prev, reason: '' }));
                }
              }}
              placeholder="e.g., Makeup class for Republic Day, Exam preparation day, Special event, etc."
              rows={4}
              maxLength={500}
              className={cn(
                'border-2 hover:border-purple-300 transition-colors resize-none',
                errors.reason && 'border-red-500'
              )}
            />
            <div className="flex justify-between items-center text-xs">
              {errors.reason ? (
                <span className="text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errors.reason}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Provide a clear reason for this exception
                </span>
              )}
              <span
                className={cn(
                  'font-medium',
                  reason.length > 450 ? 'text-red-500' : 'text-muted-foreground'
                )}
              >
                {reason.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 sm:p-8 flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="brandOutline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto h-11 border-2 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto h-11 shadow-md hover:shadow-xl transition-all"
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
