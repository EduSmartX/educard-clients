/**
 * Reusable Form Field Components
 * Common form field patterns used across different forms
 */

import { useState } from 'react';
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS } from '@educard/shared';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useFormContext, type Control, type FieldValues, type Path } from 'react-hook-form';
import { getValidator, type ValidationResult } from '@/lib/utils/field-validators';
import { formatPhoneNumber, getTenDigitPhoneNumber } from '@/lib/phone-utils';
import { formatLocalDate, parseLocalDate } from '@/lib/utils/date-utils';

/**
 * Text Input Field Props
 */
interface TextInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password';
  max?: string | Date;
  min?: string | Date;
  readOnly?: boolean;
  validationType?: 'email' | 'phone' | 'employeeId' | 'name' | 'numeric' | 'text' | 'alphanumeric';
  validationOptions?: {
    fieldName?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    allowDecimal?: boolean;
  };
}

export function TextInputField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
  description,
  type = 'text',
  max,
  min,
  readOnly = false,
  validationType,
  validationOptions,
}: TextInputFieldProps<T>) {
  const [blurError, setBlurError] = useState<string | undefined>();
  const form = useFormContext<T>();
  const isPhone = validationType === 'phone';

  const handleBlur = async (value: string, onChange: (value: string) => void) => {
    // Clear previous blur error
    setBlurError(undefined);

    if (!validationType || !value || value.trim() === '') {
      await form.trigger(name);
      return;
    }

    // For phone fields, validate the clean digits
    const valueToValidate = isPhone ? getTenDigitPhoneNumber(value) : value;
    const validator = getValidator(validationType, validationOptions);
    const result: ValidationResult = validator(valueToValidate);

    if (!result.isValid && result.error) {
      setBlurError(result.error);
      // Trigger form validation by setting the field value again
      onChange(isPhone ? getTenDigitPhoneNumber(value) : value);
    }

    await form.trigger(name);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        // For phone fields, display formatted value (XXX-XXX-XXXX) but store clean digits
        const displayValue =
          isPhone && field.value ? formatPhoneNumber(String(field.value)) : (field.value ?? '');

        return (
          <FormItem>
            <FormLabel>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={displayValue}
                type={isPhone ? 'tel' : type}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={isPhone ? placeholder || '999-999-9999' : placeholder}
                max={max instanceof Date ? formatLocalDate(max) : max}
                min={min instanceof Date ? formatLocalDate(min) : min}
                onChange={(e) => {
                  if (isPhone) {
                    // Format display, store clean 10 digits
                    const formatted = formatPhoneNumber(e.target.value);
                    const clean = getTenDigitPhoneNumber(formatted);
                    field.onChange(clean);
                  } else {
                    field.onChange(e);
                  }
                }}
                onBlur={(e) => {
                  field.onBlur();
                  void handleBlur(e.target.value, field.onChange);
                }}
                className={
                  readOnly
                    ? 'cursor-not-allowed bg-gray-50 text-gray-700'
                    : 'border-gray-300 bg-gray-50 transition-colors focus:bg-white disabled:cursor-default disabled:opacity-100'
                }
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            {/* Show blur error if exists and no field error */}
            {blurError && !fieldState.error && (
              <p className="text-sm font-medium text-amber-600">{blurError}</p>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/**
 * Select Field Props
 */
interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  options: Array<{ value: string; label: string }>;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  description,
  options,
}: SelectFieldProps<T>) {
  const form = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Get the current value, convert empty string to undefined for placeholder
        const currentValue = field.value as string;
        const selectValue = currentValue && currentValue.trim() !== '' ? currentValue : undefined;

        return (
          <FormItem>
            <FormLabel>
              {label} {required && <span className="text-red-500">*</span>}
            </FormLabel>
            <FormControl>
              <SearchableSelect
                key={`${name}-${selectValue || 'empty'}`}
                options={options}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  field.onBlur();
                  void form.trigger(name);
                }}
                value={selectValue}
                placeholder={placeholder}
                className="border-gray-300 bg-gray-50 transition-colors focus:bg-white disabled:cursor-default disabled:opacity-100"
                disabled={disabled}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/**
 * Date Input Field
 */
interface DateInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  max?: Date;
  min?: Date;
  validationType?: 'dateOfBirth' | 'joiningDate';
  validationOptions?: {
    minAge?: number;
    maxAge?: number;
  };
}

function toDateOrUndefined(value: Date | string | undefined): Date | undefined {
  if (value instanceof Date) {
    return value;
  }
  if (value) {
    return parseLocalDate(value) ?? new Date(value);
  }
  return undefined;
}

export function DateInputField<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
  required = false,
  description,
  max,
  min,
  validationType,
  validationOptions,
}: DateInputFieldProps<T>) {
  const [blurError, setBlurError] = useState<string | undefined>();
  const form = useFormContext<T>();

  const handleDateChange = (date: Date | null, onChange: (value: string) => void) => {
    const dateString = date ? formatLocalDate(date) : '';
    onChange(dateString);

    // Clear previous error
    setBlurError(undefined);

    // Validate on change
    if (validationType && dateString) {
      const validator = getValidator(validationType, validationOptions);
      const result: ValidationResult = validator(dateString);

      if (!result.isValid && result.error) {
        setBlurError(result.error);
      }
    }

    void form.trigger(name);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className="w-full">
          <FormLabel>
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            <DatePicker
              value={field.value ? (parseLocalDate(String(field.value)) ?? null) : null}
              onChange={(date) => handleDateChange(date, field.onChange)}
              placeholder={`Select ${label.toLowerCase()}`}
              disabled={disabled}
              minDate={toDateOrUndefined(min)}
              maxDate={toDateOrUndefined(max)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {/* Show blur error if exists and no field error */}
          {blurError && !fieldState.error && (
            <p className="text-sm font-medium text-amber-600">{blurError}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Blood Group Field
 */
interface BloodGroupFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  disabled?: boolean;
  required?: boolean;
}

export function BloodGroupField<T extends FieldValues>({
  control,
  name,
  disabled = false,
  required = false,
}: BloodGroupFieldProps<T>) {
  return (
    <SelectField
      control={control}
      name={name}
      label="Blood Group"
      placeholder="Select blood group"
      disabled={disabled}
      required={required}
      options={[...BLOOD_GROUP_OPTIONS]}
    />
  );
}

/**
 * Gender Field
 */
interface GenderFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  disabled?: boolean;
  required?: boolean;
}

export function GenderField<T extends FieldValues>({
  control,
  name,
  disabled = false,
  required = false,
}: GenderFieldProps<T>) {
  return (
    <SelectField
      control={control}
      name={name}
      label="Gender"
      placeholder="Select gender"
      disabled={disabled}
      required={required}
      options={[...GENDER_OPTIONS]}
    />
  );
}
