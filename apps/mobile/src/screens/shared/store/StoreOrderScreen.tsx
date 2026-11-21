/**
 * Store Order Screen - order one product step by step (replaces the old bottom sheet).
 *
 * - ID cards: class -> all students or specific students -> live card preview.
 * - Uniform-style products: same size for everyone, or each student's own sizes.
 * - Book sets: an approved class book list.
 */
import {
  APPROVAL_STATUS,
  CUSTOM_FEATURES_KEY,
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  PRODUCT_KIND,
  STORE_CONFIG_KEY,
  getErrorMessage,
  type BookSet,
  type CartItemConfiguration,
  type CatalogProduct,
  type StudentSizeEntry,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  ChevronLeft,
  ImageOff,
  Package,
  Plus,
  UserCheck,
  Users,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/common';
import { LoadingState } from '@/components/common/ListStates';
import {
  MultiSelectModal,
  SingleSelectModal,
} from '@/components/common/SelectionModal';
import { getMediaUrl } from '@/constants/config';
import { useClasses } from '@/features/classes';
import {
  classLabel,
  formatCurrency,
  lineAttributes,
  perStudentAttributes,
  resolveTemplate,
  useAddCartItem,
  useBookSets,
  useCatalog,
  useClassStudents,
  useIdCardTemplates,
  type StudentSelection,
} from '@/features/store';
import { AttributeInput } from '@/features/store/components/AttributeInput';
import { CardPreviewImage } from '@/features/store/components/CardPreviewImage';
import {
  ChoiceCard,
  Notice,
  ORDER_COLOURS,
  OrderStep,
  PickerButton,
  QuantityStepper,
} from '@/features/store/components/OrderParts';
import { storeStyles as s } from '@/features/store/components/store-styles';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

type OrderMode = 'quantity' | 'students';
type Audience = 'all' | 'specific';

interface CustomFeatureRow {
  id: number;
  name: string;
  value: string;
}

/** Sheets that may be open over the screen. */
type OpenSheet = 'class' | 'students' | 'preview' | null;

const WHOLE_SCHOOL = '';

function parseListValue(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(entry => entry.trim())
    .filter(Boolean);
}

function OrderForm({ product }: { product: CatalogProduct }) {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const isIdCard = product.kind === PRODUCT_KIND.ID_CARD;
  const isBookSet = product.kind === PRODUCT_KIND.BOOK_SET;
  const isStandard = !isIdCard && !isBookSet;

  const [mode, setMode] = useState<OrderMode>('quantity');
  const [classId, setClassId] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [sizes, setSizes] = useState<StudentSelection>({});
  const [everyone, setEveryone] = useState<Record<string, string>>({});
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [customRows, setCustomRows] = useState<CustomFeatureRow[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [bookSet, setBookSet] = useState<BookSet | undefined>();
  const [previewId, setPreviewId] = useState('');
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const addItem = useAddCartItem();

  const perStudent = isStandard && mode === 'students';
  const choosesStudents = isIdCard || perStudent;

  const { data: classesData } = useClasses({ page_size: 100 });
  const sections = useMemo(() => classesData?.classes ?? [], [classesData]);
  const section = sections.find(item => item.public_id === classId);
  const { data: templatesResponse } = useIdCardTemplates(
    { status: APPROVAL_STATUS.APPROVED },
    isIdCard,
  );
  const { data: bookSetsResponse } = useBookSets(
    { status: APPROVAL_STATUS.APPROVED },
    isBookSet,
  );
  const template =
    isIdCard && section
      ? resolveTemplate(templatesResponse?.data ?? [], section)
      : undefined;
  const bookSets = bookSetsResponse?.data ?? [];

  const classStudents = useClassStudents(
    choosesStudents && classId ? classId : undefined,
  );
  const chosenStudents = useMemo(
    () =>
      audience === 'all'
        ? classStudents.students
        : classStudents.students.filter(student =>
            pickedIds.includes(student.public_id),
          ),
    [audience, classStudents.students, pickedIds],
  );

  const attributes = lineAttributes(product);
  const studentAttributes = perStudentAttributes(attributes);
  // The server counts "all students" itself, so use the class total there.
  const studentCount =
    audience === 'all' && isIdCard
      ? classStudents.total
      : chosenStudents.length;
  const pieces = choosesStudents ? studentCount : quantity;
  const unitPrice = isBookSet
    ? Number(bookSet?.price ?? 0)
    : Number(product.price);
  const noPhotoCount = isIdCard
    ? chosenStudents.filter(
        student =>
          !student.profile_photo_url && !student.profile_photo_thumbnail,
      ).length
    : 0;
  const previewStudent = previewId || chosenStudents[0]?.public_id || '';
  const previewName =
    classStudents.students.find(student => student.public_id === previewStudent)
      ?.full_name ?? '';

  const chooseClass = (next: string) => {
    setClassId(next);
    setPickedIds([]);
    setSizes({});
    setPreviewId('');
  };

  const chooseMode = (next: OrderMode) => {
    setMode(next);
    chooseClass('');
    setAudience('all');
  };

  const setStudentValue = (studentId: string, code: string, value: string) =>
    setSizes(current => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? {}), [code]: value },
    }));

  const setForEveryone = (code: string, value: string) => {
    setEveryone(current => ({ ...current, [code]: value }));
    setSizes(current => {
      const next = { ...current };
      for (const student of chosenStudents) {
        next[student.public_id] = {
          ...(next[student.public_id] ?? {}),
          [code]: value,
        };
      }
      return next;
    });
  };

  const lineComplete = attributes
    .filter(attribute => attribute.is_required)
    .every(attribute => {
      const value = configuration[attribute.code];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });

  const blocker = (() => {
    if (isBookSet && !bookSet) {
      return 'Choose a book set.';
    }
    if (choosesStudents && !classId) {
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
        return audience === 'all'
          ? 'This class has no students yet.'
          : 'Pick the students.';
      }
    }
    if (perStudent) {
      const missing = chosenStudents.filter(student =>
        studentAttributes.some(
          attribute =>
            attribute.is_required &&
            !sizes[student.public_id]?.[attribute.code],
        ),
      ).length;
      if (missing > 0) {
        return `Fill in the required sizes for ${missing} student${
          missing === 1 ? '' : 's'
        }.`;
      }
    } else if (!lineComplete) {
      return 'Fill in the required options.';
    }
    if (
      customRows.some(
        row => Boolean(row.name.trim()) !== Boolean(row.value.trim()),
      )
    ) {
      return 'Complete or remove the half-filled extra detail.';
    }
    return '';
  })();

  const handleAdd = () => {
    const payload: CartItemConfiguration = perStudent
      ? {}
      : { ...configuration };
    const custom = customRows.reduce<Record<string, string>>((acc, row) => {
      if (row.name.trim() && row.value.trim()) {
        acc[row.name.trim()] = row.value.trim();
      }
      return acc;
    }, {});
    if (Object.keys(custom).length > 0) {
      payload[CUSTOM_FEATURES_KEY] = custom;
    }
    if (classId) {
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
        }),
      );
    }
    if (isBookSet && bookSet) {
      payload[STORE_CONFIG_KEY.BOOK_SET] = bookSet.public_id;
    }

    addItem.mutate(
      {
        product_public_id: product.public_id,
        quantity: choosesStudents ? undefined : quantity,
        configuration: payload,
      },
      {
        onSuccess: () => {
          showToast('success', `${product.name} added to cart`);
          navigation.goBack();
        },
        onError: error =>
          showToast('error', getErrorMessage(error, 'Could not add this item')),
      },
    );
  };

  let step = 0;
  const nextStep = () => ++step;

  const classPicker = (optional: boolean) => (
    <PickerButton
      label={section ? classLabel(section) : optional ? 'Whole school' : ''}
      placeholder="Choose the class"
      onPress={() => setSheet('class')}
    />
  );

  const studentPicker = classId ? (
    <>
      <ChoiceCard
        icon={Users}
        title="All students"
        description={
          classStudents.isLoading
            ? 'Counting students…'
            : `Everyone in ${section ? classLabel(section) : 'the class'} (${
                classStudents.total
              })`
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
      {audience === 'specific' && (
        <>
          <PickerButton
            label={
              pickedIds.length > 0
                ? `${pickedIds.length} student${
                    pickedIds.length === 1 ? '' : 's'
                  } selected`
                : ''
            }
            placeholder={
              classStudents.isLoading
                ? 'Loading students…'
                : 'Search and select students'
            }
            disabled={classStudents.isLoading}
            onPress={() => setSheet('students')}
          />
          {chosenStudents.length > 0 && (
            <Text style={s.hint} numberOfLines={2}>
              {chosenStudents
                .slice(0, 5)
                .map(student => student.full_name)
                .join(', ')}
              {chosenStudents.length > 5
                ? ` +${chosenStudents.length - 5} more`
                : ''}
            </Text>
          )}
        </>
      )}
      {isIdCard && noPhotoCount > 0 && (
        <Notice tone="warning">
          {noPhotoCount} student{noPhotoCount === 1 ? ' has' : 's have'} no
          profile photo; their card prints with a placeholder.
        </Notice>
      )}
    </>
  ) : null;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={styles.heroImage}>
            {product.image_url ? (
              <Image
                source={{ uri: getMediaUrl(product.image_url) }}
                style={styles.heroImageInner}
                resizeMode="contain"
              />
            ) : (
              <ImageOff size={24} color="#9ca3af" />
            )}
          </View>
          <View style={styles.flex}>
            <Text style={styles.heroTitle}>{product.name}</Text>
            <Text style={s.hint}>
              {isBookSet
                ? 'Priced from the class book list'
                : `${formatCurrency(product.price)} per ${product.unit_label}`}
            </Text>
          </View>
        </View>

        {isIdCard && (
          <>
            <OrderStep
              step={nextStep()}
              title="Choose the class"
              description="The card design approved for this class is used."
              complete={Boolean(template)}
            >
              {classPicker(false)}
              {section && template && (
                <Notice tone="success">
                  Prints with {template.name}
                  {template.is_default ? ' (school default)' : ''}
                </Notice>
              )}
              {section && !template && (
                <Notice tone="warning">
                  No approved ID card design for {classLabel(section)} yet.
                  Choose one in Store Setup.
                </Notice>
              )}
            </OrderStep>

            <OrderStep
              step={nextStep()}
              title="Who are the cards for?"
              description="One card per student, filled in from their profile."
              complete={Boolean(template) && studentCount > 0}
            >
              {template ? (
                studentPicker
              ) : (
                <Text style={s.hint}>Choose a class first.</Text>
              )}
            </OrderStep>

            {template?.can_preview && (
              <OrderStep step={nextStep()} title="Card preview">
                <Text style={s.hint}>
                  {previewName ? `Showing ${previewName}` : 'Sample details'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.previewRow}>
                    <CardPreviewImage
                      path={template.front_preview_url}
                      student={previewStudent || undefined}
                      orientation={template.design?.orientation}
                      width={240}
                    />
                    {template.design?.has_back && (
                      <CardPreviewImage
                        path={template.back_preview_url}
                        student={previewStudent || undefined}
                        orientation={template.design?.orientation}
                        width={240}
                      />
                    )}
                  </View>
                </ScrollView>
                {chosenStudents.length > 1 && (
                  <PickerButton
                    label={previewName ? `Preview as ${previewName}` : ''}
                    placeholder="Preview as another student"
                    onPress={() => setSheet('preview')}
                  />
                )}
              </OrderStep>
            )}
          </>
        )}

        {isBookSet && (
          <>
            <OrderStep
              step={nextStep()}
              title="Choose the book set"
              complete={Boolean(bookSet)}
            >
              {bookSets.length === 0 ? (
                <Notice tone="warning">
                  No approved book sets yet. Request one in Store Setup on the
                  web.
                </Notice>
              ) : (
                <View style={s.optionRow}>
                  {bookSets.map(set => {
                    const active = set.public_id === bookSet?.public_id;
                    return (
                      <TouchableOpacity
                        key={set.public_id}
                        style={[s.option, active && s.optionActive]}
                        onPress={() => setBookSet(set)}
                      >
                        <Text
                          style={[s.optionText, active && s.optionTextActive]}
                        >
                          {set.class_name} — {set.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {bookSet?.items.map((book, index) => (
                <Text key={`${book.title}-${index}`} style={s.hint}>
                  {book.title}
                  {book.quantity > 1 ? ` × ${book.quantity}` : ''} ·{' '}
                  {formatCurrency(book.line_total)}
                </Text>
              ))}
            </OrderStep>
            <OrderStep step={nextStep()} title="How many sets?">
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </OrderStep>
          </>
        )}

        {isStandard && (
          <>
            <OrderStep step={nextStep()} title="How do you want to order?">
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
            </OrderStep>

            <OrderStep
              step={nextStep()}
              title={perStudent ? 'Class and students' : 'Class (optional)'}
              description={
                perStudent
                  ? 'Choose the class, then everyone or specific students.'
                  : "Pick a class to use that class's look."
              }
              complete={perStudent ? studentCount > 0 : undefined}
            >
              {classPicker(!perStudent)}
              {perStudent && studentPicker}
            </OrderStep>

            <OrderStep
              step={nextStep()}
              title={
                perStudent ? "Each student's sizes" : 'Options and quantity'
              }
            >
              {perStudent ? (
                chosenStudents.length === 0 ? (
                  <Text style={s.hint}>Choose the students first.</Text>
                ) : studentAttributes.length === 0 ? (
                  <Text style={s.hint}>
                    No sizes needed; one piece per student.
                  </Text>
                ) : (
                  <>
                    {chosenStudents.length > 1 && (
                      <View style={styles.everyone}>
                        <Text style={styles.everyoneTitle}>
                          Set for everyone
                        </Text>
                        {studentAttributes.map(attribute => (
                          <View key={attribute.code} style={styles.sizeField}>
                            <Text style={s.hint}>{attribute.display_name}</Text>
                            <AttributeInput
                              compact
                              attribute={attribute}
                              value={everyone[attribute.code] ?? ''}
                              onChange={value =>
                                setForEveryone(attribute.code, value)
                              }
                            />
                          </View>
                        ))}
                      </View>
                    )}
                    {chosenStudents.map(student => (
                      <View key={student.public_id} style={styles.studentRow}>
                        <Text style={styles.studentName}>
                          {student.full_name}
                          {student.roll_number ? (
                            <Text style={s.hint}>
                              {'  '}Roll {student.roll_number}
                            </Text>
                          ) : null}
                        </Text>
                        {studentAttributes.map(attribute => (
                          <View key={attribute.code} style={styles.sizeField}>
                            <Text style={s.hint}>
                              {attribute.display_name}
                              {attribute.is_required ? ' *' : ''}
                            </Text>
                            <AttributeInput
                              compact
                              attribute={attribute}
                              value={
                                sizes[student.public_id]?.[attribute.code] ?? ''
                              }
                              onChange={value =>
                                setStudentValue(
                                  student.public_id,
                                  attribute.code,
                                  value,
                                )
                              }
                            />
                          </View>
                        ))}
                      </View>
                    ))}
                  </>
                )
              ) : (
                <>
                  {attributes.map(attribute => (
                    <View key={attribute.code}>
                      <Text style={s.label}>
                        {attribute.display_name}
                        {attribute.is_required ? ' *' : ' (optional)'}
                      </Text>
                      {attribute.input_type ===
                      PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST ? (
                        <TextInput
                          style={[s.input, styles.multiline]}
                          multiline
                          placeholder="Separate entries with commas or spaces"
                          onChangeText={text =>
                            setConfiguration(current => ({
                              ...current,
                              [attribute.code]: parseListValue(text),
                            }))
                          }
                        />
                      ) : (
                        <AttributeInput
                          attribute={attribute}
                          value={String(configuration[attribute.code] ?? '')}
                          onChange={value =>
                            setConfiguration(current => ({
                              ...current,
                              [attribute.code]: value,
                            }))
                          }
                        />
                      )}
                    </View>
                  ))}
                  <View>
                    <Text style={s.label}>Quantity</Text>
                    <QuantityStepper value={quantity} onChange={setQuantity} />
                  </View>
                </>
              )}
            </OrderStep>
          </>
        )}

        <OrderStep
          step={nextStep()}
          title="Extra details (optional)"
          description="Anything the catalog does not cover, such as embroidery."
        >
          {customRows.map(row => (
            <View key={row.id} style={styles.customRow}>
              <TextInput
                style={[s.input, styles.flex]}
                placeholder="Feature"
                value={row.name}
                onChangeText={text =>
                  setCustomRows(current =>
                    current.map(entry =>
                      entry.id === row.id ? { ...entry, name: text } : entry,
                    ),
                  )
                }
              />
              <TextInput
                style={[s.input, styles.flex]}
                placeholder="Value"
                value={row.value}
                onChangeText={text =>
                  setCustomRows(current =>
                    current.map(entry =>
                      entry.id === row.id ? { ...entry, value: text } : entry,
                    ),
                  )
                }
              />
              <TouchableOpacity
                onPress={() =>
                  setCustomRows(current =>
                    current.filter(entry => entry.id !== row.id),
                  )
                }
                accessibilityLabel="Remove detail"
              >
                <X size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={s.secondaryButton}
            onPress={() =>
              setCustomRows(current => [
                ...current,
                { id: Date.now(), name: '', value: '' },
              ])
            }
          >
            <Plus size={14} color="#2563eb" />
            <Text style={s.secondaryButtonText}>Add a detail</Text>
          </TouchableOpacity>
        </OrderStep>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {blocker ? <Text style={styles.blocker}>{blocker}</Text> : null}
        <View style={styles.footerRow}>
          <View>
            <Text style={s.hint}>
              {formatCurrency(unitPrice)} × {pieces}
            </Text>
            <Text style={styles.total}>
              {formatCurrency(unitPrice * pieces)}
            </Text>
          </View>
          <View style={styles.footerButton}>
            <SubmitButton
              label="Add to cart"
              onPress={handleAdd}
              isLoading={addItem.isPending}
              disabled={Boolean(blocker)}
            />
          </View>
        </View>
      </View>

      <SingleSelectModal
        visible={sheet === 'class'}
        onClose={() => setSheet(null)}
        title="Choose the class"
        options={[
          ...(choosesStudents
            ? []
            : [{ value: WHOLE_SCHOOL, label: 'Whole school' }]),
          ...sections.map(item => ({
            value: item.public_id,
            label: classLabel(item),
          })),
        ]}
        selectedValue={classId}
        onSelect={value => chooseClass(value)}
      />
      <MultiSelectModal
        visible={sheet === 'students'}
        onClose={() => setSheet(null)}
        title="Select students"
        options={classStudents.options}
        selectedValues={pickedIds}
        onToggle={value =>
          setPickedIds(current =>
            current.includes(value)
              ? current.filter(id => id !== value)
              : [...current, value],
          )
        }
        onSave={() => undefined}
        saveButtonText={`Done (${pickedIds.length} selected)`}
        searchable
        searchPlaceholder="Name or roll number"
      />
      <SingleSelectModal
        visible={sheet === 'preview'}
        onClose={() => setSheet(null)}
        title="Preview as"
        options={chosenStudents.map(student => ({
          value: student.public_id,
          label: student.full_name,
        }))}
        selectedValue={previewStudent}
        onSelect={value => setPreviewId(value)}
      />
    </>
  );
}

export default function StoreOrderScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'StoreOrder'>>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCatalog();
  const product = data?.data.find(
    item => item.public_id === route.params.productId,
  );

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product ? `Order ${product.name}` : 'Order'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      {isLoading ? (
        <LoadingState color={ORDER_COLOURS.accent} />
      ) : product ? (
        <OrderForm key={product.public_id} product={product} />
      ) : (
        <Text style={[s.hint, styles.missing]}>
          This product is not available.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ORDER_COLOURS.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: ORDER_COLOURS.text,
    marginHorizontal: 12,
  },
  headerSpacer: { width: 24 },
  content: { padding: 16, paddingBottom: 32 },
  missing: { padding: 24, textAlign: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: ORDER_COLOURS.accentSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  heroImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImageInner: { width: '100%', height: '100%' },
  heroTitle: { fontSize: 16, fontWeight: '700', color: ORDER_COLOURS.text },
  previewRow: { flexDirection: 'row', gap: 10 },
  everyone: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  everyoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ORDER_COLOURS.accentText,
  },
  studentRow: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 10,
    gap: 8,
  },
  studentName: { fontSize: 14, fontWeight: '600', color: ORDER_COLOURS.text },
  sizeField: { gap: 4 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: ORDER_COLOURS.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  blocker: {
    fontSize: 12,
    color: ORDER_COLOURS.warning,
    backgroundColor: ORDER_COLOURS.warningSoft,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  total: { fontSize: 20, fontWeight: '800', color: ORDER_COLOURS.accent },
  footerButton: { flex: 1, maxWidth: 200 },
});
