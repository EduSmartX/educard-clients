/**
 * What a scanned shipment QR opens. School admins see their own shipments; EduCard
 * store staff and shipment handlers see any shipment and can record the next checkpoint.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, CalendarClock, Check, MapPin, PackageSearch, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  SHIPMENT_LOCATION_REQUIRED_STATUSES,
  SHIPMENT_PROGRESS_STEPS,
  SHIPMENT_STATUS,
  SHIPMENT_STATUS_LABELS,
  getErrorMessage,
  type ShipmentStatus,
  type ShipmentTracking,
} from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useRecordShipmentEvent, useShipmentTracking } from '../hooks/use-store';
import { formatDate, qrSvgDataUri } from '../utils/store-format';

function ProgressTracker({ status }: { status: ShipmentStatus }) {
  if (status === SHIPMENT_STATUS.CANCELLED) {
    return <Badge variant="destructive">This shipment was cancelled</Badge>;
  }

  const currentIndex = SHIPMENT_PROGRESS_STEPS.indexOf(
    status as (typeof SHIPMENT_PROGRESS_STEPS)[number]
  );

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Delivery progress">
      {SHIPMENT_PROGRESS_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="flex flex-col items-center gap-1 text-center">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs',
                done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted text-muted-foreground'
              )}
              aria-current={index === currentIndex ? 'step' : undefined}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
            </span>
            <span className={cn('text-xs', done ? 'font-medium' : 'text-muted-foreground')}>
              {SHIPMENT_STATUS_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function RecordUpdateForm({ token, shipment }: { token: string; shipment: ShipmentTracking }) {
  const [status, setStatus] = useState<ShipmentStatus | ''>('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const recordEvent = useRecordShipmentEvent(token);

  const needsLocation = Boolean(status) && SHIPMENT_LOCATION_REQUIRED_STATUSES.includes(status);
  const canSubmit = Boolean(status) && (!needsLocation || location.trim().length > 0);

  const handleSubmit = () => {
    if (!status) {
      return;
    }
    recordEvent.mutate(
      {
        status,
        location: location.trim(),
        note: note.trim(),
        expected_delivery_date: expectedDate || null,
      },
      {
        onSuccess: () => {
          toast.success('Shipment updated');
          setStatus('');
          setLocation('');
          setNote('');
          setExpectedDate('');
        },
        onError: (error: unknown) =>
          toast.error(getErrorMessage(error, 'Could not update this shipment')),
      }
    );
  };

  if (shipment.next_statuses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record an update</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(next) => setStatus(next as ShipmentStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="What happened?" />
              </SelectTrigger>
              <SelectContent>
                {shipment.next_statuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.value === shipment.status
                      ? `${option.label} — location checkpoint`
                      : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipment-location">
              Current location
              {needsLocation && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id="shipment-location"
              maxLength={200}
              placeholder="e.g. Vijayawada hub"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipment-eta">Expected delivery (optional)</Label>
            <Input
              id="shipment-eta"
              type="date"
              value={expectedDate}
              onChange={(event) => setExpectedDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipment-note">Note (optional)</Label>
            <Textarea
              id="shipment-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit || recordEvent.isPending}>
          {recordEvent.isPending ? 'Saving…' : 'Save update'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ShipmentTrackingPage() {
  const { token = '' } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useShipmentTracking(token);
  const shipment = data?.data;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !shipment) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center">
        <PackageSearch className="text-muted-foreground mx-auto h-10 w-10" aria-hidden />
        <p className="mt-3 font-medium">Shipment not found</p>
        <p className="text-muted-foreground text-sm">
          The code may be wrong, or you are not assigned to this shipment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={shipment.shipment_number}
        description={`Order ${shipment.order_number}`}
        icon={Truck}
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Building2 className="text-muted-foreground mt-0.5 h-4 w-4" aria-hidden />
                <div>
                  <dt className="text-muted-foreground text-xs">School</dt>
                  <dd className="font-medium">{shipment.organization_name}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="text-muted-foreground mt-0.5 h-4 w-4" aria-hidden />
                <div>
                  <dt className="text-muted-foreground text-xs">Status</dt>
                  <dd className="font-medium">{shipment.status_label}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" aria-hidden />
                <div>
                  <dt className="text-muted-foreground text-xs">Current location</dt>
                  <dd className="font-medium">{shipment.current_location || 'Not yet reported'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClock className="text-muted-foreground mt-0.5 h-4 w-4" aria-hidden />
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {shipment.delivered_at ? 'Delivered' : 'Expected delivery'}
                  </dt>
                  <dd className="font-medium">
                    {formatDate(shipment.delivered_at ?? shipment.expected_delivery_date) ||
                      'To be confirmed'}
                  </dd>
                </div>
              </div>
              {shipment.carrier_name && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs">Carrier</dt>
                  <dd className="font-medium">
                    {shipment.carrier_name}
                    {shipment.carrier_reference ? ` · ${shipment.carrier_reference}` : ''}
                  </dd>
                </div>
              )}
            </dl>
            <img
              src={qrSvgDataUri(shipment.qr_svg)}
              alt={`QR code for ${shipment.shipment_number}`}
              className="h-28 w-28 rounded bg-white p-1"
            />
          </div>

          <ProgressTracker status={shipment.status} />
        </CardContent>
      </Card>

      {shipment.can_update && <RecordUpdateForm token={token} shipment={shipment} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">In this package</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {shipment.items.map((item, index) => (
                <li key={`${item.product_name}-${index}`} className="py-2">
                  <div className="flex justify-between gap-3 font-medium">
                    <span>{item.product_name}</span>
                    <span>× {item.quantity}</span>
                  </div>
                  {item.details.length > 0 && (
                    <p className="text-muted-foreground text-xs">
                      {item.details.map((detail) => `${detail.label}: ${detail.value}`).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-5">
              {shipment.events.map((event, index) => (
                <li key={`${event.occurred_at}-${index}`} className="relative">
                  <span
                    className={cn(
                      'absolute top-1 -left-[1.6rem] h-3 w-3 rounded-full border-2 border-white',
                      index === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
                    )}
                    aria-hidden
                  />
                  <p className="text-sm font-medium">
                    {event.status_label}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(event.occurred_at).toLocaleString()}
                    {event.recorded_by_name ? ` · ${event.recorded_by_name}` : ''}
                  </p>
                  {event.note && <p className="mt-1 text-sm">{event.note}</p>}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
