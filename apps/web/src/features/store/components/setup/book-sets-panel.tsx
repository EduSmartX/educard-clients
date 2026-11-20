/**
 * Class book lists. The school requests a set; EduCard approves it and sources the books.
 * Pending or rejected requests can be edited (which resubmits them) or withdrawn.
 */
import { useState } from 'react';
import { BookOpen, Pencil, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  BOOK_SET_LIMITS,
  EDITABLE_APPROVAL_STATUSES,
  getErrorMessage,
  type BookSet,
  type BookSetItemInput,
} from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useBookSets, useSaveBookSet, useWithdrawBookSet } from '../../hooks/use-store';
import { formatCurrency } from '../../utils/store-format';
import { ClassSelect } from '../class-resolved-pickers';
import { ApprovalBadge, ReviewNotes } from './approval-badge';

interface BookRow extends BookSetItemInput {
  id: number;
}

let rowId = 0;
const nextRowId = () => {
  rowId += 1;
  return rowId;
};

const blankRow = (): BookRow => ({
  id: nextRowId(),
  title: '',
  subject: '',
  publisher: '',
  isbn: '',
  unit_price: '',
  quantity: 1,
});

function rowsFrom(bookSet?: BookSet): BookRow[] {
  if (!bookSet) {
    return [blankRow()];
  }
  return bookSet.items.map((item) => ({
    id: nextRowId(),
    title: item.title,
    subject: item.subject,
    publisher: item.publisher,
    isbn: item.isbn,
    unit_price: item.unit_price,
    quantity: item.quantity,
  }));
}

interface BookSetDialogProps {
  /** Revise this request; omit to create a new one. */
  bookSet?: BookSet;
  onClose: () => void;
}

