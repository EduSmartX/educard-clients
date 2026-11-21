import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  CUSTOM_FEATURES_KEY,
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  PRODUCT_KIND,
  STORE_CONFIG_KEY,
  getErrorMessage,
  type BookSet,
  type CartItemConfiguration,
  type CatalogProduct,
  type IdCardTemplate,
  type ProductAttribute,
  type StudentSizeEntry,
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
import { getMediaUrl } from '@/lib/utils/media-utils';
import { useAddCartItem } from '../hooks/use-store';
import {
  ALL_CLASSES,
  formatCurrency,
  isConfigurationComplete,
  isSelectionComplete,
  orderScopedAttributes,
  perStudentAttributes,
  type StudentSelection,
} from '../utils/store-format';
import { CardPreview } from './card-preview';
import { BookSetPicker, IdCardClassPicker, SectionSelect } from './class-resolved-pickers';
import { ClassStudentsTable } from './class-students-table';

interface ProductConfigDialogProps {
  product: CatalogProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomFeatureRow {
  id: number;
  name: string;
  value: string;
}

/** Uniform-style products: one size for N pieces, or each student's own sizes. */
type OrderMode = 'quantity' | 'students';

/** Splits pasted or typed identifiers on commas, spaces and newlines. */
function parseListValue(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface AttributeFieldProps {
  attribute: ProductAttribute;
  value: CartItemConfiguration[string] | undefined;
  onChange: (value: string | string[]) => void;
}

function AttributeField({ attribute, value, onChange }: AttributeFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {attribute.display_name}
        {attribute.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT && (
        <div className="flex flex-wrap gap-2">
          {attribute.options.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
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
            onChange={(event) => onChange(parseListValue(event.target.value))}
          />
          <p className="text-muted-foreground text-xs">
            {(value as string[] | undefined)?.length ?? 0} entered
          </p>
        </>
      )}

      {(attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.TEXT ||
        attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER) && (
        <Input
          type={attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER ? 'number' : 'text'}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: OrderMode; onChange: (mode: OrderMode) => void }) {
  const options: { value: OrderMode; label: string; hint: string }[] = [
    { value: 'quantity', label: 'Size × quantity', hint: 'Same choices for every piece' },
    { value: 'students', label: 'Per student', hint: "Each student's own sizes" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How to order">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={mode === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md border px-3 py-2 text-left transition-colors',
            mode === option.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-input hover:bg-accent'
          )}
        >
          <span className="block text-sm font-medium">{option.label}</span>
          <span className="text-muted-foreground block text-xs">{option.hint}</span>
        </button>
      ))}
    </div>
  );
}

interface IdCardPreviewProps {
  template: IdCardTemplate;
  student?: { id: string; name: string };
}

/** The class's card rendered with one chosen student's real details. */
function IdCardPreview({ template, student }: IdCardPreviewProps) {
  const orientation = template.design?.orientation ?? 'landscape';
  return (
    <div className="bg-muted/40 space-y-2 rounded-md border p-3">
      <p className="text-muted-foreground text-xs">
        {student?.name
          ? `Preview for ${student.name}`
          : student
            ? 'Preview for the first selected student'
            : 'Preview with sample details (tick a student or press the eye to see theirs)'}{' '}
        · {template.name}
      </p>
      <div className="flex flex-wrap items-start gap-3">
        <CardPreview
          path={template.front_preview_url}
          student={student?.id}
          orientation={orientation}
          alt={`Front of ${template.name}`}
          className={orientation === 'landscape' ? 'max-w-[15rem]' : undefined}
        />
        {template.design?.has_back && (
          <CardPreview
            path={template.back_preview_url}
            student={student?.id}
            orientation={orientation}
            alt={`Back of ${template.name}`}
            className={orientation === 'landscape' ? 'max-w-[15rem]' : undefined}
          />
        )}
      </div>
    </div>
  );
}

