/**
 * Send the school's own ID card artwork to EduCard, who turn it into a print design that
 * fills in each student's photo, name, class and so on, and approve it.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileImage,
  ImagePlus,
  Palette,
  Send,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { PRODUCT_KIND, getErrorMessage } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTES } from '@/constants/app-config';
import { cn } from '@/lib/utils';
import {
  ClassScopePicker,
  WHOLE_SCHOOL_SCOPE,
  isScopeComplete,
  scopeClassIds,
  type ClassScope,
} from '../components/class-scope-picker';
import { OptionPill, OrderStep } from '../components/order/order-step';
import { useCatalog, useSubmitIdCardTemplate } from '../hooks/use-store';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE_MB = 5;

function formatSize(bytes: number): string {
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface ArtworkDropProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

/** Click or drag an image onto the box; shows a preview once chosen. */
function ArtworkDrop({ file, onChange }: ArtworkDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (next: File | undefined) => {
    if (!next) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(next.type)) {
      toast.error('Choose a PNG, JPG or WebP image');
      return;
    }
    if (next.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Choose an image under ${MAX_SIZE_MB} MB`);
      return;
    }
    onChange(next);
  };

  if (file) {
    return (
      <div className="space-y-3">
        <div className="bg-muted flex items-center justify-center rounded-xl border p-4">
          <img
            src={previewUrl}
            alt="Your artwork"
            className="max-h-72 rounded-lg object-contain shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <FileImage className="h-4 w-4 shrink-0 text-sky-600" aria-hidden />
            <span className="truncate font-medium">{file.name}</span>
            <span className="text-muted-foreground shrink-0">{formatSize(file.size)}</span>
          </span>
          <span className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="mr-1 h-4 w-4" />
              Change
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(event) => accept(event.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
            : 'border-sky-200 hover:border-sky-400 hover:bg-sky-50/50'
        )}
      >
        <span className="rounded-full bg-sky-100 p-3 text-sky-700">
          <UploadCloud className="h-7 w-7" aria-hidden />
        </span>
        <span className="font-medium">Drop your card artwork here, or click to choose</span>
        <span className="text-muted-foreground text-sm">
          PNG, JPG or WebP, up to {MAX_SIZE_MB} MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(event) => accept(event.target.files?.[0])}
      />
    </>
  );
}

export default function StoreIdCardUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: catalog } = useCatalog({ page_size: 100 });
  const submit = useSubmitIdCardTemplate();

  const [name, setName] = useState('');
  const [scope, setScope] = useState<ClassScope>(WHOLE_SCHOOL_SCOPE);
  const [file, setFile] = useState<File | null>(null);
  const [pickedProduct, setPickedProduct] = useState(searchParams.get('product') ?? '');

  // A school can sell several ID card products; the card is made for the one chosen.
  const products = (catalog?.data ?? []).filter((product) => product.kind === PRODUCT_KIND.ID_CARD);
  const productId = pickedProduct || products[0]?.public_id || '';

  const backToSetup = `${ROUTES.STORE.SETUP}?tab=templates`;
  const missing = !name.trim()
    ? 'Give the design a name.'
    : !isScopeComplete(scope)
      ? 'Choose the classes, or the whole school.'
      : !file
        ? 'Add your artwork.'
        : '';

  const handleSubmit = () => {
    if (!file) {
      return;
    }
    submit.mutate(
      {
        payload: {
          name: name.trim(),
          class_public_ids: scopeClassIds(scope),
          product_public_id: productId || undefined,
        },
        image: file,
      },
      {
        onSuccess: () => {
          toast.success('Sent to EduCard. They will prepare the print design and approve it.');
          navigate(backToSetup);
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Upload failed')),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to={backToSetup}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to ID card templates
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <span className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 p-3 text-white shadow">
            <Palette className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Upload your own ID card design</h1>
            <p className="text-muted-foreground max-w-2xl">
              Send your card artwork. EduCard turns it into a print design that fills in each
              student&apos;s photo, name, class and blood group, then approves it.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <OrderStep
            step={1}
            title="Name your design"
            description="So you can tell your cards apart later."
            complete={Boolean(name.trim())}
          >
            <div className="space-y-2">
              <Label htmlFor="template-name">Design name</Label>
              <Input
                id="template-name"
                maxLength={150}
                placeholder="e.g. 2026 Primary design"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {products.length > 1 && (
              <div className="space-y-2">
                <Label>For which ID card product?</Label>
                <div
                  className="flex flex-wrap gap-2"
                  role="radiogroup"
                  aria-label="ID card product"
                >
                  {products.map((product) => (
                    <OptionPill
                      key={product.public_id}
                      selected={product.public_id === productId}
                      onClick={() => setPickedProduct(product.public_id)}
                    >
                      {product.name}
                    </OptionPill>
                  ))}
                </div>
              </div>
            )}
          </OrderStep>

          <OrderStep
            step={2}
            title="Where should it be used?"
            description="A class design replaces the school default for those classes only. Pick several classes to give them all the same design."
            complete={isScopeComplete(scope)}
          >
            <ClassScopePicker
              value={scope}
              onChange={setScope}
              wholeSchoolLabel="Whole school (default)"
            />
          </OrderStep>

          <OrderStep
            step={3}
            title="Add your artwork"
            description="The card background: your colours, logo and layout. Student details are added for you."
            complete={Boolean(file)}
          >
            <ArtworkDrop file={file} onChange={setFile} />
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>Landscape card: 1012 × 638 px. Portrait card: 638 × 1012 px (300 DPI).</li>
              <li>Leave space for the student&apos;s photo and details; EduCard places them.</li>
              <li>Keep important parts away from the edges, which can be trimmed in printing.</li>
            </ul>
          </OrderStep>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
            <div className="border-b bg-gradient-to-r from-sky-50 to-indigo-50 p-4 dark:from-sky-950/40 dark:to-indigo-950/40">
              <p className="font-semibold">What happens next</p>
            </div>
            <ol className="space-y-3 p-4 text-sm">
              {[
                'You send your artwork to EduCard.',
                'EduCard builds the print design and checks it with sample students.',
                'It is approved and appears in your ID card templates, ready to order.',
              ].map((text, index) => (
                <li key={text} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                    {index + 1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <div className="space-y-2 border-t p-4">
              {missing ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  {missing}
                </p>
              ) : (
                <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  Ready to send.
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                disabled={Boolean(missing) || submit.isPending}
                onClick={handleSubmit}
              >
                <Send className="mr-2 h-4 w-4" />
                {submit.isPending ? 'Sending…' : 'Send to EduCard'}
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <Link to={backToSetup}>Cancel</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
