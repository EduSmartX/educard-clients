/**
 * The school's ID card designs. A class template wins over the school default; uploads
 * wait for EduCard approval before they can be printed.
 */
import { useState } from 'react';
import { IdCard, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { EDITABLE_APPROVAL_STATUSES, getErrorMessage, type IdCardTemplate } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useIdCardTemplates,
  useSubmitIdCardTemplate,
  useWithdrawIdCardTemplate,
} from '../../hooks/use-store';
import { ALL_CLASSES, formatDate } from '../../utils/store-format';
import { ClassSelect } from '../class-resolved-pickers';
import { ApprovalBadge, ReviewNotes } from './approval-badge';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_SIZE_MB = 5;

function UploadTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState(ALL_CLASSES);
  const [file, setFile] = useState<File | null>(null);
  const submit = useSubmitIdCardTemplate();

  const reset = () => {
    setName('');
    setClassId(ALL_CLASSES);
    setFile(null);
  };

  const handleFile = (next: File | undefined) => {
    if (next && next.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Choose an image under ${MAX_SIZE_MB} MB`);
      return;
    }
    setFile(next ?? null);
  };

  const handleSubmit = () => {
    if (!file) {
      return;
    }
    submit.mutate(
      {
        payload: {
          name: name.trim(),
          class_public_id: classId === ALL_CLASSES ? undefined : classId,
        },
        image: file,
      },
      {
        onSuccess: () => {
          toast.success('Template sent to EduCard for approval');
          reset();
          onOpenChange(false);
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Upload failed')),
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload ID card template</DialogTitle>
          <DialogDescription>
            EduCard reviews every design before printing. You can order once it is approved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              maxLength={150}
              placeholder="e.g. 2026 Primary design"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Applies to</Label>
            <ClassSelect value={classId} onChange={setClassId} allowAllClasses />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-file">Design (PNG, JPG or WebP, up to {MAX_SIZE_MB} MB)</Label>
            <Input
              id="template-file"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name.trim() || !file || submit.isPending}>
            {submit.isPending ? 'Uploading…' : 'Submit for approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ template }: { template: IdCardTemplate }) {
  const withdraw = useWithdrawIdCardTemplate();
  const editable = EDITABLE_APPROVAL_STATUSES.includes(template.status);

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted flex h-36 items-center justify-center">
        {template.image_url ? (
          <img
            src={template.image_url}
            alt={`${template.name} design`}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <IdCard className="text-muted-foreground h-10 w-10" aria-hidden />
        )}
      </div>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="leading-tight font-medium">{template.name}</p>
            <p className="text-muted-foreground text-xs">
              {template.is_default ? 'All classes (school default)' : template.class_name}
              {' · '}
              {formatDate(template.submitted_at)}
            </p>
          </div>
          <ApprovalBadge status={template.status} />
        </div>
        <ReviewNotes status={template.status} notes={template.review_notes} />
        {editable && (
          <Button
            size="sm"
            variant="outline"
            disabled={withdraw.isPending}
            onClick={() =>
              withdraw.mutate(template.public_id, {
                onSuccess: () => toast.success('Template withdrawn'),
                onError: (error: unknown) => toast.error(getErrorMessage(error)),
              })
            }
          >
            Withdraw
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function IdCardTemplatesPanel() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading } = useIdCardTemplates();
  const templates = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground max-w-2xl text-sm">
          Upload a school default, then add a design for any class that looks different. When you
          order ID cards for a class, its approved design is used automatically.
        </p>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-1 h-4 w-4" />
          Upload template
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <IdCard className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
          <p className="mt-2 text-sm font-medium">No ID card templates yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.public_id} template={template} />
          ))}
        </div>
      )}

      <UploadTemplateDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