export function ProductConfigDialog({ product, open, onOpenChange }: ProductConfigDialogProps) {
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [customFeatures, setCustomFeatures] = useState<CustomFeatureRow[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<OrderMode>('quantity');
  // ID cards and per-student lines: the class section, and its students.
  const [classPublicId, setClassPublicId] = useState('');
  const [template, setTemplate] = useState<IdCardTemplate | undefined>();
  const [selection, setSelection] = useState<StudentSelection>({});
  const [previewStudent, setPreviewStudent] = useState<{ id: string; name: string }>();
  // Book sets: the chosen approved set, which also sets the price.
  const [bookSet, setBookSet] = useState<BookSet | undefined>();
  const addItem = useAddCartItem();

  if (!product) {
    return null;
  }

  const setValue = (code: string, value: string | string[]) => {
    setConfiguration((current) => ({ ...current, [code]: value }));
  };

  const chooseClass = (next: string) => {
    setClassPublicId(next);
    setSelection({});
    setPreviewStudent(undefined);
  };

  const reset = () => {
    setConfiguration({});
    setCustomFeatures([]);
    setQuantity(1);
    setMode('quantity');
    chooseClass('');
    setTemplate(undefined);
    setBookSet(undefined);
  };

  const isIdCard = product.kind === PRODUCT_KIND.ID_CARD;
  const isBookSet = product.kind === PRODUCT_KIND.BOOK_SET;
  const isStandard = !isIdCard && !isBookSet;
  const perStudent = isStandard && mode === 'students';
  const lineAttributes = orderScopedAttributes(product.attributes);
  const studentAttributes = perStudentAttributes(lineAttributes);
  const selectedIds = Object.keys(selection);
  const choosesStudents = isIdCard || perStudent;
  const pieces = choosesStudents ? selectedIds.length : quantity;

  const addCustomRow = () => {
    setCustomFeatures((current) => [...current, { id: Date.now(), name: '', value: '' }]);
  };

  const updateCustomRow = (id: number, patch: Partial<CustomFeatureRow>) => {
    setCustomFeatures((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeCustomRow = (id: number) => {
    setCustomFeatures((current) => current.filter((row) => row.id !== id));
  };

  const buildPayload = (): CartItemConfiguration => {
    const custom = customFeatures.reduce<Record<string, string>>((acc, row) => {
      const name = row.name.trim();
      const value = row.value.trim();
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {});

    // Per-student lines carry sizes on each student, not on the line.
    const payload: CartItemConfiguration = perStudent ? {} : { ...configuration };
    if (Object.keys(custom).length > 0) {
      payload[CUSTOM_FEATURES_KEY] = custom;
    }
    if (classPublicId && classPublicId !== ALL_CLASSES) {
      payload[STORE_CONFIG_KEY.CLASS] = classPublicId;
    }
    if (isIdCard) {
      payload[STORE_CONFIG_KEY.STUDENT_IDS] = selectedIds;
    }
    if (perStudent) {
      payload[STORE_CONFIG_KEY.STUDENTS] = Object.entries(selection).map(
        ([student, values]): StudentSizeEntry => ({ student, ...values })
      );
    }
    if (isBookSet && bookSet) {
      payload[STORE_CONFIG_KEY.BOOK_SET] = bookSet.public_id;
    }
    return payload;
  };

  const handleSubmit = () => {
    addItem.mutate(
      {
        product_public_id: product.public_id,
        // The server counts one piece per chosen student.
        quantity: choosesStudents ? undefined : quantity,
        configuration: buildPayload(),
      },
      {
        onSuccess: () => {
          toast.success(`${product.name} added to cart`);
          reset();
          onOpenChange(false);
        },
        onError: (error: unknown) => {
          toast.error(getErrorMessage(error, 'Could not add this item to the cart'));
        },
      }
    );
  };

  let complete: boolean;
  if (isIdCard) {
    complete = Boolean(template) && selectedIds.length > 0;
  } else if (isBookSet) {
    complete = Boolean(bookSet) && isConfigurationComplete(product.attributes, configuration);
  } else if (perStudent) {
    complete = Boolean(classPublicId) && isSelectionComplete(selection, studentAttributes);
  } else {
    complete = isConfigurationComplete(product.attributes, configuration);
  }
  const incompleteCustomRow = customFeatures.some(
    (row) => Boolean(row.name.trim()) !== Boolean(row.value.trim())
  );
  const unitPrice = isBookSet ? Number(bookSet?.price ?? 0) : Number(product.price);
  const lineTotal = unitPrice * pieces;
  const showTable =
    (isIdCard && Boolean(template)) ||
    (perStudent && Boolean(classPublicId) && classPublicId !== ALL_CLASSES);

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
      <DialogContent
        className={cn('max-h-[90vh] overflow-y-auto', showTable ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {isBookSet
              ? 'Priced from the approved book list for the class'
              : `${formatCurrency(product.price)} per ${product.unit_label}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {isIdCard && (
            <IdCardClassPicker
              value={classPublicId}
              onChange={(next, resolved) => {
                chooseClass(next);
                setTemplate(resolved);
              }}
            />
          )}
          {isIdCard && template?.can_preview && (
            <IdCardPreview
              template={template}
              student={
                previewStudent ?? (selectedIds[0] ? { id: selectedIds[0], name: '' } : undefined)
              }
            />
          )}
          {isBookSet && <BookSetPicker value={bookSet?.public_id ?? ''} onChange={setBookSet} />}

          {isStandard && <ModeToggle mode={mode} onChange={setMode} />}
          {isStandard && (
            <div className="space-y-2">
              <Label>
                Class
                {perStudent ? (
                  <span className="text-destructive ml-1">*</span>
                ) : (
                  <span className="text-muted-foreground ml-1 text-xs">
                    (optional, uses the class&apos;s look)
                  </span>
                )}
              </Label>
              <SectionSelect
                value={classPublicId}
                onChange={chooseClass}
                allowNone={!perStudent}
                placeholder={perStudent ? 'Choose the class' : 'Whole school'}
              />
            </div>
          )}

          {showTable && (
            <div className="space-y-2">
              <Label>
                Students<span className="text-destructive ml-1">*</span>
              </Label>
              <ClassStudentsTable
                classPublicId={classPublicId}
                selection={selection}
                onChange={setSelection}
                attributes={perStudent ? studentAttributes : []}
                showPhotoStatus={isIdCard}
                previewStudent={previewStudent?.id}
                onPreview={
                  isIdCard && template?.can_preview
                    ? (student) =>
                        setPreviewStudent({ id: student.public_id, name: student.full_name })
                    : undefined
                }
              />
            </div>
          )}

          {!perStudent &&
            lineAttributes.map((attribute) => (
              <AttributeField
                key={attribute.code}
                attribute={attribute}
                value={configuration[attribute.code]}
                onChange={(value) => setValue(attribute.code, value)}
              />
            ))}

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Custom features</Label>
              <Button type="button" size="sm" variant="outline" onClick={addCustomRow}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>

            {customFeatures.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Add anything the catalog does not cover, such as embroidery text or a packaging
                note.
              </p>
            ) : (
              customFeatures.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Feature"
                    value={row.name}
                    onChange={(event) => updateCustomRow(row.id, { name: event.target.value })}
                  />
                  <Input
                    placeholder="Value"
                    value={row.value}
                    onChange={(event) => updateCustomRow(row.id, { value: event.target.value })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCustomRow(row.id)}
                    aria-label="Remove feature"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {choosesStudents ? (
            <p className="text-muted-foreground text-sm">
              Quantity: <span className="text-foreground font-medium">{pieces}</span> (one per
              selected student)
            </p>
          ) : (
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
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium">Total {formatCurrency(lineTotal)}</span>
          <Button
            onClick={handleSubmit}
            disabled={!complete || incompleteCustomRow || addItem.isPending}
          >
            {addItem.isPending ? 'Adding…' : 'Add to cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
