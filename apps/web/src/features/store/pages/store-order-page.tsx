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
  type StudentListItem,
  type StudentSizeEntry,
} from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { ROUTES } from '@/constants/app-config';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { StudentMultiPicker } from '@/features/students/components/student-multi-picker';
import { getMediaUrl } from '@/lib/utils/media-utils';
import { BookSetPicker, SectionSelect } from '../components/class-resolved-pickers';
import { AttributeField } from '../components/order/attribute-field';
import {
  CustomFeaturesEditor,
  customFeaturesPayload,
  hasHalfFilledRow,
  type CustomFeatureRow,
} from '../components/order/custom-features-editor';
import {
  IdCardClassesPicker,
  type ClassCardPlan,
} from '../components/order/id-card-classes-picker';
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
  storeProductSetupPath,
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
  // ID cards: one or more classes (one cart line per class).
  const [classIds, setClassIds] = useState<string[]>([]);
  const [previewClassId, setPreviewClassId] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [picked, setPicked] = useState<StudentListItem[]>([]);
  const [sizes, setSizes] = useState<StudentSelection>({});
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [customRows, setCustomRows] = useState<CustomFeatureRow[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [bookSet, setBookSet] = useState<BookSet | undefined>();
  const [previewStudentId, setPreviewStudentId] = useState('');
  const addItem = useAddCartItem();

  const perStudent = isStandard && mode === 'students';
  const choosesStudents = isIdCard || perStudent;
  // Several ID card classes: one cart line per class, all or chosen students of each.
  const multiClass = isIdCard && classIds.length > 1;
  const specific = audience === 'specific';
  const activeClassId = isIdCard ? (classIds.length === 1 ? classIds[0] : '') : classId;
  const hasClass = Boolean(activeClassId) && activeClassId !== ALL_CLASSES;

  const { data: classesResponse, isLoading: classesLoading } = useClasses({ page_size: 100 });
  const sections = useMemo(() => classesResponse?.data ?? [], [classesResponse]);
  const section = sections.find((item) => item.public_id === activeClassId);
  const { data: templatesResponse } = useIdCardTemplates({ status: APPROVAL_STATUS.APPROVED });
  const templates = useMemo(() => templatesResponse?.data ?? [], [templatesResponse]);
  const template =
    isIdCard && section ? resolveTemplate(templates, section, product.public_id) : undefined;

  const classPlans: ClassCardPlan[] = useMemo(() => {
    if (!isIdCard) {
      return [];
    }
    return classIds.flatMap((id) => {
      const item = sections.find((candidate) => candidate.public_id === id);
      if (!item) {
        return [];
      }
      const planTemplate = resolveTemplate(templates, item, product.public_id);
      const students = item.student_count;
      return [
        {
          section: item,
          template: planTemplate,
          students,
          ready: Boolean(planTemplate) && students !== 0,
        },
      ];
    });
  }, [isIdCard, classIds, sections, templates, product.public_id]);
  const readyPlans = classPlans.filter((plan) => plan.ready);
  const previewPlan =
    readyPlans.find((plan) => plan.section.public_id === previewClassId) ?? readyPlans[0];
  const previewTemplate = multiClass ? previewPlan?.template : template;

  const studentsClassId = multiClass
    ? previewPlan?.section.public_id
    : choosesStudents && hasClass
      ? activeClassId
      : undefined;
  // The class total (for "All students") and the previewed class's students.
  const classStudents = useClassStudents(studentsClassId);
  // Classes the student picker searches in.
  const pickerClassIds = multiClass
    ? readyPlans.map((plan) => plan.section.public_id)
    : hasClass
      ? [activeClassId]
      : [];
  const chosenStudents = useMemo(() => {
    if (!specific) {
      return classStudents.students;
    }
    if (multiClass) {
      // Preview the chosen students of the previewed class.
      const inPreview = picked.filter(
        (student) => student.class_id === previewPlan?.section.public_id
      );
      return inPreview.length > 0 ? inPreview : classStudents.students;
    }
    return picked;
  }, [specific, multiClass, picked, previewPlan, classStudents.students]);
  const pickedClassIds = new Set(picked.map((student) => student.class_id));
  // Classes that get a cart line.
  const orderedPlans = specific
    ? readyPlans.filter((plan) => pickedClassIds.has(plan.section.public_id))
    : readyPlans;

  const lineAttributes = orderScopedAttributes(product.attributes);
  const studentAttributes = perStudentAttributes(lineAttributes);

  // The server counts "all students" itself, so use the class total for that case.
  const studentCount = specific
    ? picked.length
    : multiClass
      ? readyPlans.reduce((sum, plan) => sum + (plan.students ?? 0), 0)
      : isIdCard
        ? classStudents.total
        : chosenStudents.length;
  const pieces = choosesStudents ? studentCount : quantity;
  const unitPrice = isBookSet ? Number(bookSet?.price ?? 0) : Number(product.price);
  const photoCheckStudents = specific ? picked : multiClass ? [] : chosenStudents;
  const noPhotoCount = isIdCard
    ? photoCheckStudents.filter((s) => !s.profile_photo_url && !s.profile_photo_thumbnail).length
    : 0;

  const chooseClass = (next: string) => {
    setClassId(next);
    setPicked([]);
    setSizes({});
    setPreviewStudentId('');
  };

  const chooseClasses = (next: string[]) => {
    setClassIds(next);
    // Keep the students already picked from classes that are still chosen.
    setPicked((current) => current.filter((student) => next.includes(student.class_id)));
    setPreviewStudentId('');
    setPreviewClassId('');
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
    if (multiClass) {
      if (readyPlans.length === 0) {
        return 'None of the chosen classes has both an approved design and students.';
      }
      if (specific && picked.length === 0) {
        return 'Pick the students.';
      }
    } else if ((isIdCard || perStudent) && !hasClass) {
      return isIdCard ? 'Choose the classes.' : 'Choose the class.';
    } else if (isIdCard && !template) {
      return 'This class has no approved ID card design yet.';
    } else if (choosesStudents) {
      if (!specific && classStudents.isLoading) {
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
    if (multiClass) {
      // The classes go alongside; the server adds one line per class (all or these students).
      if (specific) {
        payload[STORE_CONFIG_KEY.STUDENT_IDS] = picked.map((student) => student.public_id);
      }
      return payload;
    }
    if (hasClass) {
      payload[STORE_CONFIG_KEY.CLASS] = activeClassId;
    }
    if (isIdCard) {
      if (audience === 'all') {
        payload[STORE_CONFIG_KEY.ALL_STUDENTS] = true;
      } else {
        payload[STORE_CONFIG_KEY.STUDENT_IDS] = picked.map((student) => student.public_id);
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
        ...(multiClass ? { classes: orderedPlans.map((plan) => plan.section.public_id) } : {}),
      },
      {
        onSuccess: () => {
          toast.success(
            multiClass
              ? `${product.name} for ${orderedPlans.length} class${orderedPlans.length === 1 ? '' : 'es'} added to cart`
              : `${product.name} added to cart`
          );
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
  if (multiClass) {
    const designNames = Array.from(new Set(orderedPlans.map((plan) => plan.template?.name ?? '')));
    summaryRows.push(
      {
        label: 'Classes',
        value: `${orderedPlans.length} class${orderedPlans.length === 1 ? '' : 'es'}`,
      },
      {
        label: 'For',
        value: specific
          ? `${studentCount} selected student${studentCount === 1 ? '' : 's'}`
          : `All students (${studentCount})`,
      },
      {
        label: 'Design',
        value: designNames.length === 1 ? designNames[0] : "Each class's own design",
      }
    );
  } else if (section) {
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

  const allCards = readyPlans.reduce((sum, plan) => sum + (plan.students ?? 0), 0);
  const allDescription = multiClass
    ? `Everyone in the ${readyPlans.length} class${readyPlans.length === 1 ? '' : 'es'} (${allCards} card${allCards === 1 ? '' : 's'})`
    : classStudents.isLoading
      ? 'Counting students…'
      : `Everyone in ${section ? classLabel(section) : 'the class'} (${classStudents.total})`;

  const studentPicker = pickerClassIds.length > 0 && (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Who is it for">
        <ChoiceCard
          icon={Users}
          title="All students"
          description={allDescription}
          selected={!specific}
          onSelect={() => setAudience('all')}
        />
        <ChoiceCard
          icon={UserCheck}
          title="Specific students"
          description={
            multiClass
              ? 'Search across the chosen classes by name or roll number'
              : 'Search by name or roll number'
          }
          selected={specific}
          onSelect={() => setAudience('specific')}
        />
      </div>

      {specific && (
        <div className="space-y-2">
          <Label>Students</Label>
          <StudentMultiPicker classIds={pickerClassIds} value={picked} onChange={setPicked} />
          {multiClass && picked.length > 0 && (
            <p className="text-muted-foreground text-xs">
              {picked.length} student{picked.length === 1 ? '' : 's'} from {orderedPlans.length}{' '}
              class{orderedPlans.length === 1 ? '' : 'es'}. Each class goes in the cart as its own
              line, with its own design and approval.
            </p>
          )}
        </div>
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
              title="Choose the classes"
              description="One class, several, or all of them. Each class prints with the design approved for it."
              complete={multiClass ? readyPlans.length > 0 : Boolean(template)}
            >
              <IdCardClassesPicker
                sections={sections}
                isLoading={classesLoading}
                value={classIds}
                onChange={chooseClasses}
                plans={classPlans}
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
              complete={
                (multiClass ? readyPlans.length > 0 : Boolean(template)) && studentCount > 0
              }
            >
              {(multiClass || template) && studentPicker ? (
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
        {multiClass && readyPlans.length > 1 && (
          <div className="space-y-1.5">
            <Label>Preview class</Label>
            <Select
              value={previewPlan?.section.public_id ?? ''}
              onValueChange={(next) => {
                setPreviewClassId(next);
                setPreviewStudentId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a class to preview" />
              </SelectTrigger>
              <SelectContent>
                {readyPlans.map((plan) => (
                  <SelectItem key={plan.section.public_id} value={plan.section.public_id}>
                    {classLabel(plan.section)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isIdCard && previewTemplate && (
          <IdCardPreviewPanel
            template={previewTemplate}
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
      ) : !product.is_published ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">{product.name} is not published yet</p>
          <p className="mt-1 text-sm">
            Review it, fill in everything EduCard marks as mandatory, then publish it. After that it
            can be ordered.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to={storeProductSetupPath(product.public_id)}>Set up & publish</Link>
          </Button>
        </div>
      ) : (
        <OrderForm key={product.public_id} product={product} />
      )}
    </div>
  );
}
