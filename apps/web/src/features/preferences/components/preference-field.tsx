import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { OrganizationPreference } from '@/lib/api/preferences-api';
import { FormPlaceholders } from '@/constants';
import { useClasses } from '@/features/classes/hooks/use-classes';
import {
  validateTimeFormat,
  validateDeadlineDay,
  parseMultiChoiceValue,
} from '../utils/validation';

interface PreferenceFieldProps {
  preference: OrganizationPreference;
  value: string | string[];
  onChange: (value: string | string[], hasError?: boolean) => void;
  disabled?: boolean;
}

// Extracted outside parent component
function FieldLabel({
  htmlFor,
  displayName,
  description,
}: Readonly<{ htmlFor?: string; displayName: string; description?: string }>) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm text-gray-700">
        {displayName}
      </Label>
      {!!description && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 cursor-help text-gray-400 transition-colors hover:text-gray-600" />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-sm border-gray-700 bg-gray-900 text-white shadow-lg"
            >
              <p className="text-sm leading-relaxed">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Dynamic classes selector for homework notifications — All toggle or specific class pick
function ClassesMultiSelect({
  currentValues,
  onChange,
  disabled,
}: Readonly<{
  currentValues: string[];
  onChange: (vals: string[]) => void;
  disabled?: boolean;
}>) {
  const isAll = currentValues.includes('ALL');
  const { data: classesData } = useClasses({ page_size: 100 });
  const classes = (classesData?.data || []) as {
    public_id: string;
    name: string;
    class_master?: { name: string } | null;
  }[];

  const classOptions = classes.map((cls) => ({
    value: cls.public_id,
    label: cls.class_master ? `${cls.class_master.name} - ${cls.name}` : cls.name,
  }));

  return (
    <div className="w-full sm:max-w-md">
      {/* All / Specific Classes toggle */}
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(['ALL'])}
          disabled={disabled}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            isAll
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
          }`}
        >
          All Classes
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          disabled={disabled}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !isAll
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
          }`}
        >
          Select Classes
        </button>
      </div>

      {/* Multi-select dropdown — only shown when not ALL */}
      {!isAll && (
        <MultiSelect
          options={classOptions}
          value={currentValues}
          onChange={onChange}
          placeholder="Select classes..."
          searchPlaceholder="Search classes..."
          emptyMessage="No classes found."
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function PreferenceField({
  preference,
  value,
  onChange,
  disabled = false,
}: PreferenceFieldProps) {
  const [multiSelectInput, setMultiSelectInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleMultiSelectAdd = (selectedValue: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    if (selectedValue && !currentValues.includes(selectedValue)) {
      onChange([...currentValues, selectedValue]);
    }
  };

  const handleMultiSelectRemove = (valueToRemove: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    onChange(currentValues.filter((v) => v !== valueToRemove));
  };

  const currentMultiValues =
    preference.field_type === 'multi-choice' ? parseMultiChoiceValue(value) : [];

  switch (preference.field_type) {
    case 'time': {
      // Parse the current time value (HH:MM format)
      const [currentHour, currentMinute] = (value as string)?.split(':') || ['12', '00'];

      const handleTimeChange = (hour: string, minute: string) => {
        const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
        const error = validateTimeFormat(formattedTime);
        setValidationError(error);
        onChange(formattedTime, !!error);
      };

      // Generate hours (00-23) with labels
      const hourOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return { value: hour, label: hour };
      });

      // Generate minutes (00-59) with labels
      const minuteOptions = Array.from({ length: 60 }, (_, i) => {
        const minute = i.toString().padStart(2, '0');
        return { value: minute, label: minute };
      });

      return (
        <div className="flex flex-col gap-3 border-b border-dotted border-gray-100 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-0">
          <div className="sm:w-[480px] sm:flex-shrink-0 sm:pr-8">
            <FieldLabel
              htmlFor={preference.key}
              displayName={preference.display_name}
              description={preference.description}
            />
          </div>
          <div className="flex-1">
            <div className="flex w-full items-center gap-2 sm:max-w-md">
              <Combobox
                options={hourOptions}
                value={currentHour}
                onValueChange={(hour) => handleTimeChange(hour, currentMinute)}
                placeholder="HH"
                searchPlaceholder="Search hours..."
                emptyText="No hour found"
                className="h-11 w-24 border-gray-300 bg-white text-gray-900"
                disabled={disabled}
              />
              <span className="text-xl font-semibold text-gray-500">:</span>
              <Combobox
                options={minuteOptions}
                value={currentMinute}
                onValueChange={(minute) => handleTimeChange(currentHour, minute)}
                placeholder="MM"
                searchPlaceholder="Search minutes..."
                emptyText="No minute found"
                className="h-11 w-24 border-gray-300 bg-white text-gray-900"
                disabled={disabled}
              />
            </div>
            {!!validationError && (
              <p className="mt-1 text-sm font-medium text-red-500">{validationError}</p>
            )}
          </div>
        </div>
      );
    }

    case 'string': {
      // Check if this is the time field for student absence notification
      const isTimeField =
        preference.display_name.includes('Preferred Time') &&
        preference.display_name.includes('Student Absence');

      const handleStringChange = (newValue: string) => {
        if (isTimeField) {
          const error = validateTimeFormat(newValue);
          setValidationError(error);
          onChange(newValue, !!error);
        } else {
          onChange(newValue, false);
        }
      };

      return (
        <div className="flex flex-col gap-3 border-b border-dotted border-gray-100 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-0">
          <div className="sm:w-[480px] sm:flex-shrink-0 sm:pr-8">
            <FieldLabel
              htmlFor={preference.key}
              displayName={preference.display_name}
              description={preference.description}
            />
          </div>
          <div className="flex-1">
            <Input
              id={preference.key}
              type="text"
              value={value as string}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleStringChange(e.target.value)
              }
              disabled={disabled}
              placeholder={isTimeField ? 'HH:MM (e.g., 14:30)' : preference.default_value}
              className={cn(
                'h-11 w-full border-gray-300 bg-white text-gray-900 sm:max-w-md',
                validationError && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {!!validationError && (
              <p className="mt-1 text-sm font-medium text-red-500">{validationError}</p>
            )}
          </div>
        </div>
      );
    }

    case 'number': {
      // Check if this is the deadline day field
      const isDeadlineField =
        preference.display_name.includes('Timesheet') &&
        preference.display_name.includes('Deadline');

      const handleNumberChange = (newValue: string) => {
        if (isDeadlineField) {
          const error = validateDeadlineDay(newValue);
          setValidationError(error);
          onChange(newValue, !!error);
        } else {
          setValidationError(null);
          onChange(newValue, false);
        }
      };

      return (
        <div className="flex flex-col gap-3 border-b border-dotted border-gray-100 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-0">
          <div className="sm:w-[480px] sm:flex-shrink-0 sm:pr-8">
            <FieldLabel
              htmlFor={preference.key}
              displayName={preference.display_name}
              description={preference.description}
            />
          </div>
          <div className="flex-1">
            <Input
              id={preference.key}
              type="number"
              value={value as string}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleNumberChange(e.target.value)
              }
              disabled={disabled}
              placeholder={preference.default_value}
              min={isDeadlineField ? '1' : undefined}
              max={isDeadlineField ? '31' : undefined}
              className={cn(
                'h-11 w-full border-gray-300 bg-white text-gray-900 sm:max-w-md',
                validationError && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {!!validationError && (
              <p className="mt-1 text-sm font-medium text-red-500">{validationError}</p>
            )}
          </div>
        </div>
      );
    }

    case 'radio': {
      return (
        <div className="flex flex-col gap-3 border-b border-dotted border-gray-100 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-0">
          <div className="sm:w-[480px] sm:flex-shrink-0 sm:pr-8">
            <FieldLabel
              displayName={preference.display_name}
              description={preference.description}
            />
          </div>
          <div className="flex-1">
            <RadioGroup
              value={value as string}
              onValueChange={onChange}
              disabled={disabled}
              className="flex flex-wrap items-center gap-3"
            >
              {preference.applicable_values?.map((option: string) => (
                <label
                  key={option}
                  htmlFor={`${preference.key}-${option}`}
                  className="flex cursor-pointer items-center space-x-2 rounded-lg border-2 border-gray-200 bg-white px-6 py-3 transition-all hover:border-blue-400 hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <RadioGroupItem value={option} id={`${preference.key}-${option}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {(() => {
                      if (option === 'TRUE') {
                        return 'Yes';
                      }
                      if (option === 'FALSE') {
                        return 'No';
                      }
                      return option;
                    })()}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      );
    }

    case 'choice': {
      return (
        <div className="flex flex-col gap-3 border-b border-dotted border-gray-100 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-0">
          <div className="sm:w-[480px] sm:flex-shrink-0 sm:pr-8">
            <FieldLabel
              htmlFor={preference.key}
              displayName={preference.display_name}
              description={preference.description}
            />
          </div>
          <div className="flex-1">
            <SearchableSelect
              options={(preference.applicable_values || []).map((option: string) => ({
                value: option,
                label: option.replaceAll('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              }))}
              value={value as string}
              onValueChange={(v) => onChange(v)}
              disabled={disabled}
              placeholder={FormPlaceholders.SELECT_OPTION}
              className="h-11 w-full border-gray-300 bg-white text-gray-900 sm:max-w-md"
            />
          </div>
        </div>
      );
    }

    case 'multi-choice': {
      // For eligible classes preference, dynamically build options from API
      const isClassesPreference = preference.key === 'eligeble_classes_for_homework_notifications';

      const staticOptions = (preference.applicable_values || [])
        .filter((option: string) => !currentMultiValues.includes(option))
        .map((option: string) => ({
          value: option,
          label: option.replaceAll('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        }));

      return (
        <div className="flex flex-col border-b border-dotted border-gray-100 px-3 py-2.5 last:border-b-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
            <div className="sm:w-[480px] sm:flex-shrink-0 sm:pr-8">
              <FieldLabel
                htmlFor={preference.key}
                displayName={preference.display_name}
                description={preference.description}
              />
            </div>
            <div className="flex-1">
              {isClassesPreference ? (
                <ClassesMultiSelect
                  currentValues={currentMultiValues}
                  onChange={(vals) => onChange(vals)}
                  disabled={disabled}
                />
              ) : (
                <SearchableSelect
                  options={staticOptions}
                  value={multiSelectInput}
                  onValueChange={(val: string) => {
                    handleMultiSelectAdd(val);
                    setMultiSelectInput('');
                  }}
                  disabled={disabled}
                  placeholder={FormPlaceholders.SELECT_OPTION}
                  className="h-11 w-full border-gray-300 bg-white text-gray-900 sm:max-w-md"
                />
              )}
            </div>
          </div>
          {!isClassesPreference && currentMultiValues.length > 0 && (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-0">
              <div className="hidden sm:block sm:w-[480px] sm:flex-shrink-0 sm:pr-8"></div>
              <div className="flex-1">
                <div className="flex w-full flex-wrap gap-2 sm:max-w-md">
                  {currentMultiValues.map((val: string) => (
                    <Badge
                      key={val}
                      variant="secondary"
                      className="flex items-center gap-1.5 bg-blue-100 px-3 py-1.5 text-blue-800"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => handleMultiSelectRemove(val)}
                        disabled={disabled}
                        className="rounded-full p-0.5 transition-colors hover:bg-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