function BookSetDialog({ bookSet, onClose }: BookSetDialogProps) {
  const [name, setName] = useState(bookSet?.name ?? '');
  // A revised set keeps its grade server-side unless a new class is chosen here.
  const [classId, setClassId] = useState('');
  const [priceOverride, setPriceOverride] = useState(bookSet?.price_override ?? '');
  const [rows, setRows] = useState<BookRow[]>(() => rowsFrom(bookSet));
  const save = useSaveBookSet();

  const updateRow = (id: number, patch: Partial<BookRow>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const filledRows = rows.filter((row) => row.title.trim());
  const total = filledRows.reduce(
    (sum, row) => sum + (Number(row.unit_price) || 0) * (row.quantity || 0),
    0
  );
  const canSubmit =
    Boolean(name.trim()) && (Boolean(classId) || Boolean(bookSet)) && filledRows.length > 0;

  const handleSubmit = () => {
    save.mutate(
      {
        publicId: bookSet?.public_id,
        payload: {
          name: name.trim(),
          class_public_id: classId,
          price_override: priceOverride === '' ? null : String(priceOverride),
          items: filledRows.map(({ id: _id, ...row }) => ({
            ...row,
            unit_price: row.unit_price || '0',
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success('Book set sent to EduCard for approval');
          onClose();
        },
        onError: (error: unknown) => toast.error(getErrorMessage(error, 'Could not save')),
      }
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{bookSet ? 'Edit book set request' : 'Request a book set'}</DialogTitle>
          <DialogDescription>
            List the books for one class. EduCard checks the list, sources the books and makes the
            set available to order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book-set-name">Name</Label>
              <Input
                id="book-set-name"
                maxLength={150}
                placeholder="e.g. Class 5 — 2026-27"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Class<span className="text-destructive ml-1">*</span>
              </Label>
              <ClassSelect
                value={classId}
                onChange={setClassId}
                placeholder={bookSet?.class_name || 'Choose a class'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Books</Label>
            <div className="space-y-2">
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 items-center gap-2">
                  <Input
                    className="col-span-12 sm:col-span-4"
                    placeholder="Title *"
                    maxLength={200}
                    value={row.title}
                    onChange={(event) => updateRow(row.id, { title: event.target.value })}
                  />
                  <Input
                    className="col-span-6 sm:col-span-2"
                    placeholder="Subject"
                    maxLength={100}
                    value={row.subject}
                    onChange={(event) => updateRow(row.id, { subject: event.target.value })}
                  />
                  <Input
                    className="col-span-6 sm:col-span-2"
                    placeholder="Publisher"
                    maxLength={150}
                    value={row.publisher}
                    onChange={(event) => updateRow(row.id, { publisher: event.target.value })}
                  />
                  <Input
                    className="col-span-5 sm:col-span-2"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Price"
                    value={row.unit_price}
                    onChange={(event) => updateRow(row.id, { unit_price: event.target.value })}
                  />
                  <Input
                    className="col-span-5 sm:col-span-1"
                    type="number"
                    min={1}
                    max={BOOK_SET_LIMITS.MAX_QUANTITY}
                    aria-label="Copies per set"
                    value={row.quantity}
                    onChange={(event) =>
                      updateRow(row.id, {
                        quantity: Math.min(
                          BOOK_SET_LIMITS.MAX_QUANTITY,
                          Math.max(1, Number(event.target.value) || 1)
                        ),
                      })
                    }
                  />
                  <Button
                    className="col-span-2 sm:col-span-1"
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove book"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((current) => current.filter((item) => item.id !== row.id))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={rows.length >= BOOK_SET_LIMITS.MAX_ITEMS}
              onClick={() => setRows((current) => [...current, blankRow()])}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add book
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book-set-price">Set price (optional)</Label>
              <Input
                id="book-set-price"
                type="number"
                min={0}
                step="0.01"
                placeholder={`Defaults to ${formatCurrency(total)}`}
                value={priceOverride}
                onChange={(event) => setPriceOverride(event.target.value)}
              />
            </div>
            <p className="text-muted-foreground self-end text-sm">
              Books total {formatCurrency(total)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit || save.isPending}>
            {save.isPending ? 'Sending…' : 'Send for approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookSetCard({ bookSet, onEdit }: { bookSet: BookSet; onEdit: () => void }) {
  const withdraw = useWithdrawBookSet();
  const editable = EDITABLE_APPROVAL_STATUSES.includes(bookSet.status);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{bookSet.name}</p>
            <p className="text-muted-foreground text-xs">
              {bookSet.class_name} · {bookSet.items.length} book
              {bookSet.items.length === 1 ? '' : 's'} · {formatCurrency(bookSet.price)} per set
            </p>
          </div>
          <ApprovalBadge status={bookSet.status} />
        </div>
        <ReviewNotes status={bookSet.status} notes={bookSet.review_notes} />
        <ul className="text-muted-foreground space-y-0.5 text-sm">
          {bookSet.items.slice(0, 4).map((item, index) => (
            <li key={`${item.title}-${index}`}>
              {item.title}
              {item.quantity > 1 ? ` × ${item.quantity}` : ''}
            </li>
          ))}
          {bookSet.items.length > 4 && <li>and {bookSet.items.length - 4} more…</li>}
        </ul>
        {editable && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={withdraw.isPending}
              onClick={() =>
                withdraw.mutate(bookSet.public_id, {
                  onSuccess: () => toast.success('Request withdrawn'),
                  onError: (error: unknown) => toast.error(getErrorMessage(error)),
                })
              }
            >
              Withdraw
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BookSetsPanel() {
  const [editing, setEditing] = useState<BookSet | 'new' | null>(null);
  const { data, isLoading } = useBookSets();
  const bookSets = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground max-w-2xl text-sm">
          Request one book list per class. Once EduCard approves it, order it from the store as a
          Class Book Set.
        </p>
        <Button onClick={() => setEditing('new')}>
          <Plus className="mr-1 h-4 w-4" />
          Request book set
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : bookSets.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <BookOpen className="text-muted-foreground mx-auto h-8 w-8" aria-hidden />
          <p className="mt-2 text-sm font-medium">No book sets requested yet</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {bookSets.map((bookSet) => (
            <BookSetCard
              key={bookSet.public_id}
              bookSet={bookSet}
              onEdit={() => setEditing(bookSet)}
            />
          ))}
        </div>
      )}

      {editing && (
        <BookSetDialog
          bookSet={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
