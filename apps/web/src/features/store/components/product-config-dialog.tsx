import { useState } from 'react';
import { toast } from 'sonner';
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  type CartItemConfiguration,
  type CatalogProduct,
} from '@educard/shared';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAddCartItem } from '../hooks/use-store';
import { formatCurrency, isConfigurationComplete } from '../utils/store-format';

interface ProductConfigDialogProps {
  product: CatalogProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Splits pasted or typed identifiers on commas, spaces and newlines. */
function parseListValue(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function ProductConfigDialog({ product, open, onOpenChange }: ProductConfigDialogProps) {
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [quantity, setQuantity] = useState(1);
  const addItem = useAddCartItem();

  if (!product) {
    return null;
  }

  const setValue = (code: string, value: string | string[]) => {
    setConfiguration((current) => ({ ...current, [code]: value }));
  };

  const reset = () => {
    setConfiguration({});
    setQuantity(1);
  };

  const handleSubmit = () => {
    addItem.mutate(
      { product_public_id: product.public_id, quantity, configuration },
      {
        onSuccess: () => {
          toast.success(`${product.name} added to cart`);
          reset();
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not add this item to the cart';
          toast.error(message);
        },
      }
    );
  };

  const complete = isConfigurationComplete(product.attributes, configuration);
  const lineTotal = Number(product.price) * quantity;

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {formatCurrency(product.price)} per {product.unit_label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {product.attributes.map((attribute) => (
            <div key={attribute.code} className="space-y-2">
              <Label>
                {attribute.display_name}
                {attribute.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT && (
                <div className="flex flex-wrap gap-2">
                  {attribute.options.map((option) => {
                    const selected = configuration[attribute.code] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue(attribute.code, option.value)}
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
                            className="h-6 w-6 rounded object-cover"
                          />
                        )}
                        {option.display_label}
                      </button>
                    );
                  })}
                </div>
              )}

              {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST && (
                <>
                  <Textarea
                    rows={3}
                    placeholder="Paste or type IDs separated by commas, spaces or new lines"
                    onChange={(event) =>
                      setValue(attribute.code, parseListValue(event.target.value))
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    {(configuration[attribute.code] as string[] | undefined)?.length ?? 0} entered
                  </p>
                </>
              )}

              {(attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.TEXT ||
                attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER) && (
                <Input
                  type={
                    attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER ? 'number' : 'text'
                  }
                  onChange={(event) => setValue(attribute.code, event.target.value)}
                />
              )}
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="store-quantity">Quantity</Label>
            <Input
              id="store-quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">Total {formatCurrency(lineTotal)}</span>
          <Button onClick={handleSubmit} disabled={!complete || addItem.isPending}>
            {addItem.isPending ? 'Adding…' : 'Add to cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
