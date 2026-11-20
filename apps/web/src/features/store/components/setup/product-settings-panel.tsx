/**
 * School-level values for products, e.g. the uniform shirt colour. EduCard decides in
 * the master catalog which properties are set here and which are mandatory.
 */
import { useState } from 'react';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  getErrorMessage,
  type CatalogProduct,
} from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCatalog, useUpdateProductProperties } from '../../hooks/use-store';
import { organizationScopedAttributes } from '../../utils/store-format';

function ProductSettingsCard({ product }: { product: CatalogProduct }) {
  const [values, setValues] = useState<Record<string, string>>(
    () => product.organization_properties ?? {}
  );
  const save = useUpdateProductProperties();
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{product.name}</CardTitle>
        {product.setup_required ? (
          <Badge variant="destructive">Setup required</Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Ready to order
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {attributes.map((attribute) => (
          <div key={attribute.code} className="space-y-2">
            <Label>
              {attribute.display_name}
              {attribute.is_required ? (
                <span className="text-destructive ml-1">*</span>
              ) : (
                <span className="text-muted-foreground ml-1 text-xs">(optional)</span>
              )}
            </Label>
            {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT ? (
              <div className="flex flex-wrap gap-2">
                {attribute.options.map((option) => {
                  const selected = values[attribute.code] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setValues((current) => ({ ...current, [attribute.code]: option.value }))
                      }
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      {option.image_url && (
                        <img
                          src={option.image_url}
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
                onChange={(event) =>
                  setValues((current) => ({ ...current, [attribute.code]: event.target.value }))
                }
              />
            )}
          </div>
        ))}
        <Button onClick={handleSave} disabled={missingRequired || save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProductSettingsPanel() {
  const { data, isLoading } = useCatalog({ page_size: 100 });
  const products = (data?.data ?? []).filter(
    (product) => organizationScopedAttributes(product.attributes).length > 0
  );

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center">
        <ShoppingBag className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
        <p className="mt-2 text-sm font-medium">No school-level settings needed</p>
        <p className="text-muted-foreground text-sm">
          Every product is configured when you add it to the cart.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {products.map((product) => (
        <ProductSettingsCard key={product.public_id} product={product} />
      ))}
    </div>
  );
}
