import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { StudentSizeEntry } from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/app-config';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { StoreEmptyState } from '../components/store-empty-state';
import {
  useCart,
  useClearCart,
  usePlaceOrder,
  useRemoveCartItem,
  useUpdateCartItem,
} from '../hooks/use-store';
import {
  describeConfiguration,
  formatCurrency,
  lineStudentCount,
  lineStudentSizes,
} from '../utils/store-format';

/** Collapsible "who gets which size" list for a per-student line. */
function StudentSizesBreakdown({ entries }: { entries: StudentSizeEntry[] }) {
  return (
    <details className="mt-1 text-sm">
      <summary className="text-primary cursor-pointer select-none">Sizes by student</summary>
      <ul className="text-muted-foreground mt-1 max-h-40 space-y-0.5 overflow-y-auto">
        {entries.map((entry) => {
          const values = Object.entries(entry)
            .filter(([key, value]) => !['student', 'name', 'roll_number'].includes(key) && value)
            .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
            .join(', ');
          return (
            <li key={entry.student}>
              <span className="text-foreground">{entry.name ?? entry.student}</span>
              {entry.roll_number ? ` (Roll ${entry.roll_number})` : ''}
              {values ? ` · ${values}` : ''}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export default function StoreCartPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clear = useClearCart();
  const place = usePlaceOrder();

  const cart = data?.data;
  const items = cart?.items ?? [];

  const handlePlaceOrder = () => {
    place.mutate(
      { notes },
      {
        onSuccess: (response) => {
          toast.success(`Order ${response.data.order_number} placed`);
          setNotes('');
          navigate(ROUTES.STORE.ORDERS);
        },
        onError: (error: unknown) => {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not place this order';
          toast.error(message);
        },
      }
    );
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cart"
        description="Review your items before placing the order"
        icon={ShoppingCart}
        actions={
          items.length > 0
            ? [
                {
                  label: 'Clear cart',
                  variant: 'outline' as const,
                  onClick: () => clear.mutate(undefined),
                },
              ]
            : []
        }
      />

      {items.length === 0 ? (
        <StoreEmptyState
          title="Your cart is empty"
          description="Add ID cards, uniforms and supplies from the store to see them here."
          action={{
            label: 'Browse the store',
            icon: ShoppingCart,
            onClick: () => navigate(ROUTES.STORE.CATALOG),
          }}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const summary = describeConfiguration(item.configuration);
              const perStudent = lineStudentCount(item.configuration) !== undefined;
              const sizes = lineStudentSizes(item.configuration);
              return (
                <Card key={item.public_id}>
                  <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
                    {item.image_url && (
                      <img
                        src={getMediaUrl(item.image_url)}
                        alt=""
                        className="bg-muted h-16 w-24 shrink-0 rounded-md object-contain"
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      {summary && <p className="text-muted-foreground text-sm">{summary}</p>}
                      {sizes.length > 0 && <StudentSizesBreakdown entries={sizes} />}
                      <p className="text-muted-foreground mt-1 text-sm">
                        {formatCurrency(item.unit_price)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        aria-label={`Quantity for ${item.product_name}`}
                        title={
                          perStudent
                            ? 'One per student. Remove the line and add it again to change students.'
                            : undefined
                        }
                        className="w-24"
                        value={item.quantity}
                        disabled={perStudent}
                        onChange={(event) =>
                          updateItem.mutate({
                            publicId: item.public_id,
                            quantity: Math.max(1, Number(event.target.value) || 1),
                          })
                        }
                      />
                      <span className="w-24 text-right font-semibold">
                        {formatCurrency(item.line_total)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${item.product_name}`}
                        onClick={() => removeItem.mutate(item.public_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="h-fit">
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{cart?.item_count ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total quantity</span>
                <span>{cart?.total_quantity ?? 0}</span>
              </div>
              <div className="flex justify-between border-t pt-4 text-base font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(cart?.subtotal ?? 0)}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-notes">Notes for the supplier</Label>
                <Textarea
                  id="order-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Delivery timing, sizes breakdown, anything else"
                />
              </div>

              <Button className="w-full" onClick={handlePlaceOrder} disabled={place.isPending}>
                {place.isPending ? 'Placing order…' : 'Place order'}
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                Payment and delivery are arranged offline after the order is confirmed.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
