/**
 * Exception Form Content - extracted form steps for the exception dialog
 * Reduces cognitive complexity of ExceptionDialog
 */

import { AlertTriangle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { OverrideType } from '../types';

interface ExceptionFormContentProps {
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  overrideType: OverrideType;
  setOverrideType: (v: OverrideType) => void;
  reason: string;
  setReason: (v: string) => void;
  isAllClasses: boolean;
  setIsAllClasses: (v: boolean) => void;
  isAllTeachers: boolean;
  setIsAllTeachers: (v: boolean) => void;
  /** Admins choose org-wide/teacher scope; class teachers are always class-scoped */
  showScopeOptions: boolean;
  setSelectedClasses: (v: string[]) => void;
  errors: Record<string, string>;
  setErrors: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  dateContainerRef: React.RefObject<HTMLDivElement | null>;
  reasonInputRef: React.RefObject<HTMLTextAreaElement | null>;
  classSelectorNode: React.ReactNode;
}

export function ExceptionFormContent({
  date,
  setDate,
  overrideType,
  setOverrideType,
  reason,
  setReason,
  isAllClasses,
  setIsAllClasses,
  isAllTeachers,
  setIsAllTeachers,
  showScopeOptions,
  setSelectedClasses,
  errors,
  setErrors,
  dateContainerRef,
  reasonInputRef,
  classSelectorNode,
}: ExceptionFormContentProps) {
  const showClassSelector = !showScopeOptions || !isAllClasses;
  const classStep = showScopeOptions ? 5 : 3;
  const reasonStep = showClassSelector ? classStep + 1 : classStep;

  return (
    <div className="flex-1 space-y-6 overflow-y-auto bg-white p-6 sm:p-8">
      {/* Step 1: Date Picker */}
      <DatePickerStep
        date={date}
        setDate={setDate}
        errors={errors}
        setErrors={setErrors}
        dateContainerRef={dateContainerRef}
      />

      {/* Step 2: Override Type */}
      <div className="space-y-3">
        <StepHeader
          step={2}
          title="Exception Type"
          required
          description="Choose how to override this date"
        />
        <SearchableSelect
          options={[
            { value: 'FORCE_WORKING', label: 'Force Working Day' },
            { value: 'FORCE_HOLIDAY', label: 'Force Holiday' },
          ]}
          value={overrideType}
          onValueChange={(value: string) => setOverrideType(value as OverrideType)}
          className="h-11 border-2 transition-colors hover:border-purple-300"
        />
      </div>

      {/* Step 3: Apply to All Classes Toggle */}
      {showScopeOptions && (
        <div className="space-y-3">
          <StepHeader
            step={3}
            title="Applicable To"
            description="Choose which classes this applies to"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <ClassToggleButton
              label="All Classes"
              description="Apply to all classes in the organization"
              isActive={isAllClasses}
              onClick={() => {
                setIsAllClasses(true);
                setSelectedClasses([]);
                setErrors((prev) => ({ ...prev, classes: '' }));
              }}
            />
            <ClassToggleButton
              label="Specific Classes"
              description="Select specific classes"
              isActive={!isAllClasses}
              onClick={() => setIsAllClasses(false)}
            />
          </div>
        </div>
      )}

      {/* Step 4: Apply to All Teachers Toggle */}
      {showScopeOptions && (
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StepBadge step={4} />
              <div>
                <Label className="text-base font-semibold">Apply to All Teachers</Label>
                <p className="text-muted-foreground text-xs">
                  Include this exception for teacher/employee attendance
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAllTeachers(!isAllTeachers)}
              className={cn(
                'relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none',
                isAllTeachers ? 'bg-purple-600' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform',
                  isAllTeachers ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Class Selection */}
      {showClassSelector && (
        <div className="space-y-3">
          <StepHeader
            step={classStep}
            title="Select Classes"
            required
            description={
              showScopeOptions
                ? 'Choose the classes for this exception'
                : 'Only classes where you are the class teacher are listed'
            }
          />
          {classSelectorNode}
        </div>
      )}

      {/* Step: Reason */}
      <div className="space-y-3">
        <StepHeader
          step={reasonStep}
          title="Reason"
          required
          description="Explain why this exception is needed"
        />
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
            'resize-none border-2 transition-colors hover:border-purple-300',
            errors.reason && 'border-red-500'
          )}
        />
        <div className="flex items-center justify-between text-xs">
          {errors.reason ? (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              {errors.reason}
            </span>
          ) : (
            <span className="text-muted-foreground">Provide a clear reason for this exception</span>
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
  );
}

// --- Helper sub-components ---

function StepBadge({ step }: { step: number }) {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-sm font-bold text-white shadow-md">
      {step}
    </div>
  );
}

function StepHeader({
  step,
  title,
  required,
  description,
}: {
  step: number;
  title: string;
  required?: boolean;
  description: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <StepBadge step={step} />
      <div>
        <Label className="text-base font-semibold">
          {title} {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
    </div>
  );
}

function DatePickerStep({
  date,
  setDate,
  errors,
  setErrors,
  dateContainerRef,
}: {
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  errors: Record<string, string>;
  setErrors: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  dateContainerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="space-y-3 pb-4">
      <div className="mb-3 flex items-start gap-3">
        <StepBadge step={1} />
        <div className="flex-1">
          <Label className="text-base font-semibold">
            Select Date <span className="text-red-500">*</span>
          </Label>
          <p className="text-muted-foreground mb-3 text-xs">Choose the date for this exception</p>
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
                'h-11 w-full border-2 transition-colors hover:border-purple-300',
                errors.date && 'border-red-500'
              )}
            />
          </div>
          {!!errors.date && (
            <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              {errors.date}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassToggleButton({
  label,
  description,
  isActive,
  onClick,
}: {
  label: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-xl border-2 p-4 text-left transition-all',
        isActive
          ? 'border-purple-500 bg-purple-50 shadow-md'
          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
      )}
    >
      <div className="text-base font-semibold">{label}</div>
      <div className="text-muted-foreground mt-1 text-xs">{description}</div>
    </button>
  );
}
