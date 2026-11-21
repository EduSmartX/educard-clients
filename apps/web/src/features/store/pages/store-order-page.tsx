/**
 * Order one product: a guided, step-by-step page instead of a popup.
 *
 * - ID cards: class -> all students or specific students -> live card preview.
 * - Uniform-style products: same size for everyone (size x quantity), or each
 *   student's own sizes.
 * - Book sets: an approved class book list.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  APPROVAL_STATUS,
  CUSTOM_FEATURES_KEY,
  PRODUCT_KIND,
  STORE_CONFIG_KEY,
  getErrorMessage,
  type BookSet,
  type CartItemConfiguration,
  type CatalogProduct,
  type StudentSizeEntry,
} from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/app-config';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { BookSetPicker, SectionSelect } from '../components/class-resolved-pickers';
import { AttributeField } from '../components/order/attribute-field';
import {
  CustomFeaturesEditor,
  customFeaturesPayload,
  hasHalfFilledRow,
  type CustomFeatureRow,
} from '../components/order/custom-features-editor';
import { IdCardPreviewPanel } from '../components/order/id-card-preview-panel';
import { ChoiceCard, OrderStep } from '../components/order/order-step';
import { OrderSummary, type SummaryRow } from '../components/order/order-summary';
import { StudentSizesTable } from '../components/order/student-sizes-table';
import { useClassStudents } from '../hooks/use-class-students';
import { useAddCartItem, useCatalog, useIdCardTemplates } from '../hooks/use-store';
import {
  ALL_CLASSES,
  classLabel,
  formatCurrency,
  isConfigurationComplete,
  orderScopedAttributes,
  perStudentAttributes,
  resolveTemplate,
  type StudentSelection,
} from '../utils/store-format';

type OrderMode = 'quantity' | 'students';
type Audience = 'all' | 'specific';

function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={1}
        aria-label="Quantity"
        className="h-9 w-20 border-0 text-center shadow-none focus-visible:ring-0"
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function OrderForm({ product }: { product: CatalogProduct }) {
  const navigate = useNavigate();
  const isIdCard = product.kind === PRODUCT_KIND.ID_CARD;
  const isBookSet = product.kind === PRODUCT_KIND.BOOK_SET;
  const isStandard = !isIdCard && !isBookSet;

  const [mode, setMode] = useState<OrderMode>('quantity');
  const [classId, setClassId] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [sizes, setSizes] = useState<StudentSelection>({});
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [customRows, setCustomRows] = useState<CustomFeatureRow[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [bookSet, setBookSet] = useState<BookSet | undefined>();
  const [previewStudentId, setPreviewStudentId] = useState('');
  const addItem = useAddCartItem();

  const perStudent = isStandard && mode === 'students';
  const choosesStudents = isIdCard || perStudent;
  const hasClass = Boolean(classId) && classId !== ALL_CLASSES;

  const { data: classesResponse } = useClasses({ page_size: 100 });
  const section = (classesResponse?.data ?? []).find((item) => item.public_id === classId);
  const { data: templatesResponse } = useIdCardTemplates({ status: APPROVAL_STATUS.APPROVED });
  const template =
    isIdCard && section ? resolveTemplate(templatesResponse?.data ?? [], section) : undefined;

  const classStudents = useClassStudents(choosesStudents && hasClass ? classId : undefined);
  const chosenStudents = useMemo(
    () =>
      audience === 'all'
        ? classStudents.students
        : classStudents.students.filter((student) => pickedIds.includes(student.public_id)),
    [audience, classStudents.students, pickedIds]
  );

  const lineAttributes = orderScopedAttributes(product.attributes);
  const studentAttributes = perStudentAttributes(lineAttributes);

  // The server counts "all students" itself, so use the class total for that case.
  const studentCount = audience === 'all' && isIdCard ? classStudents.total : chosenStudents.length;
  const pieces = choosesStudents ? studentCount : quantity;
  const unitPrice = isBookSet ? Number(bookSet?.price ?? 0) : Number(product.price);
  const noPhotoCount = isIdCard
    ? chosenStudents.filter((s) => !s.profile_photo_url && !s.profile_photo_thumbnail).length
    : 0;

  const chooseClass = (next: string) => {
    setClassId(next);
    setPickedIds([]);
    setSizes({});
    setPreviewStudentId('');
  };

  const chooseMode = (next: OrderMode) => {
    setMode(next);
    chooseClass('');
    setAudience('all');
  };

  // What still stops the order, in the order the steps are filled in.
  const blocker = (() => {
    if (isBookSet && !bookSet) {
      return 'Choose a book set.';
    }
    if ((isIdCard || perStudent) && !hasClass) {
      return 'Choose the class.';
    }
    if (isIdCard && !template) {
      return 'This class has no approved ID card design yet.';
    }
    if (choosesStudents) {
      if (classStudents.isLoading) {
        return 'Loading students…';
      }
      if (studentCount === 0) {
        return audience === 'all' ? 'This class has no students yet.' : 'Pick the students.';
      }
    }
    if (perStudent) {
      const missing = chosenStudents.filter((student) =>
        studentAttributes.some((a) => a.is_required && !sizes[student.public_id]?.[a.code])
      ).length;
      if (missing > 0) {
        return `Fill in the required sizes for ${missing} student${missing === 1 ? '' : 's'}.`;
      }
    } else if (!isConfigurationComplete(product.attributes, configuration)) {
      return 'Fill in the required options.';
    }
    if (hasHalfFilledRow(customRows)) {
      return 'Complete or remove the half-filled extra detail.';
    }
    return '';
  })();

  const buildPayload = (): CartItemConfiguration => {
    const payload: CartItemConfiguration = perStudent ? {} : { ...configuration };
    const custom = customFeaturesPayload(customRows);
    if (Object.keys(custom).length > 0) {
      payload[CUSTOM_FEATURES_KEY] = custom;
    }
    if (hasClass) {
      payload[STORE_CONFIG_KEY.CLASS] = classId;
    }
    if (isIdCard) {
      if (audience === 'all') {
        payload[STORE_CONFIG_KEY.ALL_STUDENTS] = true;
      } else {
        payload[STORE_CONFIG_KEY.STUDENT_IDS] = pickedIds;
      }
    }
    if (perStudent) {
      payload[STORE_CONFIG_KEY.STUDENTS] = chosenStudents.map(
        (student): StudentSizeEntry => ({
          student: student.public_id,
          ...(sizes[student.public_id] ?? {}),
        })
      );
    }
    if (isBookSet && bookSet) {
      payload[STORE_CONFIG_KEY.BOOK_SET] = bookSet.public_id;
    }
    return payload;
  };

  const handleAdd = (goToCart: boolean) => {
    addItem.mutate(
      {
        product_public_id: product.public_id,
        // Per-student lines: the server counts one piece per student.
        quantity: choosesStudents ? undefined : quantity,
        configuration: buildPayload(),
      },
      {
        onSuccess: () => {
          toast.success(`${product.name} added to cart`);
          navigate(goToCart ? ROUTES.STORE.CART : ROUTES.STORE.CATALOG);
        },
        onError: (error: unknown) =>
          toast.error(getErrorMessage(error, 'Could not add this item to the cart')),
      }
    );
  };

  const summaryRows: SummaryRow[] = [];
  if (isBookSet && bookSet) {
    summaryRows.push({ label: 'Book set', value: `${bookSet.class_name} · ${bookSet.name}` });
  }
  if (section) {
    summaryRows.push({ label: 'Class', value: classLabel(section) });
  } else if (isStandard && !perStudent) {
    summaryRows.push({ label: 'Look', value: 'Whole school' });
  }
  if (choosesStudents && hasClass) {
    summaryRows.push({
      label: 'For',
      value:
        audience === 'all'
          ? `All students (${studentCount})`
          : `${studentCount} selected student${studentCount === 1 ? '' : 's'}`,
    });
  }
  if (isIdCard && template) {
    summaryRows.push({ label: 'Design', value: template.name });
  }

  let step = 0;
  const nextStep = () => ++step;

  const studentPicker = hasClass && (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Who is it for">
        <ChoiceCard
          icon={Users}
          title="All students"
          description={
            classStudents.isLoading
              ? 'Counting students…'
              : `Everyone in ${section ? classLabel(section) : 'the class'} (${classStudents.total})`
          }
          selected={audience === 'all'}
          onSelect={() => setAudience('all')}
        />
        <ChoiceCard
          icon={UserCheck}
          title="Specific students"
          description="Search by name or roll number"
          selected={audience === 'specific'}
          onSelect={() => setAudience('specific')}
        />
      </div>

      {audience === 'specific' && (
        <div className="space-y-2">
          <Label>Students</Label>
          <MultiSelect
            options={classStudents.options}
            value={pickedIds}
            onChange={setPickedIds}
            placeholder={
              classStudents.isLoading ? 'Loading students…' : 'Search and select students'
            }
            searchPlaceholder="Name or roll number"
            emptyMessage="No matching students"
            maxBadges={6}
            disabled={classStudents.isLoading}
          />
        </div>
      )}

      {classStudents.total > classStudents.students.length && audience === 'specific' && (
        <p className="text-muted-foreground text-xs">
          Showing the first {classStudents.students.length} of {classStudents.total} students.
        </p>
      )}

      {isIdCard && noPhotoCount > 0 && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {noPhotoCount} student{noPhotoCount === 1 ? ' has' : 's have'} no profile photo; their
          card will print with a placeholder. Add photos from the Students page first.
        </p>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        {isIdCard && (
          <>
            <OrderStep
              step={nextStep()}
              title="Choose the class"
              description="The card design approved for this class is used."
              complete={Boolean(template)}
            >
              <SectionSelect
                value={classId}
                onChange={chooseClass}
                placeholder="Choose the class these cards are for"
              />
              {section && template && (
                <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  Prints with <span className="font-medium">{template.name}</span>
                  {template.is_default ? ' (school default)' : ''}
                </p>
              )}
              {section && !template && (
                <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  No approved ID card design for {classLabel(section)} yet.
                  <Link to={ROUTES.STORE.SETUP} className="font-medium underline">
                    Choose one in Store setup
                  </Link>
                </p>
              )}
            </OrderStep>

            <OrderStep
              step={nextStep()}
              title="Who are the cards for?"
              description="One card per student, filled in from their profile."
              complete={Boolean(template) && studentCount > 0}
            >
              {hasClass && template ? (
                studentPicker
              ) : (
                <p className="text-muted-foreground text-sm">Choose a class first.</p>
              )}
            </OrderStep>
          </>
        )}

        {isBookSet && (
          <>
            <OrderStep
              step={nextStep()}
              title="Choose the book set"
              description="Only book lists EduCard has approved are shown."
              complete={Boolean(bookSet)}
            >
              <BookSetPicker value={bookSet?.public_id ?? ''} onChange={setBookSet} />
            </OrderStep>
            <OrderStep step={nextStep()} title="How many sets?">
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </OrderStep>
          </>
        )}

        {isStandard && (
          <>
            <OrderStep step={nextStep()} title="How do you want to order?">
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Order mode">
                <ChoiceCard
                  icon={Package}
                  title="Same size for everyone"
                  description="Pick the options once and set a quantity."
                  selected={mode === 'quantity'}
                  onSelect={() => chooseMode('quantity')}
                />
                <ChoiceCard
                  icon={Users}
                  title="Each student's own size"
                  description="Choose students and enter their sizes."
                  selected={mode === 'students'}
                  onSelect={() => chooseMode('students')}
                />
              </div>
            </OrderStep>

            <OrderStep
              step={nextStep()}
              title={perStudent ? 'Class and students' : 'Class (optional)'}
              description={
                perStudent
                  ? 'Choose the class, then everyone or specific students.'
                  : "Pick a class to use that class's look, or leave it for the whole school."
              }
              complete={perStudent ? studentCount > 0 : undefined}
            >
              <SectionSelect
                value={classId}
                onChange={chooseClass}
                allowNone={!perStudent}
                placeholder={perStudent ? 'Choose the class' : 'Whole school'}
              />
              {perStudent && studentPicker}
            </OrderStep>

            <OrderStep
              step={nextStep()}
              title={perStudent ? "Each student's sizes" : 'Options and quantity'}
              description={
                perStudent
                  ? 'Use "Set for everyone" to fill a column, then adjust individual students.'
                  : undefined
              }
            >
              {perStudent ? (
                chosenStudents.length > 0 ? (
                  studentAttributes.length > 0 ? (
                    <StudentSizesTable
                      students={chosenStudents}
                      attributes={studentAttributes}
                      values={sizes}
                      onChange={setSizes}
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No sizes needed; one piece per student.
                    </p>
                  )
                ) : (
                  <p className="text-muted-foreground text-sm">Choose the students first.</p>
                )
              ) : (
                <>
                  {lineAttributes.map((attribute) => (
                    <AttributeField
                      key={attribute.code}
                      attribute={attribute}
                      value={configuration[attribute.code]}
                      onChange={(value) =>
                        setConfiguration((current) => ({ ...current, [attribute.code]: value }))
                      }
                    />
                  ))}
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <div>
                      <QuantityStepper value={quantity} onChange={setQuantity} />
                    </div>
                  </div>
                </>
              )}
            </OrderStep>
          </>
        )}

        {!isStandard && lineAttributes.length > 0 && (
          <OrderStep step={nextStep()} title="Options">
            {lineAttributes.map((attribute) => (
              <AttributeField
                key={attribute.code}
                attribute={attribute}
                value={configuration[attribute.code]}
                onChange={(value) =>
                  setConfiguration((current) => ({ ...current, [attribute.code]: value }))
                }
              />
            ))}
          </OrderStep>
        )}

        <OrderStep
          step={nextStep()}
          title="Extra details (optional)"
          description="Anything the catalog does not cover, such as embroidery or a packing note."
        >
          <CustomFeaturesEditor rows={customRows} onChange={setCustomRows} />
        </OrderStep>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        {isIdCard && template && (
          <IdCardPreviewPanel
            template={template}
            students={chosenStudents}
            studentId={previewStudentId || chosenStudents[0]?.public_id || ''}
            onStudentChange={setPreviewStudentId}
          />
        )}
        <OrderSummary
          product={product}
          rows={summaryRows}
          unitPrice={unitPrice}
          quantity={pieces}
          blocker={blocker}
          isSubmitting={addItem.isPending}
          onAdd={handleAdd}
        />
      </aside>
    </div>
  );
}

export default function StoreOrderPage() {
  const { productId = '' } = useParams<{ productId: string }>();
  const { data, isLoading } = useCatalog({ page_size: 100 });
  const product = data?.data.find((item) => item.public_id === productId);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to={ROUTES.STORE.CATALOG}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to store
          </Link>
        </Button>

        {isLoading ? (
          <Skeleton className="h-20 w-full max-w-xl" />
        ) : product ? (
          <div className="flex items-center gap-4">
            <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Order {product.name}</h1>
                <Badge variant="secondary">{product.category_name}</Badge>
              </div>
              <p className="text-muted-foreground">
                {product.kind === PRODUCT_KIND.BOOK_SET
                  ? 'Priced from the approved class book list'
                  : `${formatCurrency(product.price)} per ${product.unit_label}`}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : !product ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <ShoppingBag className="text-muted-foreground mx-auto h-10 w-10" aria-hidden />
          <p className="mt-3 font-medium">This product is not available</p>
          <Button asChild className="mt-4">
            <Link to={ROUTES.STORE.CATALOG}>Back to store</Link>
          </Button>
        </div>
      ) : product.setup_required ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">Finish the school settings first</p>
          <p className="mt-1 text-sm">
            Set {product.missing_properties.join(', ')} for {product.name} in Store setup.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to={ROUTES.STORE.SETUP}>Open Store setup</Link>
          </Button>
        </div>
      ) : (
        <OrderForm key={product.public_id} product={product} />
      )}
    </div>
  );
}
