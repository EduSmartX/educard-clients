import { Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  type Order,
  type OrderStatus,
} from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders, useUpdateOrderStatus } from '../hooks/use-store';
import { describeConfiguration, formatCurrency } from '../utils/store-format';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  delivered: 'outline',
  cancelled: 'destructive',
};

function OrderCard({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] ?? [];

  const handleTransition = (status: string) => {
    updateStatus.mutate(
      { publicId: order.public_id, status: status as OrderStatus },
      {
        onSuccess: () => toast.success(`Order marked ${ORDER_STATUS_LABELS[status]}`),
        onError: (error: unknown) => {
          const message =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Could not update this order';
          toast.error(message);
        },
      }
    );
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">{order.order_number}</p>
            <p className="text-muted-foreground text-xs">
              {new Date(order.placed_at).toLocaleString()}
              {order.placed_by_name ? ` · ${order.placed_by_name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[order.status] ?? 'secondary'}>
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </Badge>
            <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <ul className="space-y-1 border-t pt-3 text-sm">
          {order.items.map((item, index) => {
            const summary = describeConfiguration(item.configuration);
            return (
              <li key={`${item.product_code}-${index}`} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {item.product_name} × {item.quantity}
                  {summary ? ` — ${summary}` : ''}
                </span>
                <span>{formatCurrency(item.line_total)}</span>
              </li>
            );
          })}
        </ul>

        {order.notes && <p className="text-muted-foreground text-sm">Note: {order.notes}</p>}

        {nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'cancelled' ? 'outline' : 'default'}
                disabled={updateStatus.isPending}
                onClick={() => handleTransition(status)}
              >
                Mark {ORDER_STATUS_LABELS[status] ?? status}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StoreOrdersPage() {
  const { data, isLoading } = useOrders();
  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track the school's store orders through to delivery"
        icon={Package}
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Package className="text-muted-foreground mx-auto h-10 w-10" aria-hidden />
          <p className="mt-3 font-medium">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.public_id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
