/**
 * Set up one product for the school, then publish it.
 *
 * EduCard's master product is shown until the school customises it. Every mandatory
 * field EduCard declared must be filled before "Save & publish" is enabled; only
 * published products can be ordered.
 */
import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  ImagePlus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PRODUCT_KIND,
  STORE_UI_MANAGED_KEYS,
  getErrorMessage,
  type CatalogProduct,
  type ProductAttribute,
  type ProductClassLook,
} from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/app-config';
import { cn } from '@/lib/utils';
import {
  ClassScopePicker,
  WHOLE_SCHOOL_SCOPE,
  isScopeComplete,
  scopeClassIds,
  useGradeOptions,
  type ClassScope,
} from '../components/class-scope-picker';
import { AttributeField } from '../components/order/attribute-field';
import {
  CustomFeaturesEditor,
  customFeaturesPayload,
  type CustomFeatureRow,
} from '../components/order/custom-features-editor';
import { ProductImageCarousel } from '../components/product-image-carousel';
import { OptionPill, OrderStep } from '../components/order/order-step';
import { ProductPhotoGallery } from '../components/setup/product-photo-gallery';
import {
  useAddProductPhoto,
  useCatalog,
  useProductLooks,
  useSaveClassLook,
  useSaveProductCustomization,
  useUnpublishProduct,
} from '../hooks/use-store';
import { formatCurrency, formatDate, organizationScopedAttributes } from '../utils/store-format';

const MAX_UPLOAD_MB = 5;

function StatusBadge({ product }: { product: CatalogProduct }) {
  return product.is_published ? (
    <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Published
    </Badge>
  ) : (
    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
      Draft
    </Badge>
  );
}

