/**
 * Sticky right-hand summary of the line being ordered, with the add-to-cart actions.
 */
import { AlertCircle, ImageOff, ShoppingCart } from 'lucide-react';
import type { CatalogProduct } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { formatCurrency } from '../../utils/store-format';

export interface SummaryRow {
  label: string;
  value: string;
}

interface OrderSummaryProps {
  product: CatalogProduct;
  rows: SummaryRow[];
  unitPrice: number;
  quantity: number;
  /** Why the order cannot be added yet; empty when ready. */
  blocker: string;
  isSubmitting: boolean;
  onAdd: (goToCart: boolean) => void;
}

export function OrderSummary({
  product,
  rows,
  unitPrice,
  quantity,
  blocker,
  isSubmitting,
  onAdd,
}: OrderSummaryProps) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="flex items-center gap-3 border-b bg-gradient-to-r from-sky-50 to-indigo-50 p-4 dark:from-sky-950/40 dark:to-indigo-950/40">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {product.image_url ? (
            <img
              src={getMediaUrl(product.image_url)}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <ImageOff className="text-muted-foreground h-6 w-6" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{product.name}</p>
          <p className="text-muted-foreground text-sm">Order summary</p>
        </div>
      </div>

      <dl className="space-y-2.5 p-4 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right font-medium">{row.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-medium">
            {formatCurrency(unitPrice)} × {quantity}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="text-2xl font-bold text-sky-700 dark:text-sky-400">
            {formatCurrency(unitPrice * quantity)}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 border-t p-4">
        {blocker && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {blocker}
          </p>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={Boolean(blocker) || isSubmitting}
          onClick={() => onAdd(false)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Adding…' : 'Add to cart'}
        </Button>
        <Button
          className="w-full"
          variant="outline"
          disabled={Boolean(blocker) || isSubmitting}
          onClick={() => onAdd(true)}
        >
          Add and go to cart
        </Button>
      </div>
    </div>
  );
}
