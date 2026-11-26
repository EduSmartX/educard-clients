/**
 * The school's ID cards: adopt one of EduCard's ready-made designs, or upload the
 * school's own artwork (EduCard builds a print design from it, then approves).
 * Every preview is rendered exactly as the card will print.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, IdCard, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  APPROVAL_STATUS,
  EDITABLE_APPROVAL_STATUSES,
  PRODUCT_KIND,
  getErrorMessage,
  type IdCardDesign,
  type IdCardTemplate,
} from '@educard/shared';
import { InfoPoints } from '@/components/common';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/app-config';
import { getMediaUrl } from '@/lib/utils/media-utils';
import {
  useAdoptIdCardDesign,
  useCatalog,
  useIdCardDesigns,
  useIdCardTemplates,
  useWithdrawIdCardTemplate,
} from '../../hooks/use-store';
import { formatDate } from '../../utils/store-format';
import { CardSidesCarousel } from '../card-sides-carousel';
import {
  ClassScopePicker,
  WHOLE_SCHOOL_SCOPE,
  isScopeComplete,
  scopeClassIds,
  type ClassScope,
} from '../class-scope-picker';
import { OptionPill } from '../order/order-step';
import { ApprovalBadge, ReviewNotes } from './approval-badge';

function ScopeField({ value, onChange }: { value: ClassScope; onChange: (v: ClassScope) => void }) {
  return (
    <div className="space-y-2">
      <Label>Use for</Label>
      <ClassScopePicker
        value={value}
        onChange={onChange}
        wholeSchoolLabel="Whole school (default)"
      />
      <InfoPoints
        tone="muted"
        items={[
          'A class design replaces the school default for those classes only.',
          'Pick several classes to give them all the same design.',
        ]}
      />
    </div>
  );
}

function AdoptDesignDialog({
  design,
  productId,
  onClose,
}: {
  design: IdCardDesign;
  productId: string;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<ClassScope>(WHOLE_SCHOOL_SCOPE);
  const adopt = useAdoptIdCardDesign();

  const handleAdopt = () => {
    adopt.mutate(
      {
        design_public_id: design.public_id,
        class_public_ids: scopeClassIds(scope),
        product_public_id: productId || undefined,
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
          <CardSidesCarousel
            frontPath={design.front_preview_url}
            backPath={design.has_back ? design.back_preview_url : ''}
            orientation={design.orientation}
            alt={design.name}
          />
          <ScopeField value={scope} onChange={setScope} />
        </div>
        <DialogFooter>
          <Button onClick={handleAdopt} disabled={!isScopeComplete(scope) || adopt.isPending}>
            {adopt.isPending ? 'Saving…' : 'Use this design'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  showProduct,
}: {
  template: IdCardTemplate;
  /** Name the product on the card; only useful when the school has several ID card products. */
  showProduct: boolean;
}) {
  const withdraw = useWithdrawIdCardTemplate();
  const editable = EDITABLE_APPROVAL_STATUSES.includes(template.status);
  const orientation = template.design?.orientation ?? 'landscape';

  return (
    <Card className="overflow-hidden">
      {template.can_preview ? (
        <CardSidesCarousel
          frontPath={template.front_preview_url}
          backPath={template.back_preview_url}
          orientation={orientation}
          alt={template.name}
          className="rounded-none"
        />
      ) : (
        <div className="bg-muted/50 flex min-h-36 items-center justify-center p-3">
          {template.image_url ? (
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
      )}
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
        <div className="flex flex-wrap gap-1.5">
          {template.design?.is_library && (
            <Badge variant="outline" className="font-normal">
              EduCard design
            </Badge>
          )}
          {showProduct && (
            <Badge variant="secondary" className="bg-sky-100 font-normal text-sky-800">
              {template.product_name || 'Any ID card product'}
            </Badge>
          )}
        </div>
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

function DesignLibrary({
  productId,
  inUse,
  onPick,
}: {
  productId: string;
  /** Public IDs of designs the school already uses for this product. */
  inUse: Set<string>;
  onPick: (design: IdCardDesign) => void;
}) {
  const { data, isLoading } = useIdCardDesigns(productId || undefined);
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
          <CardSidesCarousel
            frontPath={design.front_preview_url}
            backPath={design.has_back ? design.back_preview_url : ''}
            orientation={design.orientation}
            alt={design.name}
            className="rounded-none"
          />
          <CardContent className="space-y-3 pt-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{design.name}</p>
                {inUse.has(design.public_id) && (
                  <Badge className="bg-emerald-100 font-medium text-emerald-800 hover:bg-emerald-100">
                    In use
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-xs">{design.description}</p>
            </div>
            <Button
              size="sm"
              variant={inUse.has(design.public_id) ? 'outline' : 'default'}
              className="w-full"
              onClick={() => onPick(design)}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {inUse.has(design.public_id) ? 'Use for other classes' : 'Use this design'}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface IdCardTemplatesPanelProps {
  /** Show only this ID card product's cards (used on that product's setup page). */
  fixedProductId?: string;
}

export function IdCardTemplatesPanel({ fixedProductId }: IdCardTemplatesPanelProps = {}) {
  const navigate = useNavigate();
  const [adopting, setAdopting] = useState<IdCardDesign | null>(null);
  const [pickedProduct, setPickedProduct] = useState('');
  const { data, isLoading } = useIdCardTemplates();
  const { data: catalog } = useCatalog({ page_size: 100 });

  // A school can sell several ID card products (Student, Teacher...); each has its own cards.
  const idCardProducts = fixedProductId
    ? []
    : (catalog?.data ?? []).filter((product) => product.kind === PRODUCT_KIND.ID_CARD);
  const productId = fixedProductId || pickedProduct || idCardProducts[0]?.public_id || '';
  const templates = (data?.data ?? []).filter(
    // Cards made for this product, plus general ones that work for any ID card product;
    // replaced (superseded) cards are history, not shown.
    (template) =>
      template.status !== APPROVAL_STATUS.SUPERSEDED &&
      (!productId || !template.product_public_id || template.product_public_id === productId)
  );

  // One main entry per product: its approved school-wide card (the product's own beats a
  // general one). Everything else (class cards, pending, rejected) sits underneath.
  const current =
    templates.find(
      (item) =>
        item.is_default &&
        item.status === APPROVAL_STATUS.APPROVED &&
        item.product_public_id === productId
    ) ??
    templates.find((item) => item.is_default && item.status === APPROVAL_STATUS.APPROVED) ??
    null;
  const others = templates.filter((item) => item !== current);
  const inUse = new Set(
    templates
      .filter((item) => item.status === APPROVAL_STATUS.APPROVED && item.design)
      .map((item) => item.design?.public_id ?? '')
  );

  return (
    <div className="space-y-8">
      {idCardProducts.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">ID card product</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ID card product">
            {idCardProducts.map((product) => (
              <OptionPill
                key={product.public_id}
                selected={product.public_id === productId}
                onClick={() => setPickedProduct(product.public_id)}
              >
                {product.name}
              </OptionPill>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Each ID card product has its own cards and designs.
          </p>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Your ID cards</h3>
            <p className="text-muted-foreground max-w-2xl text-sm">
              When you order ID cards for a class, its design is filled in with each student&apos;s
              photo, name, class and blood group, and printed by EduCard.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                productId
                  ? `${ROUTES.STORE.ID_CARD_UPLOAD}?product=${encodeURIComponent(productId)}`
                  : ROUTES.STORE.ID_CARD_UPLOAD
              )
            }
          >
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
          <div className="space-y-6">
            {current && (
              <div className="max-w-md space-y-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Current card{idCardProducts.length > 1 ? ' for this product' : ''}
                </p>
                <TemplateCard template={current} showProduct={idCardProducts.length > 1} />
              </div>
            )}
            {others.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {current ? 'Class cards and cards in review' : 'Cards in review'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((template) => (
                    <TemplateCard
                      key={template.public_id}
                      template={template}
                      showProduct={idCardProducts.length > 1}
                    />
                  ))}
                </div>
              </div>
            )}
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
        <DesignLibrary productId={productId} inUse={inUse} onPick={setAdopting} />
      </section>

      {adopting && (
        <AdoptDesignDialog
          design={adopting}
          productId={productId}
          onClose={() => setAdopting(null)}
        />
      )}
    </div>
  );
}
