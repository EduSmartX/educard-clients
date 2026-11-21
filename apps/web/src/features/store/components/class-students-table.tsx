/**
 * Students of one class section, for ordering per person: tick the students who get an
 * item (one ID card each) and, for uniform-style products, enter each one's sizes.
 */
import { useMemo, useState } from 'react';
import { Eye, ImageOff } from 'lucide-react';
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  type ProductAttribute,
  type StudentListItem,
} from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStudents } from '@/features/students/hooks/use-students';
import type { StudentSelection } from '../utils/store-format';

interface ValueInputProps {
  attribute: ProductAttribute;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

function ValueInput({ attribute, value, onChange, placeholder, label }: ValueInputProps) {
  if (attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-24" aria-label={label}>
          <SelectValue placeholder={placeholder ?? 'Pick'} />
        </SelectTrigger>
        <SelectContent>
          {attribute.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.display_label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      className="h-8 min-w-20"
      aria-label={label}
      placeholder={placeholder}
      type={attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER ? 'number' : 'text'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

interface ClassStudentsTableProps {
  classPublicId: string;
  selection: StudentSelection;
  onChange: (selection: StudentSelection) => void;
  /** Per-student columns, e.g. shirt size and waist. Empty for ID cards. */
  attributes?: ProductAttribute[];
  /** ID cards: show which students have no profile photo, and a preview button. */
  showPhotoStatus?: boolean;
  previewStudent?: string;
  onPreview?: (student: StudentListItem) => void;
}

export function ClassStudentsTable({
  classPublicId,
  selection,
  onChange,
  attributes = [],
  showPhotoStatus = false,
  previewStudent,
  onPreview,
}: ClassStudentsTableProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useStudents({
    class_assigned__public_id: classPublicId,
    page_size: 100,
    embed_images: false,
  });
  const students = useMemo(() => data?.data ?? [], [data]);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return students;
    }
    return students.filter((student) =>
      [student.full_name, student.roll_number, student.admission_number]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [students, search]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (students.length === 0) {
    return (
      <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
        No students in this class yet.
      </p>
    );
  }

  const selectedCount = Object.keys(selection).length;
  const allVisibleSelected = visible.every((student) => student.public_id in selection);

  const toggle = (studentId: string, checked: boolean) => {
    const next = { ...selection };
    if (checked) {
      next[studentId] = next[studentId] ?? {};
    } else {
      delete next[studentId];
    }
    onChange(next);
  };

  const toggleAllVisible = (checked: boolean) => {
    const next = { ...selection };
    for (const student of visible) {
      if (checked) {
        next[student.public_id] = next[student.public_id] ?? {};
      } else {
        delete next[student.public_id];
      }
    }
    onChange(next);
  };

  const setValue = (studentId: string, code: string, value: string) => {
    onChange({ ...selection, [studentId]: { ...(selection[studentId] ?? {}), [code]: value } });
  };

  /** Fill one value for every selected student, e.g. the same tie for everyone. */
  const fillSelected = (code: string, value: string) => {
    const next: StudentSelection = {};
    for (const [studentId, values] of Object.entries(selection)) {
      next[studentId] = { ...values, [code]: value };
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search name or roll number"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-8"
        />
        <span className="text-muted-foreground shrink-0 text-sm">
          {selectedCount} of {students.length} selected
        </span>
      </div>

      <div className="max-h-72 overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 sticky top-0 z-10">
            <tr className="text-left">
              <th className="w-8 p-2">
                <Checkbox
                  checked={visible.length > 0 && allVisibleSelected}
                  onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                  aria-label="Select all students"
                />
              </th>
              <th className="p-2 font-medium">Student</th>
              {attributes.map((attribute) => (
                <th key={attribute.code} className="p-2 font-medium">
                  {attribute.display_name}
                  {attribute.is_required && <span className="text-destructive ml-0.5">*</span>}
                </th>
              ))}
              {onPreview && <th className="w-10 p-2" />}
            </tr>
            {attributes.length > 0 && selectedCount > 1 && (
              <tr className="border-t">
                <td />
                <td className="text-muted-foreground p-2 text-xs">Set for all selected</td>
                {attributes.map((attribute) => (
                  <td key={attribute.code} className="p-1">
                    <FillAllInput
                      attribute={attribute}
                      onFill={(value) => fillSelected(attribute.code, value)}
                    />
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {visible.map((student) => {
              const selected = student.public_id in selection;
              const values = selection[student.public_id] ?? {};
              const missingPhoto =
                showPhotoStatus && !student.profile_photo_url && !student.profile_photo_thumbnail;
              return (
                <tr
                  key={student.public_id}
                  className={cn(
                    'border-t',
                    selected && 'bg-primary/5',
                    previewStudent === student.public_id && 'bg-primary/10'
                  )}
                >
                  <td className="p-2">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => toggle(student.public_id, checked === true)}
                      aria-label={`Select ${student.full_name}`}
                    />
                  </td>
                  <td className="p-2">
                    <p className="font-medium">{student.full_name}</p>
                    <p className="text-muted-foreground flex items-center gap-2 text-xs">
                      {student.roll_number && <span>Roll {student.roll_number}</span>}
                      {missingPhoto && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <ImageOff className="h-3 w-3" aria-hidden />
                          No photo
                        </span>
                      )}
                    </p>
                  </td>
                  {attributes.map((attribute) => (
                    <td key={attribute.code} className="p-1">
                      {selected && (
                        <ValueInput
                          attribute={attribute}
                          label={`${attribute.display_name} for ${student.full_name}`}
                          value={values[attribute.code] ?? ''}
                          onChange={(value) => setValue(student.public_id, attribute.code, value)}
                        />
                      )}
                    </td>
                  ))}
                  {onPreview && (
                    <td className="p-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`Preview ${student.full_name}'s card`}
                        onClick={() => onPreview(student)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data?.pagination && data.pagination.count > students.length && (
        <p className="text-muted-foreground text-xs">
          Showing the first {students.length} of {data.pagination.count} students. Add another line
          for the rest.
        </p>
      )}
    </div>
  );
}

function FillAllInput({
  attribute,
  onFill,
}: {
  attribute: ProductAttribute;
  onFill: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <ValueInput
      attribute={attribute}
      label={`${attribute.display_name} for all selected students`}
      placeholder="All"
      value={value}
      onChange={(next) => {
        setValue(next);
        onFill(next);
      }}
    />
  );
}