/** Class differences: only what differs from the school; blank = same as school. */
function OverrideInputs({
  attributes,
  values,
  school,
  onChange,
}: {
  attributes: ProductAttribute[];
  values: Record<string, string>;
  school: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  const label = (attribute: ProductAttribute, value: string | undefined) =>
    attribute.options.find((option) => option.value === value)?.display_label ?? value;

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => (
        <div key={attribute.code} className="space-y-2">
          <Label>{attribute.display_name}</Label>
          {attribute.options.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <OptionPill
                selected={!values[attribute.code]}
                onClick={() => onChange({ ...values, [attribute.code]: '' })}
              >
                Same as school
                {school[attribute.code] ? ` (${label(attribute, school[attribute.code])})` : ''}
              </OptionPill>
              {attribute.options.map((option) => (
                <OptionPill
                  key={option.value}
                  selected={values[attribute.code] === option.value}
                  onClick={() => onChange({ ...values, [attribute.code]: option.value })}
                >
                  {option.display_label}
                </OptionPill>
              ))}
            </div>
          ) : (
            <Input
              className="max-w-sm"
              value={values[attribute.code] ?? ''}
              placeholder={school[attribute.code] ? `School: ${school[attribute.code]}` : ''}
              onChange={(event) => onChange({ ...values, [attribute.code]: event.target.value })}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PhotoUploader({ product }: { product: CatalogProduct }) {
  const [scope, setScope] = useState<ClassScope>(WHOLE_SCHOOL_SCOPE);
  const inputRef = useRef<HTMLInputElement>(null);
  const add = useAddProductPhoto(product.public_id);

  const upload = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`Choose an image under ${MAX_UPLOAD_MB} MB`);
      return;
    }
    add.mutate(
      { image: file, class_public_ids: scopeClassIds(scope) },
      {
        onSuccess: () =>
          toast.success(
            scope.wholeSchool
              ? 'Photo added for the whole school'
              : `Photo added for ${scope.classIds.length} class(es)`
          ),
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Upload failed')),
      }
    );
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-sky-300 bg-sky-50/40 p-4 dark:bg-sky-950/20">
      <p className="text-sm font-medium">Add a photo for</p>
      <ClassScopePicker value={scope} onChange={setScope} />
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => upload(event.target.files?.[0])}
      />
      <Button
        type="button"
        disabled={!isScopeComplete(scope) || add.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="mr-2 h-4 w-4" />
        {add.isPending ? 'Uploading…' : 'Choose photo'}
      </Button>
    </div>
  );
}

function ClassDifferences({
  product,
  attributes,
  looks,
  sectionForGrade,
}: {
  product: CatalogProduct;
  attributes: ProductAttribute[];
  looks: ProductClassLook[];
  sectionForGrade: (gradeId: number) => string | undefined;
}) {
  const [scope, setScope] = useState<ClassScope>({ wholeSchool: false, classIds: [] });
  const [values, setValues] = useState<Record<string, string>>({});
  const save = useSaveClassLook(product.public_id);
  const overrides = Object.fromEntries(Object.entries(values).filter(([, value]) => value));
  const withOverrides = looks.filter((look) => Object.keys(look.properties).length > 0);

  const apply = () =>
    save.mutate(
      { class_public_ids: scope.classIds, properties: overrides },
      {
        onSuccess: () => {
          toast.success(`Saved for ${scope.classIds.length} class(es)`);
          setScope({ wholeSchool: false, classIds: [] });
          setValues({});
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not save')),
      }
    );

  const clear = (look: ProductClassLook) => {
    const section = sectionForGrade(look.class_master_id);
    if (!section) {
      return;
    }
    save.mutate(
      { class_public_ids: [section], properties: {} },
      {
        onSuccess: () => toast.success(`${look.class_name} now follows the school`),
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not save')),
      }
    );
  };

  const describe = (look: ProductClassLook) =>
    Object.entries(look.properties)
      .map(([code, value]) => {
        const attribute = attributes.find((item) => item.code === code);
        const option = attribute?.options.find((item) => item.value === value);
        return `${attribute?.display_name ?? code}: ${option?.display_label ?? value}`;
      })
      .join(' · ');

  return (
    <div className="space-y-5">
      {withOverrides.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {withOverrides.map((look) => (
            <li key={look.class_master_id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="font-medium">{look.class_name}</p>
                <p className="text-muted-foreground truncate text-sm">{describe(look)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={save.isPending}
                onClick={() => clear(look)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/40">
        <div className="space-y-2">
          <Label>Classes that differ</Label>
          <ClassScopePicker value={scope} onChange={setScope} classesOnly />
        </div>
        <OverrideInputs
          attributes={attributes}
          values={values}
          school={product.organization_properties ?? {}}
          onChange={setValues}
        />
        <Button
          variant="outline"
          disabled={
            scope.classIds.length === 0 || Object.keys(overrides).length === 0 || save.isPending
          }
          onClick={apply}
        >
          Apply to {scope.classIds.length || 'selected'} class
          {scope.classIds.length === 1 ? '' : 'es'}
        </Button>
      </div>
    </div>
  );
}

function ProductSetupForm({ product }: { product: CatalogProduct }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [instructions, setInstructions] = useState(product.instructions);
  const [customRows, setCustomRows] = useState<CustomFeatureRow[]>(() =>
    Object.entries(product.custom_fields ?? {}).map(([label, value], index) => ({
      id: index + 1,
      name: label,
      value,
    }))
  );
  const [values, setValues] = useState<Record<string, string>>(
    () => product.organization_properties ?? {}
  );
  const save = useSaveProductCustomization(product.public_id);
  const unpublish = useUnpublishProduct(product.public_id);
  const looks = useProductLooks(product.public_id);
  const grades = useGradeOptions();

  const attributes = organizationScopedAttributes(product.attributes);
  const orderAttributes = product.attributes.filter(
    (attribute) => attribute.scope === 'order' && !STORE_UI_MANAGED_KEYS.includes(attribute.code)
  );
  const required = attributes.filter((attribute) => attribute.is_required);
  const requiredNames = required.map((attribute) => attribute.display_name || attribute.code);
  // Server-side needs that are not form fields (approved ID card design, book list).
  const otherBlockers = product.publish_blockers.filter((item) => !requiredNames.includes(item));
  const checklist = [
    ...required.map((attribute) => ({
      label: attribute.display_name,
      done: Boolean(values[attribute.code]),
    })),
    ...otherBlockers.map((item) => ({ label: item, done: false })),
  ];
  const ready = checklist.every((item) => item.done);

  const sectionForGrade = useMemo(() => {
    const map = new Map(grades.options.map((option) => [option.gradeId, option.value]));
    return (gradeId: number) => map.get(gradeId);
  }, [grades.options]);

  const classLooks = looks.data?.data.classes ?? [];
  const classesWithPhotos = classLooks.filter((look) => look.photos.length > 0);

  const submit = (publish: boolean) =>
    save.mutate(
      {
        name,
        description,
        properties: values,
        instructions,
        custom_fields: customFeaturesPayload(customRows),
        publish,
      },
      {
        onSuccess: (response) => toast.success(response.message),
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not save')),
      }
    );

  let step = 0;
  const nextStep = () => ++step;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <OrderStep
          step={nextStep()}
          title="Product information"
          description="Shown to your staff when ordering. Leave as is to use EduCard's wording."
        >
          <div className="grid gap-5 sm:grid-cols-[16rem_minmax(0,1fr)]">
            <ProductImageCarousel
              images={product.images}
              alt={product.name}
              className="aspect-square"
              thumbnails
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  maxLength={150}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              {(name !== product.master_name || description !== product.master_description) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2"
                  onClick={() => {
                    setName(product.master_name);
                    setDescription(product.master_description);
                  }}
                >
                  <RotateCcw className="mr-1 h-4 w-4" />
                  Use EduCard&apos;s wording
                </Button>
              )}
            </div>
          </div>
          <dl className="text-muted-foreground grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt>Price</dt>
              <dd className="text-foreground font-medium">
                {product.kind === PRODUCT_KIND.BOOK_SET
                  ? 'Per approved book list'
                  : `${formatCurrency(product.price)} / ${product.unit_label}`}
              </dd>
            </div>
            {Object.entries(product.specifications ?? {}).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <dt className="capitalize">{key.replace(/_/g, ' ')}</dt>
                <dd className="text-foreground font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </OrderStep>

        <OrderStep
          step={nextStep()}
          title="Details EduCard needs"
          description="Fields marked * are mandatory before you can publish."
          complete={required.every((attribute) => Boolean(values[attribute.code]))}
        >
          {attributes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              EduCard needs nothing from your school for this product; sizes are chosen when
              ordering.
            </p>
          ) : (
            attributes.map((attribute) => (
              <AttributeField
                key={attribute.code}
                attribute={attribute}
                value={values[attribute.code]}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [attribute.code]: String(value) }))
                }
              />
            ))
          )}
          {product.kind === PRODUCT_KIND.ID_CARD && (
            <p className="text-sm">
              ID card designs are chosen in{' '}
              <Link to={ROUTES.STORE.SETUP} className="font-medium text-sky-700 underline">
                Store setup → ID card templates
              </Link>
              . At least one approved design is needed to publish.
            </p>
          )}
          {product.kind === PRODUCT_KIND.BOOK_SET && (
            <p className="text-sm">
              Class book lists are requested in{' '}
              <Link to={ROUTES.STORE.SETUP} className="font-medium text-sky-700 underline">
                Store setup → Book sets
              </Link>
              . At least one approved list is needed to publish.
            </p>
          )}
        </OrderStep>

        {orderAttributes.length > 0 && (
          <OrderStep
            step={nextStep()}
            title="Chosen when ordering"
            description="These are picked on each order (or per student). Shown here so you know what staff will be asked for."
          >
            <ul className="divide-y rounded-lg border">
              {orderAttributes.map((attribute) => (
                <li
                  key={attribute.code}
                  className="flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{attribute.display_name}</p>
                    {attribute.options.length > 0 && (
                      <p className="text-muted-foreground truncate text-sm">
                        {attribute.options.map((option) => option.display_label).join(', ')}
                      </p>
                    )}
                  </div>
                  {attribute.is_required ? (
                    <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100">Mandatory</Badge>
                  ) : (
                    <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Optional</Badge>
                  )}
                </li>
              ))}
            </ul>
          </OrderStep>
        )}

        <OrderStep
          step={nextStep()}
          title="Your own details (optional)"
          description="Instructions and extra fields of your own for this product. EduCard sees them on every order."
        >
          <div className="space-y-2">
            <Label htmlFor="product-instructions">Instructions for EduCard</Label>
            <Textarea
              id="product-instructions"
              rows={3}
              maxLength={2000}
              placeholder="e.g. Pack by class, deliver to the front office"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Your own fields</Label>
            <CustomFeaturesEditor
              rows={customRows}
              onChange={setCustomRows}
              namePlaceholder="Field name, e.g. Crest"
              valuePlaceholder="Value, e.g. Gold lion on the pocket"
              addLabel="Add a field"
            />
          </div>
        </OrderStep>

        {product.kind !== PRODUCT_KIND.BOOK_SET && (
          <OrderStep
            step={nextStep()}
            title="Photos"
            description="Your photos replace EduCard's picture. Add one for the whole school, or the same photo for several classes at once. The starred photo is the one shown."
          >
            <PhotoUploader product={product} />
            {looks.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Whole school</p>
                  <ProductPhotoGallery
                    productPublicId={product.public_id}
                    photos={looks.data?.data.school.photos ?? []}
                    emptyHint="No school photos yet: EduCard's picture is shown."
                  />
                </div>
                {classesWithPhotos.map((look) => (
                  <div key={look.class_master_id} className="space-y-2">
                    <p className="text-sm font-medium">{look.class_name}</p>
                    <ProductPhotoGallery
                      productPublicId={product.public_id}
                      classPublicId={sectionForGrade(look.class_master_id)}
                      photos={look.photos}
                      emptyHint=""
                    />
                  </div>
                ))}
              </div>
            )}
          </OrderStep>
        )}

        {attributes.length > 0 && (
          <OrderStep
            step={nextStep()}
            title="Differences for some classes (optional)"
            description="E.g. a different tie colour for senior classes. Everything else follows the school."
          >
            <ClassDifferences
              product={product}
              attributes={attributes}
              looks={classLooks}
              sectionForGrade={sectionForGrade}
            />
          </OrderStep>
        )}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <div className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-sky-50 to-indigo-50 p-4 dark:from-sky-950/40 dark:to-indigo-950/40">
            <p className="font-semibold">Publish</p>
            <StatusBadge product={product} />
          </div>
          <div className="space-y-4 p-4">
            <p className="text-muted-foreground text-sm">
              {product.is_published
                ? `Published${product.published_at ? ` on ${formatDate(product.published_at)}` : ''}. Your school can order it.`
                : 'Your school can order this product once it is published.'}
            </p>
            {checklist.length > 0 && (
              <ul className="space-y-2 text-sm" aria-label="Mandatory before publishing">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    ) : (
                      <Circle className="h-4 w-4 text-amber-500" aria-hidden />
                    )}
                    <span className={cn(item.done && 'text-muted-foreground line-through')}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {!ready && (
              <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Fill every mandatory field to publish.
              </p>
            )}
            {product.is_published ? (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={!ready || save.isPending}
                  onClick={() => submit(false)}
                >
                  {save.isPending ? 'Saving…' : 'Save changes'}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={unpublish.isPending}
                  onClick={() =>
                    unpublish.mutate(undefined, {
                      onSuccess: (response) => toast.success(response.message),
                      onError: (error: unknown) => toast.error(getErrorMessage(error)),
                    })
                  }
                >
                  Unpublish
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!ready || save.isPending}
                  onClick={() => submit(true)}
                >
                  {save.isPending ? 'Saving…' : 'Save & publish'}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={save.isPending}
                  onClick={() => submit(false)}
                >
                  Save draft
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function StoreProductSetupPage() {
  const { productId = '' } = useParams<{ productId: string }>();
  const { data, isLoading } = useCatalog({ page_size: 100 });
  const product = data?.data.find((item) => item.public_id === productId);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to={ROUTES.STORE.SETUP}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Store setup
          </Link>
        </Button>
        {product && (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Set up {product.name}</h1>
            <StatusBadge product={product} />
            {product.is_customized && <Badge variant="outline">Customised</Badge>}
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : product ? (
        // Re-mount when the saved product changes so the form shows the saved values.
        <ProductSetupForm
          key={`${product.public_id}-${product.publish_status}-${product.name}`}
          product={product}
        />
      ) : (
        <p className="text-muted-foreground">This product is not available.</p>
      )}
    </div>
  );
}
