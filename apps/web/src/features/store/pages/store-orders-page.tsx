import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, MapPin, Package, Phone, Truck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  ORDER_STATUS,
  ORDER_STATUS_HINTS,
  ORDER_STATUS_LABELS,
  getErrorMessage,
  type Order,
  type OrderFilterOptions,
  type ShipmentSummary,
} from '@educard/shared';
import { PageHeader } from '@/components/common';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SimplePagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { COMPANY_NAME } from '@/constants/app-config';
import { useAppInfo } from '@/hooks/use-app-info';
import { OrderProgress } from '../components/order-progress';
import { useOrderFilterOptions, useOrders, useUpdateOrderStatus } from '../hooks/use-store';
import {
  describeConfiguration,
  formatCurrency,
  formatDate,
  qrSvgDataUri,
  trackingPath,
} from '../utils/store-format';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ordered: 'secondary',
  in_review: 'secondary',
  awaiting_approval: 'default',
  approved: 'default',
  processing: 'default',
  shipped: 'default',
  delivered: 'outline',
  cancelled: 'destructive',
};

/** Statuses after which the school calls EduCard to cancel (EduCard can until it ships). */
const CALL_TO_CANCEL: readonly string[] = [ORDER_STATUS.APPROVED, ORDER_STATUS.PROCESSING];

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
          {/* A PNG to print or share (served by the backend, so it opens in a new tab). */}
          <a
            href={shipment.qr_png_url || qrUri}
            target="_blank"
            rel="noopener noreferrer"
            download={`${shipment.shipment_number}-qr.png`}
          >
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
  const { data: appInfo } = useAppInfo();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const shipments = order.shipments ?? [];
  const cancelled = order.status === ORDER_STATUS.CANCELLED;
  const callToCancel = CALL_TO_CANCEL.includes(order.status);
  const supportPhone = appInfo?.support_phone;

  const handleCancel = () => {
    updateStatus.mutate(
      { publicId: order.public_id, status: ORDER_STATUS.CANCELLED, reason: reason.trim() },
      {
        onSuccess: () => toast.success(`Order ${order.order_number} cancelled`),
        onError: (error: unknown) =>
          toast.error(getErrorMessage(error, 'Could not cancel this order')),
        onSettled: () => setConfirming(false),
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
              {order.status_label || ORDER_STATUS_LABELS[order.status] || order.status}
            </Badge>
            <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {cancelled ? (
          <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="space-y-0.5">
              <p className="font-medium">This order was cancelled</p>
              {order.cancellation && (order.cancellation.by || order.cancellation.at) && (
                <p className="text-xs opacity-80">
                  {order.cancellation.by ? `by ${order.cancellation.by}` : ''}
                  {order.cancellation.at ? ` on ${formatDate(order.cancellation.at)}` : ''}
                </p>
              )}
              {order.cancellation?.reason && (
                <p className="italic">“{order.cancellation.reason}”</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <OrderProgress order={order} />
            <p className="text-muted-foreground text-sm">{ORDER_STATUS_HINTS[order.status]}</p>
          </>
        )}

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

        {order.can_cancel && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <p className="text-muted-foreground text-xs">
              You can cancel this order yourself until you approve it.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={updateStatus.isPending}
              onClick={() => setConfirming(true)}
            >
              Cancel order
            </Button>
          </div>
        )}

        {callToCancel && (
          <p className="text-muted-foreground flex items-center gap-2 border-t pt-3 text-xs">
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              This order is approved, so it can no longer be cancelled here. To cancel it, call{' '}
              {COMPANY_NAME}
              {supportPhone ? (
                <>
                  {' '}
                  on{' '}
                  <a className="font-medium underline" href={`tel:${supportPhone}`}>
                    {supportPhone}
                  </a>
                </>
              ) : null}
              .
            </span>
          </p>
        )}

        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel order {order.order_number}?</AlertDialogTitle>
              <AlertDialogDescription>
                {COMPANY_NAME} will stop working on it. This cannot be undone; to order again, place
                a new order. The school admins, the class teachers and {COMPANY_NAME} are emailed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              rows={2}
              maxLength={500}
              placeholder="Reason (optional)"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updateStatus.isPending}>Keep order</AlertDialogCancel>
              <AlertDialogAction
                disabled={updateStatus.isPending}
                onClick={(event) => {
                  event.preventDefault();
                  handleCancel();
                }}
              >
                Cancel order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

const PAGE_SIZE = 10;

/** Filter fields (same names as the API: status, product, placed_from/to, search). */
function orderFilterFields(options?: OrderFilterOptions): FilterField[] {
  return [
    {
      name: 'search',
      label: 'Order number',
      type: 'text',
      placeholder: 'e.g. 000010',
    },
    {
      name: 'status',
      label: 'Status',
      type: 'multiselect',
      placeholder: 'All statuses',
      options: options?.statuses ?? [],
    },
    {
      // Every product in the school's store (its own names), several at once.
      name: 'product',
      label: 'Products',
      type: 'multiselect',
      placeholder: 'All products',
      options: options?.products ?? [],
    },
    {
      name: 'placed',
      label: 'Placed between',
      type: 'daterange',
      startDateName: 'placed_from',
      endDateName: 'placed_to',
    },
  ];
}

export default function StoreOrdersPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const { data: filterOptions } = useOrderFilterOptions();
  const { data, isLoading, isFetching } = useOrders({
    ...filters,
    page,
    page_size: PAGE_SIZE,
  });
  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const total = pagination?.count ?? orders.length;
  const filtering = Object.keys(filters).length > 0;

  const applyFilters = (next: Record<string, string>) => {
    setFilters(next);
    setPage(1);
  };
  const clearFilters = () => applyFilters({});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Follow each order from placing it, through ID card approval, to delivery at school"
        icon={Package}
      />

      <ResourceFilter
        fields={orderFilterFields(filterOptions)}
        defaultValues={filters}
        onFilter={applyFilters}
        onReset={clearFilters}
        searchDebounceMs={500}
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Package className="text-muted-foreground mx-auto h-10 w-10" aria-hidden />
          <p className="mt-3 font-medium">
            {filtering ? 'No orders match these filters' : 'No orders yet'}
          </p>
          {filtering && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cn('space-y-4', isFetching && 'opacity-60 transition-opacity')}>
          <p className="text-muted-foreground text-sm">
            {total} order{total === 1 ? '' : 's'}
            {filtering ? ` ${total === 1 ? 'matches' : 'match'} your filters` : ''}
          </p>
          {orders.map((order) => (
            <OrderCard key={order.public_id} order={order} />
          ))}
          {pagination && pagination.total_pages > 1 && (
            <SimplePagination
              currentPage={page}
              totalPages={pagination.total_pages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
