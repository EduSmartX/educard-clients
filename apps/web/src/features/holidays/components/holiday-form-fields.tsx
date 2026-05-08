/**
 * Holiday Form Fields Component
 * Reusable form fields for holiday creation and editing
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { FormPlaceholders } from '@/constants';
import type { HolidayType } from '../types';
import { formatHolidayType } from '../utils/holiday-utils';
import { parseISO } from 'date-fns';

interface HolidayFormFieldsProps {
  startDate: string;
  endDate: string;
  holidayType: Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>;
  description: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onHolidayTypeChange: (value: Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>) => void;
  onDescriptionChange: (value: string) => void;
  errors?: {
    start_date?: string;
    end_date?: string;
    holiday_type?: string;
    description?: string;
  };
}

const HOLIDAY_TYPES: Array<Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>> = [
  'NATIONAL_HOLIDAY',
  'FESTIVAL',
  'ORGANIZATION_HOLIDAY',
  'SECOND_SATURDAY',
  'OTHER',
];

export function HolidayFormFields({
  startDate,
  endDate,
  holidayType,
  description,
  onStartDateChange,
  onEndDateChange,
  onHolidayTypeChange,
  onDescriptionChange,
  errors,
}: HolidayFormFieldsProps) {
  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onStartDateChange(`${year}-${month}-${day}`);
    } else {
      onStartDateChange('');
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onEndDateChange(`${year}-${month}-${day}`);
    } else {
      onEndDateChange('');
    }
  };

  const startDateValue = startDate ? parseISO(startDate) : null;
  const endDateValue = endDate ? parseISO(endDate) : null;
  const minEndDate = startDate ? parseISO(startDate) : undefined;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label className="text-base font-semibold text-gray-900 w-32 flex-shrink-0">
            Start Date <span className="text-red-500">*</span>
          </Label>
          <div className="flex-1">
            <DatePicker
              value={startDateValue}
              onChange={handleStartDateChange}
              placeholder={FormPlaceholders.SELECT_START_DATE}
              className={errors?.start_date ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
          </div>
        </div>
        {errors?.start_date && (
          <p className="text-sm text-red-600 font-medium ml-36">{errors.start_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label className="text-base font-semibold text-gray-900 w-32 flex-shrink-0">
            End Date <span className="text-sm font-normal text-gray-500">(Optional)</span>
          </Label>
          <div className="flex-1">
            <DatePicker
              value={endDateValue}
              onChange={handleEndDateChange}
              placeholder={FormPlaceholders.SELECT_END_DATE}
              minDate={minEndDate}
              className={errors?.end_date ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600 ml-36">Leave empty for single-day holiday</p>
        {errors?.end_date && (
          <p className="text-sm text-red-600 font-medium ml-36">{errors.end_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-900">
          Holiday Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={holidayType}
          onValueChange={(value) =>
            onHolidayTypeChange(value as Exclude<HolidayType, 'SUNDAY' | 'SATURDAY'>)
          }
        >
          <SelectTrigger
            className={`h-12 text-base border-gray-300 ${
              errors?.holiday_type
                ? 'border-red-500 focus:ring-red-500'
                : 'focus:ring-2 focus:ring-blue-500'
            }`}
          >
            <SelectValue placeholder={FormPlaceholders.SELECT_HOLIDAY_TYPE} />
          </SelectTrigger>
          <SelectContent>
            {HOLIDAY_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="text-base">
                {formatHolidayType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.holiday_type && (
          <p className="text-sm text-red-600 font-medium">{errors.holiday_type}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-900">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={FormPlaceholders.HOLIDAY_DESCRIPTION_EXAMPLE}
          rows={4}
          maxLength={255}
          className={`text-base resize-none border-gray-300 ${
            errors?.description
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'focus-visible:ring-2 focus-visible:ring-blue-500'
          }`}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{description.length}/255 characters</p>
          {errors?.description && (
            <p className="text-sm text-red-600 font-medium">{errors.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
