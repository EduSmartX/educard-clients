/**
 * Pickers for products whose cart line depends on class-specific approved data:
 * ID cards (the grade's approved template) and book sets (an approved class book list).
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { APPROVAL_STATUS, type BookSet, type Class } from '@educard/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/app-config';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { useBookSets, useIdCardTemplates } from '../hooks/use-store';
import { ALL_CLASSES, classLabel, formatCurrency, resolveTemplate } from '../utils/store-format';

interface ClassSelectProps {
  value: string;
  onChange: (classPublicId: string) => void;
  /** Offer an "All classes" choice, stored as ALL_CLASSES. */
  allowAllClasses?: boolean;
  placeholder?: string;
}

/**
 * One entry per grade: EduCard stores templates and book sets per grade, so picking any
 * section of "Class 10" means all of Class 10.
 */
export function ClassSelect({
  value,
  onChange,
  allowAllClasses = false,
  placeholder = 'Choose a class',
}: ClassSelectProps) {
  const { data, isLoading } = useClasses({ page_size: 100 });

  const grades = useMemo(() => {
    const byGrade = new Map<string, Class>();
    for (const section of data?.data ?? []) {
      const grade = section.class_master?.name ?? classLabel(section);
      if (!byGrade.has(grade)) {
        byGrade.set(grade, section);
      }
    }
    return Array.from(byGrade, ([grade, section]) => ({ grade, section }));
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAllClasses && (
          <SelectItem value={ALL_CLASSES}>All classes (school default)</SelectItem>
        )}
        {grades.map(({ grade, section }) => (
          <SelectItem key={section.public_id} value={section.public_id}>
            {grade}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SetupHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-destructive flex items-start gap-2 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        {children}{' '}
        <Link to={ROUTES.STORE.SETUP} className="underline">
          Open Store Setup
        </Link>
      </span>
    </p>
  );
}

interface IdCardClassPickerProps {
  value: string;
  onChange: (classPublicId: string, hasTemplate: boolean) => void;
}

export function IdCardClassPicker({ value, onChange }: IdCardClassPickerProps) {
  const { data: classesResponse, isLoading: classesLoading } = useClasses({ page_size: 100 });
  const { data: templatesResponse, isLoading: templatesLoading } = useIdCardTemplates({
    status: APPROVAL_STATUS.APPROVED,
  });

  const classes = useMemo(() => classesResponse?.data ?? [], [classesResponse]);
  const templates = templatesResponse?.data ?? [];
  const selected = classes.find((section) => section.public_id === value);
  const template = selected ? resolveTemplate(templates, selected) : undefined;

  if (classesLoading || templatesLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Label>
        Class<span className="text-destructive ml-1">*</span>
      </Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const section = classes.find((item) => item.public_id === next);
          onChange(next, Boolean(resolveTemplate(templates, section)));
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose the class these cards are for" />
        </SelectTrigger>
        <SelectContent>
          {classes.map((section) => (
            <SelectItem key={section.public_id} value={section.public_id}>
              {classLabel(section)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && template && (
        <div className="bg-muted/50 flex items-center gap-3 rounded-md border p-2">
          {template.image_url && (
            <img
              src={getMediaUrl(template.image_url)}
              alt={`${template.name} preview`}
              className="h-14 w-22 rounded object-cover"
            />
          )}
          <div className="text-sm">
            <p className="font-medium">{template.name}</p>
            <p className="text-muted-foreground text-xs">
              {template.is_default ? 'School default template' : `${template.class_name} template`}
            </p>
          </div>
        </div>
      )}
      {selected && !template && (
        <SetupHint>No approved ID card template for {classLabel(selected)} yet.</SetupHint>
      )}
    </div>
  );
}

interface BookSetPickerProps {
  value: string;
  onChange: (bookSet: BookSet | undefined) => void;
}

export function BookSetPicker({ value, onChange }: BookSetPickerProps) {
  const { data, isLoading } = useBookSets({ status: APPROVAL_STATUS.APPROVED });
  const bookSets = data?.data ?? [];
  const selected = bookSets.find((set) => set.public_id === value);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }
  if (bookSets.length === 0) {
    return <SetupHint>No approved book sets yet. Request one for a class first.</SetupHint>;
  }

  return (
    <div className="space-y-2">
      <Label>
        Book set<span className="text-destructive ml-1">*</span>
      </Label>
      <Select
        value={value}
        onValueChange={(next) => onChange(bookSets.find((set) => set.public_id === next))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a class book set" />
        </SelectTrigger>
        <SelectContent>
          {bookSets.map((set) => (
            <SelectItem key={set.public_id} value={set.public_id}>
              {set.class_name} — {set.name} ({formatCurrency(set.price)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <ul className="bg-muted/50 max-h-40 space-y-1 overflow-y-auto rounded-md border p-2 text-sm">
          {selected.items.map((book, index) => (
            <li key={`${book.title}-${index}`} className="flex justify-between gap-3">
              <span>
                {book.title}
                {book.quantity > 1 ? ` × ${book.quantity}` : ''}
                {book.subject && <span className="text-muted-foreground"> · {book.subject}</span>}
              </span>
              <span className="text-muted-foreground">{formatCurrency(book.line_total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
