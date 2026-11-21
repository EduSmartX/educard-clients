/**
 * How each product looks for this school: school-wide values (e.g. shirt colour) and
 * photos, with optional per-class overrides. EduCard decides in the master catalog
 * which properties are set here and which are mandatory; sizes are picked per order.
 */
import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  PRODUCT_KIND,
  getErrorMessage,
  type CatalogProduct,
  type ProductAttribute,
  type ProductClassLook,
} from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { cn } from '@/lib/utils';
import { getMediaUrl } from '@/lib/utils/media-utils';
import {
  useCatalog,
  useProductLooks,
  useSaveClassLook,
  useUpdateProductProperties,
} from '../../hooks/use-store';
import { organizationScopedAttributes } from '../../utils/store-format';
import { ClassSelect } from '../class-resolved-pickers';
import { ProductPhotoGallery } from './product-photo-gallery';

const SCHOOL_SCOPE = 'school';

const pillClass = (selected: boolean) =>
  cn(
    'rounded-full border px-3 py-1 text-sm transition-colors',
    selected ? 'border-sky-300 bg-sky-100 text-sky-800' : 'border-input hover:bg-accent'
  );

interface PropertyInputsProps {
  attributes: ProductAttribute[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  /** Class overrides: the school-wide values a blank field falls back to. */
  inherited?: Record<string, string>;
}

function PropertyInputs({ attributes, values, onChange, inherited }: PropertyInputsProps) {
  const set = (code: string, value: string) => onChange({ ...values, [code]: value });
  const optionLabel = (attribute: ProductAttribute, value: string | undefined) =>
    attribute.options.find((option) => option.value === value)?.display_label ?? value;

  return (
    <div className="space-y-4">
      {attributes.map((attribute) => (
        <div key={attribute.code} className="space-y-2">
          <Label>
            {attribute.display_name}
            {inherited ? null : attribute.is_required ? (
              <span className="text-destructive ml-1">*</span>
            ) : (
              <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
            )}
          </Label>
          {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT ? (
            <div className="flex flex-wrap gap-2">
              {inherited && (
                <button
                  type="button"
                  onClick={() => set(attribute.code, '')}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm transition-colors',
                    !values[attribute.code]
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input hover:bg-accent'
                  )}
                >
                  Same as school
                  {inherited[attribute.code] &&
                    ` (${optionLabel(attribute, inherited[attribute.code])})`}
                </button>
              )}
              {attribute.options.map((option) => {
                const selected = values[attribute.code] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set(attribute.code, option.value)}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:bg-accent'
                    )}
                  >
                    {option.image_url && (
                      <img
                        src={getMediaUrl(option.image_url)}
                        alt=""
                        className="h-5 w-5 rounded object-cover"
                      />
                    )}
                    {option.display_label}
                  </button>
                );
              })}
            </div>
          ) : (
            <Input
              type={
                attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER ? 'number' : 'text'
              }
              value={values[attribute.code] ?? ''}
              placeholder={
                inherited?.[attribute.code] ? `School: ${inherited[attribute.code]}` : ''
              }
              onChange={(event) => set(attribute.code, event.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SchoolScope({ product }: { product: CatalogProduct }) {
  const [values, setValues] = useState<Record<string, string>>(
    () => product.organization_properties ?? {}
  );
  const save = useUpdateProductProperties();
  const looks = useProductLooks(product.public_id);
  const attributes = organizationScopedAttributes(product.attributes);
  const missingRequired = attributes.some(
    (attribute) => attribute.is_required && !values[attribute.code]
  );

  const handleSave = () => {
    save.mutate(
      { publicId: product.public_id, properties: values },
      {
        onSuccess: () => toast.success(`${product.name} settings saved`),
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not save')),
      }
    );
  };

  return (
    <div className="space-y-5">
      {attributes.length > 0 && (
        <div className="space-y-4">
          <PropertyInputs attributes={attributes} values={values} onChange={setValues} />
          <Button onClick={handleSave} disabled={missingRequired || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
      <div className="space-y-2">
        <Label>School photos</Label>
        {looks.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <ProductPhotoGallery
            productPublicId={product.public_id}
            photos={looks.data?.data.school.photos ?? []}
            emptyHint="No photos yet: EduCard's picture is shown. Add your school's own, e.g. the uniform with your crest."
          />
        )}
      </div>
    </div>
  );
}

interface ClassScopeProps {
  product: CatalogProduct;
  gradeName: string;
  sectionPublicId: string;
  look: ProductClassLook | undefined;
}

function ClassScope({ product, gradeName, sectionPublicId, look }: ClassScopeProps) {
  const [values, setValues] = useState<Record<string, string>>(() => look?.properties ?? {});
  const save = useSaveClassLook(product.public_id);
  const attributes = organizationScopedAttributes(product.attributes);

  const submit = (properties: Record<string, string>, message: string) => {
    save.mutate(
      { class_public_id: sectionPublicId, properties },
      {
        onSuccess: () => toast.success(message),
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not save')),
      }
    );
  };

  const overrides = Object.fromEntries(Object.entries(values).filter(([, value]) => value));

  return (
    <div className="space-y-5">
      {attributes.length > 0 && (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Only set what is different for {gradeName}; everything else follows the school.
          </p>
          <PropertyInputs
            attributes={attributes}
            values={values}
            onChange={setValues}
            inherited={product.organization_properties ?? {}}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => submit(overrides, `${gradeName} settings saved`)}
              disabled={save.isPending}
            >
              {save.isPending ? 'Saving…' : `Save for ${gradeName}`}
            </Button>
            {look && Object.keys(look.properties).length > 0 && (
              <Button
                variant="outline"
                disabled={save.isPending}
                onClick={() => {
                  setValues({});
                  submit({}, `${gradeName} now follows the school`);
                }}
              >
                Use school settings
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label>{gradeName} photos</Label>
        <ProductPhotoGallery
          productPublicId={product.public_id}
          classPublicId={sectionPublicId}
          photos={look?.photos ?? []}
          emptyHint={`No ${gradeName} photos: the school's photo is shown for this class.`}
        />
      </div>
    </div>
  );
}

function ProductSettingsCard({ product }: { product: CatalogProduct }) {
  const [scope, setScope] = useState<string>(SCHOOL_SCOPE);
  const [adding, setAdding] = useState(false);
  const [addedGrades, setAddedGrades] = useState<number[]>([]);
  const looks = useProductLooks(product.public_id);
  const { data: classesResponse } = useClasses({ page_size: 100 });

  /** Any section per grade: overrides are stored per grade. */
  const sectionsByGrade = useMemo(() => {
    const map = new Map<number, { section: string; name: string }>();
    for (const section of classesResponse?.data ?? []) {
      const grade = section.class_master;
      if (grade && !map.has(grade.id)) {
        map.set(grade.id, { section: section.public_id, name: grade.name });
      }
    }
    return map;
  }, [classesResponse]);

  const classLooks = looks.data?.data.classes ?? [];
  const gradeIds = Array.from(
    new Set([...classLooks.map((look) => look.class_master_id), ...addedGrades])
  ).filter((gradeId) => sectionsByGrade.has(gradeId));
  const hasOrgAttributes = organizationScopedAttributes(product.attributes).length > 0;

  const addGrade = (sectionPublicId: string) => {
    const section = classesResponse?.data.find((item) => item.public_id === sectionPublicId);
    const gradeId = section?.class_master?.id;
    if (gradeId !== undefined) {
      setAddedGrades((current) => (current.includes(gradeId) ? current : [...current, gradeId]));
      setScope(String(gradeId));
    }
    setAdding(false);
  };

  const activeGrade = scope === SCHOOL_SCOPE ? undefined : Number(scope);
  const activeSection = activeGrade !== undefined ? sectionsByGrade.get(activeGrade) : undefined;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{product.name}</CardTitle>
        {hasOrgAttributes &&
          (product.setup_required ? (
            <Badge variant="destructive">Setup required</Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Ready to order
            </Badge>
          ))}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={scope === SCHOOL_SCOPE}
            className={pillClass(scope === SCHOOL_SCOPE)}
            onClick={() => setScope(SCHOOL_SCOPE)}
          >
            Whole school
          </button>
          {gradeIds.map((gradeId) => (
            <button
              key={gradeId}
              type="button"
              role="tab"
              aria-selected={scope === String(gradeId)}
              className={pillClass(scope === String(gradeId))}
              onClick={() => setScope(String(gradeId))}
            >
              {sectionsByGrade.get(gradeId)?.name}
            </button>
          ))}
          {adding ? (
            <div className="w-48">
              <ClassSelect value="" onChange={addGrade} placeholder="Pick a class" />
            </div>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Class look
            </Button>
          )}
        </div>

        {scope === SCHOOL_SCOPE || !activeSection ? (
          <SchoolScope product={product} />
        ) : (
          <ClassScope
            key={scope}
            product={product}
            gradeName={activeSection.name}
            sectionPublicId={activeSection.section}
            look={classLooks.find((look) => look.class_master_id === activeGrade)}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function ProductSettingsPanel() {
  const { data, isLoading } = useCatalog({ page_size: 100 });
  // ID cards have their own designs tab; book sets are approved book lists.
  const products = (data?.data ?? []).filter(
    (product) => product.kind !== PRODUCT_KIND.ID_CARD && product.kind !== PRODUCT_KIND.BOOK_SET
  );

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <ShoppingBag className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
        <p className="mt-2 text-sm font-medium">No products to set up</p>
        <p className="text-muted-foreground text-sm">
          EduCard has not offered any products to your school yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Set how each product looks for your school, and for any class that differs (e.g. a different
        tie colour for senior classes). Sizes are chosen per student when you order.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {products.map((product) => (
          <ProductSettingsCard key={product.public_id} product={product} />
        ))}
      </div>
    </div>
  );
}
