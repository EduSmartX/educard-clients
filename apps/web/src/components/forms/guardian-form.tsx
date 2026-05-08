/**
 * Guardian Form Component
 * Reusable guardian/emergency contact information form
 * Used in signup, teacher forms, and other forms requiring guardian data
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FieldNames {
  name?: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface GuardianFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any; // UseFormReturn from react-hook-form
  required?: boolean;
  fieldPrefix?: string; // For nested form fields
  showHeader?: boolean;
  compact?: boolean;
  fieldNames?: FieldNames; // Custom field names mapping
  disabled?: boolean;
  showRelationship?: boolean; // Show relationship field
  title?: string; // Custom title (default: "Guardian Information")
  description?: string; // Custom description
}

export function GuardianForm({
  form,
  required = false,
  fieldPrefix = '',
  showHeader = true,
  compact = false,
  fieldNames,
  disabled = false,
  showRelationship = true,
  title = 'Guardian Information',
  description = 'Primary contact person details',
}: GuardianFormProps) {
  // Default field names
  const defaultFieldNames: Required<FieldNames> = {
    name: 'guardian_name',
    phone: 'guardian_phone',
    email: 'guardian_email',
    relationship: 'guardian_relationship',
  };

  // Merge custom field names with defaults
  const fields = { ...defaultFieldNames, ...fieldNames };

  const getFieldName = (field: keyof FieldNames) => {
    const fieldName = fields[field];
    return fieldPrefix ? `${fieldPrefix}.${fieldName}` : fieldName;
  };

  const inputHeight = compact ? 'h-12' : 'h-14';
  const labelSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div className="space-y-4">
      {/* Section Header */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 text-xl">👤</span>
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-600 mt-0.5">
              {description ||
                (required ? 'Required contact information' : 'Optional contact information')}
            </p>
          </div>
        </div>
      )}

      {/* Guardian Name & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor={getFieldName('name')}
            className={`${labelSize} font-semibold text-gray-700 flex items-center gap-2`}
          >
            <span className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full text-orange-700 text-xs font-bold">
              👤
            </span>
            Contact Name
            {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={getFieldName('name')}
            placeholder="Full name"
            disabled={disabled}
            className={`${inputHeight} text-base border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all`}
            error={form.formState.errors[getFieldName('name')]?.message as string}
            {...form.register(getFieldName('name'))}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor={getFieldName('phone')}
            className={`${labelSize} font-semibold text-gray-700 flex items-center gap-2`}
          >
            <span className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full text-orange-700 text-xs font-bold">
              📞
            </span>
            Contact Phone
            {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={getFieldName('phone')}
            type="tel"
            placeholder="Phone number"
            disabled={disabled}
            className={`${inputHeight} text-base border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all`}
            error={form.formState.errors[getFieldName('phone')]?.message as string}
            {...form.register(getFieldName('phone'))}
          />
        </div>
      </div>

      {/* Guardian Email & Relationship */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor={getFieldName('email')}
            className={`${labelSize} font-semibold text-gray-700 flex items-center gap-2`}
          >
            <span className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full text-orange-700 text-xs font-bold">
              ✉️
            </span>
            Contact Email
            {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={getFieldName('email')}
            type="email"
            placeholder="email@example.com"
            disabled={disabled}
            className={`${inputHeight} text-base border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all`}
            error={form.formState.errors[getFieldName('email')]?.message as string}
            {...form.register(getFieldName('email'))}
          />
        </div>

        {showRelationship && (
          <div className="space-y-2">
            <Label
              htmlFor={getFieldName('relationship')}
              className={`${labelSize} font-semibold text-gray-700 flex items-center gap-2`}
            >
              <span className="flex items-center justify-center w-6 h-6 bg-orange-100 rounded-full text-orange-700 text-xs font-bold">
                🤝
              </span>
              Relationship
              {required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              disabled={disabled}
              onValueChange={(value) => form.setValue(getFieldName('relationship'), value)}
              defaultValue={form.getValues(getFieldName('relationship'))}
            >
              <SelectTrigger
                className={cn(
                  `${inputHeight} text-base border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition-all`,
                  form.formState.errors[getFieldName('relationship')] && 'border-red-500'
                )}
              >
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="relative">Relative</SelectItem>
                <SelectItem value="colleague">Colleague</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors[getFieldName('relationship')] && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors[getFieldName('relationship')]?.message as string}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
