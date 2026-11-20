import { useNavigate } from 'react-router-dom';
import { Download, MapPin, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORGANIZATION_CANCELLABLE_ORDER_STATUSES,
  getErrorMessage,
  type Order,
  type ShipmentSummary,
} from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders, useUpdateOrderStatus } from '../hooks/use-store';
import {
  describeConfiguration,
  formatCurrency,
  formatDate,
  qrSvgDataUri,
  trackingPath,
} from '../utils/store-format';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  delivered: 'outline',
  cancelled: 'destructive',
};

function ShipmentRow({ shipment }: { shipment: ShipmentSummary }) {
  const navigate = useNavigate();
  const qrUri = qrSvgDataUri(shipment.qr_svg);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border p-3">
      <img
        src={qrUri}
        alt={`QR code for shipment ${shipment.shipment_number}`}
        className="h-20 w-20 rounded bg-white p-1"
      />
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{shipment.shipment_number}</span>
          <Badge variant="secondary">{shipment.status_label}</Badge>
        </div>
        {shipment.current_location && (
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {shipment.current_location}
          </p>
        )}
        <p className="text-muted-foreground">
          {shipment.delivered_at
            ? `Delivered ${formatDate(shipment.delivered_at)}`
            : shipment.expected_delivery_date
              ? `Expected by ${formatDate(shipment.expected_delivery_date)}`
              : 'Delivery date to be confirmed'}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" asChild>
          <a href={qrUri} download={`${shipment.shipment_number}-qr.svg`}>
            <Download className="mr-1 h-4 w-4" />
            QR
          </a>
        </Button>
        <Button size="sm" onClick={() => navigate(trackingPath(shipment.tracking_token))}>
          <Truck className="mr-1 h-4 w-4" />
          Track
        </Button>
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();
  const cancellable = ORGANIZATION_CANCELLABLE_ORDER_STATUSES.includes(order.status);
  const shipments = order.shipments ?? [];

  const handleCancel = () => {
    updateStatus.mutate(
      { publicId: order.public_id, status: ORDER_STATUS.CANCELLED },
      {
        onSuccess: () => toast.success(`Order ${order.order_number} cancelled`),
        onError: (error: unknown) =>
          toast.error(getErrorMessage(error, 'Could not cancel this order')),
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

        {shipments.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-sm font-medium">Shipments</p>
            {shipments.map((shipment) => (
              <ShipmentRow key={shipment.tracking_token} shipment={shipment} />
            ))}
          </div>
        )}

        {cancellable && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="text-muted-foreground text-xs">
              EduCard confirms and ships the order. You can cancel until packing starts.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={updateStatus.isPending}
              onClick={handleCancel}
            >
              Cancel order
            </Button>
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
        description="Follow each order from EduCard confirmation to delivery at school"
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
