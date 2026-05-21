/**
 * Holiday Form Fields Component
 * Reusable form fields for holiday creation and editing
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import { FormPlaceholders } from '@/constants';
import { formatHolidayType } from '../utils/holiday-utils';
import { parseISO } from 'date-fns';

type SupportedHolidayType =
  | 'NATIONAL_HOLIDAY'
  | 'FESTIVAL'
  | 'ORGANIZATION_HOLIDAY'
  | 'SECOND_SATURDAY'
  | 'OTHER';

interface HolidayFormFieldsProps {
  startDate: string;
  endDate: string;
  holidayType: SupportedHolidayType;
  description: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onHolidayTypeChange: (value: SupportedHolidayType) => void;
  onDescriptionChange: (value: string) => void;
  errors?: {
    start_date?: string;
    end_date?: string;
    holiday_type?: string;
    description?: string;
  };
}

const HOLIDAY_TYPES: SupportedHolidayType[] = [
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
          <Label className="w-32 flex-shrink-0 text-base font-semibold text-gray-900">
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
          <p className="ml-36 text-sm font-medium text-red-600">{errors.start_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <Label className="w-32 flex-shrink-0 text-base font-semibold text-gray-900">
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
        <p className="ml-36 text-sm text-gray-600">Leave empty for single-day holiday</p>
        {errors?.end_date && (
          <p className="ml-36 text-sm font-medium text-red-600">{errors.end_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold text-gray-900">
          Holiday Type <span className="text-red-500">*</span>
        </Label>
        <SearchableSelect
          options={HOLIDAY_TYPES.map((type) => ({
            value: type,
            label: formatHolidayType(type),
          }))}
          value={holidayType}
          onValueChange={(value: string) => onHolidayTypeChange(value as SupportedHolidayType)}
          placeholder="Select holiday type"
          className={`h-12 border-gray-300 text-base ${
            errors?.holiday_type
              ? 'border-red-500 focus:ring-red-500'
              : 'focus:ring-2 focus:ring-blue-500'
          }`}
        />
        {errors?.holiday_type && (
          <p className="text-sm font-medium text-red-600">{errors.holiday_type}</p>
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
          placeholder="Enter holiday description"
          rows={4}
          maxLength={255}
          className={`resize-none border-gray-300 text-base ${
            errors?.description
              ? 'border-red-500 focus-visible:ring-red-500'
              : 'focus-visible:ring-2 focus-visible:ring-blue-500'
          }`}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">{description.length}/255 characters</p>
          {errors?.description && (
            <p className="text-sm font-medium text-red-600">{errors.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
