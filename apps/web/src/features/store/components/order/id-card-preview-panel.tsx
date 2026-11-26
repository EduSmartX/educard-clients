/**
 * The class's ID card rendered with a real student's details, front and back.
 */
import type { IdCardTemplate, StudentListItem } from '@educard/shared';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardPreview } from '../card-preview';

interface IdCardPreviewPanelProps {
  template: IdCardTemplate;
  students: StudentListItem[];
  studentId: string;
  onStudentChange: (studentId: string) => void;
}

export function IdCardPreviewPanel({
  template,
  students,
  studentId,
  onStudentChange,
}: IdCardPreviewPanelProps) {
  const orientation = template.design?.orientation ?? 'landscape';
  const portrait = orientation === 'portrait';

  return (
    <div className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Card preview</p>
        <span className="text-muted-foreground truncate text-xs">{template.name}</span>
      </div>

      {template.can_preview ? (
        <div className={portrait ? 'flex justify-center gap-3' : 'space-y-3'}>
          <CardPreview
            path={template.front_preview_url}
            student={studentId || undefined}
            orientation={orientation}
            alt={`Front of ${template.name}`}
          />
          {template.design?.has_back && (
            <CardPreview
              path={template.back_preview_url}
              student={studentId || undefined}
              orientation={orientation}
              alt={`Back of ${template.name}`}
            />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          EduCard is still preparing the print design for this card.
        </p>
      )}

      {template.can_preview && students.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Preview as</Label>
          <Select value={studentId} onValueChange={onStudentChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sample student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.public_id} value={student.public_id}>
                  {student.full_name}
                  {student.roll_number ? ` · Roll ${student.roll_number}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
