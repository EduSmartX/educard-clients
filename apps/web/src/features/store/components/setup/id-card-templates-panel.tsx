/**
 * The school's ID cards: adopt one of EduCard's ready-made designs, or upload the
 * school's own artwork (EduCard builds a print design from it, then approves).
 * Every preview is rendered exactly as the card will print.
 */
import { useState } from 'react';
import { CheckCircle2, IdCard, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  EDITABLE_APPROVAL_STATUSES,
  getErrorMessage,
  type IdCardDesign,
  type IdCardTemplate,
} from '@educard/shared';
import { Badge } from '@/components/ui/badge';
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
import { getMediaUrl } from '@/lib/utils/media-utils';
import {
  useAdoptIdCardDesign,
  useIdCardDesigns,
  useIdCardTemplates,
  useSubmitIdCardTemplate,
  useWithdrawIdCardTemplate,
} from '../../hooks/use-store';
import { ALL_CLASSES, formatDate } from '../../utils/store-format';
import { CardPreview } from '../card-preview';
import { ClassSelect } from '../class-resolved-pickers';
import { ApprovalBadge, ReviewNotes } from './approval-badge';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_SIZE_MB = 5;

function ScopeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>Use for</Label>
      <ClassSelect value={value} onChange={onChange} allowAllClasses />
      <p className="text-muted-foreground text-xs">
        A class design replaces the school default for that class only.
      </p>
    </div>
  );
}

function AdoptDesignDialog({ design, onClose }: { design: IdCardDesign; onClose: () => void }) {
  const [classId, setClassId] = useState(ALL_CLASSES);
  const adopt = useAdoptIdCardDesign();

  const handleAdopt = () => {
    adopt.mutate(
      {
        design_public_id: design.public_id,
        class_public_id: classId === ALL_CLASSES ? undefined : classId,
      },
      {
        onSuccess: () => {
          toast.success(`${design.name} will be used for your ID cards`);
          onClose();
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not use design')),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Use “{design.name}”</DialogTitle>
          <DialogDescription>
            EduCard designs are ready to print, so this takes effect straight away.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-3">
            <CardPreview
              path={design.front_preview_url}
              orientation={design.orientation}
              alt={`${design.name} front`}
              className={design.orientation === 'landscape' ? 'max-w-[220px]' : undefined}
            />
            {design.has_back && (
              <CardPreview
                path={design.back_preview_url}
                orientation={design.orientation}
                alt={`${design.name} back`}
                className={design.orientation === 'landscape' ? 'max-w-[220px]' : undefined}
              />
            )}
          </div>
          <ScopeField value={classId} onChange={setClassId} />
        </div>
        <DialogFooter>
          <Button onClick={handleAdopt} disabled={adopt.isPending}>
            {adopt.isPending ? 'Saving…' : 'Use this design'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadTemplateDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState(ALL_CLASSES);
  const [file, setFile] = useState<File | null>(null);
  const submit = useSubmitIdCardTemplate();

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
          toast.success('Sent to EduCard. They will prepare the print design and approve it.');
          onClose();
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Upload failed')),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload your own ID card design</DialogTitle>
          <DialogDescription>
            EduCard turns your artwork into a print design that fills in each student&apos;s photo,
            name, class and blood group, then approves it.
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
          <ScopeField value={classId} onChange={setClassId} />
          <div className="space-y-2">
            <Label htmlFor="template-file">
              Artwork (PNG, JPG or WebP, up to {MAX_SIZE_MB} MB)
            </Label>
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
            {submit.isPending ? 'Uploading…' : 'Send to EduCard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ template }: { template: IdCardTemplate }) {
  const withdraw = useWithdrawIdCardTemplate();
  const editable = EDITABLE_APPROVAL_STATUSES.includes(template.status);
  const orientation = template.design?.orientation ?? 'landscape';

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted/50 flex min-h-36 items-center justify-center gap-2 p-3">
        {template.can_preview ? (
          <>
            <CardPreview
              path={template.front_preview_url}
              orientation={orientation}
              alt={`${template.name} front`}
            />
            {template.back_preview_url && (
              <CardPreview
                path={template.back_preview_url}
                orientation={orientation}
                alt={`${template.name} back`}
              />
            )}
          </>
        ) : template.image_url ? (
          <img
            src={getMediaUrl(template.image_url)}
            alt={`${template.name} artwork`}
            className="max-h-36 w-full object-contain"
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
        {template.design?.is_library && (
          <Badge variant="outline" className="font-normal">
            EduCard design
          </Badge>
        )}
        {!template.can_preview && template.status === 'pending' && (
          <p className="text-muted-foreground text-xs">
            EduCard is preparing the print design from your artwork.
          </p>
        )}
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

function DesignLibrary({ onPick }: { onPick: (design: IdCardDesign) => void }) {
  const { data, isLoading } = useIdCardDesigns();
  const designs = data?.data ?? [];

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (designs.length === 0) {
    return <p className="text-muted-foreground text-sm">No ready-made designs yet.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {designs.map((design) => (
        <Card key={design.public_id} className="overflow-hidden">
          <div className="bg-muted/50 flex items-center justify-center gap-2 p-3">
            <CardPreview
              path={design.front_preview_url}
              orientation={design.orientation}
              alt={`${design.name} front`}
            />
            {design.has_back && (
              <CardPreview
                path={design.back_preview_url}
                orientation={design.orientation}
                alt={`${design.name} back`}
              />
            )}
          </div>
          <CardContent className="flex items-start justify-between gap-3 pt-4">
            <div>
              <p className="font-medium">{design.name}</p>
              <p className="text-muted-foreground text-xs">{design.description}</p>
            </div>
            <Button size="sm" onClick={() => onPick(design)}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Use
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function IdCardTemplatesPanel() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [adopting, setAdopting] = useState<IdCardDesign | null>(null);
  const { data, isLoading } = useIdCardTemplates();
  const templates = data?.data ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Your ID cards</h3>
            <p className="text-muted-foreground max-w-2xl text-sm">
              When you order ID cards for a class, its design is filled in with each student&apos;s
              photo, name, class and blood group, and printed by EduCard.
            </p>
          </div>
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1 h-4 w-4" />
            Upload your own
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : templates.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <IdCard className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
            <p className="mt-2 text-sm font-medium">No ID card design yet</p>
            <p className="text-muted-foreground text-sm">
              Pick one of EduCard&apos;s designs below, or upload your own.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.public_id} template={template} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">EduCard designs</h3>
          <p className="text-muted-foreground text-sm">
            Ready to print — shown with your school&apos;s name and a sample student.
          </p>
        </div>
        <DesignLibrary onPick={setAdopting} />
      </section>

      {uploadOpen && <UploadTemplateDialog onClose={() => setUploadOpen(false)} />}
      {adopting && <AdoptDesignDialog design={adopting} onClose={() => setAdopting(null)} />}
    </div>
  );
}
