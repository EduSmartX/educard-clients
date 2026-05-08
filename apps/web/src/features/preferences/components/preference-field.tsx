import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { OrganizationPreference } from '@/lib/api/preferences-api';
import { FormPlaceholders } from '@/constants';
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

export function PreferenceField({
  preference,
  value,
  onChange,
  disabled = false,
}: PreferenceFieldProps) {
  const [multiSelectInput, setMultiSelectInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reusable label with tooltip
  const FieldLabel = ({ htmlFor }: { htmlFor?: string }) => (
    <div className="flex items-center gap-2">
      <Label htmlFor={htmlFor} className="text-gray-900">
        {preference.display_name}
      </Label>
      {preference.description && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-sm bg-gray-900 text-white border-gray-700 shadow-lg"
            >
              <p className="text-sm leading-relaxed">{preference.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

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
        <div className="flex flex-col sm:flex-row sm:items-start border-b border-dotted border-gray-200 px-4 py-4 last:border-b-0 gap-3 sm:gap-0">
          <div className="sm:w-[600px] sm:pr-8 sm:flex-shrink-0">
            <FieldLabel htmlFor={preference.key} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              <Combobox
                options={hourOptions}
                value={currentHour}
                onValueChange={(hour) => handleTimeChange(hour, currentMinute)}
                placeholder="HH"
                searchPlaceholder="Search hours..."
                emptyText="No hour found"
                className="h-11 bg-white border-gray-300 text-gray-900 w-24"
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
                className="h-11 bg-white border-gray-300 text-gray-900 w-24"
                disabled={disabled}
              />
            </div>
            {validationError && (
              <p className="text-sm font-medium text-red-500 mt-1">{validationError}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-start border-b border-dotted border-gray-200 px-4 py-4 last:border-b-0 gap-3 sm:gap-0">
          <div className="sm:w-[600px] sm:pr-8 sm:flex-shrink-0">
            <FieldLabel htmlFor={preference.key} />
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
                'h-11 bg-white border-gray-300 text-gray-900 w-full sm:max-w-md',
                validationError && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {validationError && (
              <p className="text-sm font-medium text-red-500 mt-1">{validationError}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-start border-b border-dotted border-gray-200 px-4 py-4 last:border-b-0 gap-3 sm:gap-0">
          <div className="sm:w-[600px] sm:pr-8 sm:flex-shrink-0">
            <FieldLabel htmlFor={preference.key} />
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
                'h-11 bg-white border-gray-300 text-gray-900 w-full sm:max-w-md',
                validationError && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {validationError && (
              <p className="text-sm font-medium text-red-500 mt-1">{validationError}</p>
            )}
          </div>
        </div>
      );
    }

    case 'radio': {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center border-b border-dotted border-gray-200 px-4 py-4 last:border-b-0 gap-3 sm:gap-0">
          <div className="sm:w-[600px] sm:pr-8 sm:flex-shrink-0">
            <FieldLabel />
          </div>
          <div className="flex-1">
            <RadioGroup
              value={value as string}
              onValueChange={onChange}
              disabled={disabled}
              className="flex items-center gap-3 flex-wrap"
            >
              {preference.applicable_values?.map((option: string) => (
                <label
                  key={option}
                  htmlFor={`${preference.key}-${option}`}
                  className="flex cursor-pointer items-center space-x-2 rounded-lg border-2 border-gray-200 bg-white px-6 py-3 transition-all hover:border-blue-400 hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <RadioGroupItem value={option} id={`${preference.key}-${option}`} />
                  <span className="font-medium text-sm text-gray-900">
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
        <div className="flex flex-col sm:flex-row sm:items-start border-b border-dotted border-gray-200 px-4 py-4 last:border-b-0 gap-3 sm:gap-0">
          <div className="sm:w-[600px] sm:pr-8 sm:flex-shrink-0">
            <FieldLabel htmlFor={preference.key} />
          </div>
          <div className="flex-1">
            <Select value={value as string} onValueChange={onChange} disabled={disabled}>
              <SelectTrigger
                id={preference.key}
                className="h-11 bg-white border-gray-300 text-gray-900 w-full sm:max-w-md"
              >
                <SelectValue placeholder={FormPlaceholders.SELECT_OPTION} />
              </SelectTrigger>
              <SelectContent>
                {preference.applicable_values?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    case 'multi-choice': {
      return (
        <div className="flex flex-col border-b border-dotted border-gray-200 px-4 py-4 last:border-b-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0">
            <div className="sm:w-[600px] sm:pr-8 sm:flex-shrink-0">
              <FieldLabel htmlFor={preference.key} />
            </div>
            <div className="flex-1">
              <Select
                value={multiSelectInput}
                onValueChange={(val: string) => {
                  handleMultiSelectAdd(val);
                  setMultiSelectInput('');
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id={preference.key}
                  className="h-11 bg-white border-gray-300 text-gray-900 w-full sm:max-w-md"
                >
                  <SelectValue placeholder={FormPlaceholders.SELECT_OPTIONS} />
                </SelectTrigger>
                <SelectContent>
                  {preference.applicable_values
                    ?.filter((option: string) => !currentMultiValues.includes(option))
                    .map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {currentMultiValues.length > 0 && (
            <div className="flex flex-col sm:flex-row mt-3 gap-3 sm:gap-0">
              <div className="hidden sm:block sm:w-[600px] sm:pr-8 sm:flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 w-full sm:max-w-md">
                  {currentMultiValues.map((val: string) => (
                    <Badge
                      key={val}
                      variant="secondary"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800"
                    >
                      {val}
                      <button
                        type="button"
                        onClick={() => handleMultiSelectRemove(val)}
                        disabled={disabled}
                        className="rounded-full p-0.5 hover:bg-blue-200 transition-colors"
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
