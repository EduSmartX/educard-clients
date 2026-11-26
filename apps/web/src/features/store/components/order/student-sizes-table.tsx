/**
 * Each chosen student's own sizes, with a "set for everyone" row for quick filling.
 */
import { useState } from 'react';
import type { ProductAttribute, StudentListItem } from '@educard/shared';
import { cn } from '@/lib/utils';
import type { StudentSelection } from '../../utils/store-format';
import { CompactValueInput } from './attribute-field';

interface StudentSizesTableProps {
  students: StudentListItem[];
  attributes: ProductAttribute[];
  values: StudentSelection;
  onChange: (values: StudentSelection) => void;
}

export function StudentSizesTable({
  students,
  attributes,
  values,
  onChange,
}: StudentSizesTableProps) {
  const [everyone, setEveryone] = useState<Record<string, string>>({});

  const setValue = (studentId: string, code: string, value: string) => {
    onChange({ ...values, [studentId]: { ...(values[studentId] ?? {}), [code]: value } });
  };

  const setForEveryone = (code: string, value: string) => {
    setEveryone((current) => ({ ...current, [code]: value }));
    const next: StudentSelection = { ...values };
    for (const student of students) {
      next[student.public_id] = { ...(next[student.public_id] ?? {}), [code]: value };
    }
    onChange(next);
  };

  const missing = (studentId: string, attribute: ProductAttribute) =>
    attribute.is_required && !values[studentId]?.[attribute.code];

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="max-h-[28rem] overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 sticky top-0 z-10">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Student</th>
              {attributes.map((attribute) => (
                <th key={attribute.code} className="px-3 py-2 font-medium">
                  {attribute.display_name}
                  {attribute.is_required && <span className="text-destructive ml-0.5">*</span>}
                </th>
              ))}
            </tr>
            {students.length > 1 && (
              <tr className="border-t bg-sky-50/70 dark:bg-sky-950/30">
                <td className="px-3 py-2 text-xs font-medium text-sky-800 dark:text-sky-300">
                  Set for everyone
                </td>
                {attributes.map((attribute) => (
                  <td key={attribute.code} className="px-3 py-1.5">
                    <CompactValueInput
                      attribute={attribute}
                      label={`${attribute.display_name} for everyone`}
                      placeholder="All"
                      value={everyone[attribute.code] ?? ''}
                      onChange={(value) => setForEveryone(attribute.code, value)}
                    />
                  </td>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.public_id} className="hover:bg-muted/30 border-t">
                <td className="px-3 py-2">
                  <p className="font-medium">{student.full_name}</p>
                  {student.roll_number && (
                    <p className="text-muted-foreground text-xs">Roll {student.roll_number}</p>
                  )}
                </td>
                {attributes.map((attribute) => (
                  <td
                    key={attribute.code}
                    className={cn(
                      'px-3 py-1.5',
                      missing(student.public_id, attribute) && 'bg-amber-50/60 dark:bg-amber-950/20'
                    )}
                  >
                    <CompactValueInput
                      attribute={attribute}
                      label={`${attribute.display_name} for ${student.full_name}`}
                      value={values[student.public_id]?.[attribute.code] ?? ''}
                      onChange={(value) => setValue(student.public_id, attribute.code, value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
