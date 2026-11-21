/**
 * Bottom sheet to configure a product line: ID cards per chosen student (with a live
 * card preview), uniform-style products as size x quantity or per student, book sets.
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
  type Class,
  type StudentSizeEntry,
} from '@educard/shared';
import { Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/common';
import { useClasses } from '@/features/classes';
import {
  classLabel,
  formatCurrency,
  isSelectionComplete,
  lineAttributes,
  perStudentAttributes,
  resolveTemplate,
  useAddCartItem,
  useBookSets,
  useIdCardTemplates,
  type StudentSelection,
} from '@/features/store';
import { AttributeInput } from '@/features/store/components/AttributeInput';
import { CardPreviewImage } from '@/features/store/components/CardPreviewImage';
import { StudentSelectList } from '@/features/store/components/StudentSelectList';
import { storeStyles as s } from '@/features/store/components/store-styles';
import { showToast } from '@/utils/toast';

interface CustomFeatureRow {
  id: number;
  name: string;
  value: string;
}

type OrderMode = 'quantity' | 'students';

function parseListValue(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(entry => entry.trim())
    .filter(Boolean);
}

interface SectionChipsProps {
  sections: Class[];
  value: string;
  onChange: (value: string) => void;
  /** Label for an extra "no class" chip (value ''). */
  noneLabel?: string;
}

function SectionChips({
  sections,
  value,
  onChange,
  noneLabel,
}: SectionChipsProps) {
  const chip = (key: string, label: string) => {
    const active = key === value;
    return (
      <TouchableOpacity
        key={key || 'none'}
        style={[s.option, active && s.optionActive]}
        onPress={() => onChange(key)}
      >
        <Text style={[s.optionText, active && s.optionTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  return (
    <View style={s.optionRow}>
      {noneLabel !== undefined && chip('', noneLabel)}
      {sections.map(section => chip(section.public_id, classLabel(section)))}
    </View>
  );
}

interface ProductConfigSheetProps {
  product: CatalogProduct | null;
  onClose: () => void;
}

export function ProductConfigSheet({
  product,
  onClose,
}: ProductConfigSheetProps) {
  const insets = useSafeAreaInsets();
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [customFeatures, setCustomFeatures] = useState<CustomFeatureRow[]>([]);
  const [quantity, setQuantity] = useState('1');
  const [mode, setMode] = useState<OrderMode>('quantity');
  const [classId, setClassId] = useState('');
  const [selection, setSelection] = useState<StudentSelection>({});
  const [previewStudent, setPreviewStudent] = useState<{
    id: string;
    name: string;
  }>();
  const [bookSet, setBookSet] = useState<BookSet | undefined>();

  const isIdCard = product?.kind === PRODUCT_KIND.ID_CARD;
  const isBookSet = product?.kind === PRODUCT_KIND.BOOK_SET;
  const isStandard = Boolean(product) && !isIdCard && !isBookSet;
  const perStudent = isStandard && mode === 'students';

  const { data: classesData } = useClasses({ page_size: 100 });
  const { data: templatesResponse } = useIdCardTemplates(
    { status: APPROVAL_STATUS.APPROVED },
    isIdCard,
  );
  const { data: bookSetsResponse } = useBookSets(
    { status: APPROVAL_STATUS.APPROVED },
    isBookSet,
  );
  const addItem = useAddCartItem();

  const sections = useMemo(() => classesData?.classes ?? [], [classesData]);
  const bookSets = bookSetsResponse?.data ?? [];
  const selectedClass = sections.find(section => section.public_id === classId);
  const template = isIdCard
    ? selectedClass &&
      resolveTemplate(templatesResponse?.data ?? [], selectedClass)
    : undefined;

  const attributes = product ? lineAttributes(product) : [];
  const studentAttributes = perStudentAttributes(attributes);
  const selectedIds = Object.keys(selection);
  const choosesStudents = isIdCard || perStudent;
  const pieces = choosesStudents
    ? selectedIds.length
    : Math.max(1, Number(quantity) || 1);

  const chooseClass = (next: string) => {
    setClassId(next);
    setSelection({});
    setPreviewStudent(undefined);
  };

  const close = () => {
    setConfiguration({});
    setCustomFeatures([]);
    setQuantity('1');
    setMode('quantity');
    chooseClass('');
    setBookSet(undefined);
    onClose();
  };

  const lineComplete = attributes
    .filter(attribute => attribute.is_required)
    .every(attribute => {
      const value = configuration[attribute.code];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });

  let complete: boolean;
  if (isIdCard) {
    complete = Boolean(template) && selectedIds.length > 0;
  } else if (isBookSet) {
    complete = Boolean(bookSet) && lineComplete;
  } else if (perStudent) {
    complete =
      Boolean(classId) && isSelectionComplete(selection, studentAttributes);
  } else {
    complete = lineComplete;
  }

  const handleAdd = () => {
    if (!product) {
      return;
    }
    const custom = customFeatures.reduce<Record<string, string>>((acc, row) => {
      const name = row.name.trim();
      const value = row.value.trim();
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {});

    // Per-student lines carry sizes on each student, not on the line.
    const payload: CartItemConfiguration = perStudent
      ? {}
      : { ...configuration };
    if (Object.keys(custom).length > 0) {
      payload[CUSTOM_FEATURES_KEY] = custom;
    }
    if (classId) {
      payload[STORE_CONFIG_KEY.CLASS] = classId;
    }
    if (isIdCard) {
      payload[STORE_CONFIG_KEY.STUDENT_IDS] = selectedIds;
    }
    if (perStudent) {
      payload[STORE_CONFIG_KEY.STUDENTS] = Object.entries(selection).map(
        ([student, values]): StudentSizeEntry => ({ student, ...values }),
      );
    }
    if (isBookSet && bookSet) {
      payload[STORE_CONFIG_KEY.BOOK_SET] = bookSet.public_id;
    }

    addItem.mutate(
      {
        product_public_id: product.public_id,
        // The server counts one piece per chosen student.
        quantity: choosesStudents ? undefined : pieces,
        configuration: payload,
      },
      {
        onSuccess: () => {
          showToast('success', `${product.name} added to cart`);
          close();
        },
        onError: error =>
          showToast('error', getErrorMessage(error, 'Could not add this item')),
      },
    );
  };

  const unitPrice = isBookSet
    ? Number(bookSet?.price ?? 0)
    : Number(product?.price ?? 0);
  const previewFor =
    previewStudent ??
    (selectedIds[0] ? { id: selectedIds[0], name: '' } : undefined);
  const orientation = template?.design?.orientation ?? 'landscape';

  return (
    <Modal
      visible={Boolean(product)}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.title}>{product?.name}</Text>
          <Text style={s.hint}>
            {isBookSet
              ? bookSet
                ? `${formatCurrency(bookSet.price)} / set`
                : 'Priced from the class book list'
              : `${formatCurrency(product?.price ?? 0)} / ${
                  product?.unit_label ?? ''
                }`}
          </Text>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {isIdCard && (
              <View style={s.field}>
                <Text style={s.label}>Class *</Text>
                <SectionChips
                  sections={sections}
                  value={classId}
                  onChange={chooseClass}
                />
                {selectedClass && !template && (
                  <Text style={s.error}>
                    No approved ID card design for {classLabel(selectedClass)}{' '}
                    yet. Pick one in Store Setup.
                  </Text>
                )}
              </View>
            )}

            {isIdCard && template?.can_preview && (
              <View style={[s.field, styles.preview]}>
                <Text style={s.hint}>
                  {previewFor?.name
                    ? `Preview for ${previewFor.name}`
                    : previewFor
                    ? 'Preview for the first selected student'
                    : 'Sample details. Tick a student or tap the eye to see theirs.'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.previewRow}>
                    <CardPreviewImage
                      path={template.front_preview_url}
                      student={previewFor?.id}
                      orientation={orientation}
                    />
                    {template.design?.has_back && (
                      <CardPreviewImage
                        path={template.back_preview_url}
                        student={previewFor?.id}
                        orientation={orientation}
                      />
                    )}
                  </View>
                </ScrollView>
              </View>
            )}

            {isBookSet && (
              <View style={s.field}>
                <Text style={s.label}>Book set *</Text>
                {bookSets.length === 0 ? (
                  <Text style={s.error}>
                    No approved book sets yet. Request one in Store Setup on the
                    web.
                  </Text>
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
              </View>
            )}

            {isStandard && (
              <View style={s.field}>
                <View style={styles.modeRow}>
                  {(
                    [
                      ['quantity', 'Size × quantity', 'Same for every piece'],
                      ['students', 'Per student', "Each student's own sizes"],
                    ] as const
                  ).map(([value, label, hint]) => {
                    const active = mode === value;
                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.mode, active && s.optionActive]}
                        onPress={() => {
                          setMode(value);
                          chooseClass('');
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Text
                          style={[s.optionText, active && s.optionTextActive]}
                        >
                          {label}
                        </Text>
                        <Text style={s.hint}>{hint}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {isStandard && (
              <View style={s.field}>
                <Text style={s.label}>
                  {perStudent
                    ? 'Class *'
                    : "Class (optional, uses the class's look)"}
                </Text>
                <SectionChips
                  sections={sections}
                  value={classId}
                  onChange={chooseClass}
                  noneLabel={perStudent ? undefined : 'Whole school'}
                />
              </View>
            )}

            {((isIdCard && template) || (perStudent && classId)) && (
              <View style={s.field}>
                <Text style={s.label}>Students *</Text>
                <StudentSelectList
                  classPublicId={classId}
                  selection={selection}
                  onChange={setSelection}
                  attributes={perStudent ? studentAttributes : []}
                  showPhotoStatus={isIdCard}
                  previewStudent={previewStudent?.id}
                  onPreview={
                    isIdCard && template?.can_preview
                      ? student =>
                          setPreviewStudent({
                            id: student.public_id,
                            name: student.full_name,
                          })
                      : undefined
                  }
                />
              </View>
            )}

            {!perStudent &&
              attributes.map(attribute => (
                <View key={attribute.code} style={s.field}>
                  <Text style={s.label}>
                    {attribute.display_name}
                    {attribute.is_required ? ' *' : ''}
                  </Text>
                  {attribute.input_type ===
                  PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST ? (
                    <TextInput
                      style={[s.input, styles.multiline]}
                      multiline
                      placeholder="IDs separated by commas or spaces"
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

            <View style={s.field}>
              <View style={styles.customHeader}>
                <Text style={s.label}>Custom features</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() =>
                    setCustomFeatures(current => [
                      ...current,
                      { id: Date.now(), name: '', value: '' },
                    ])
                  }
                >
                  <Plus size={14} color="#2563eb" />
                  <Text style={s.secondaryButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {customFeatures.length === 0 ? (
                <Text style={s.hint}>
                  Add anything the catalog does not cover, such as embroidery
                  text.
                </Text>
              ) : (
                customFeatures.map(row => (
                  <View key={row.id} style={styles.customRow}>
                    <TextInput
                      style={[s.input, styles.customInput]}
                      placeholder="Feature"
                      value={row.name}
                      onChangeText={text =>
                        setCustomFeatures(current =>
                          current.map(entry =>
                            entry.id === row.id
                              ? { ...entry, name: text }
                              : entry,
                          ),
                        )
                      }
                    />
                    <TextInput
                      style={[s.input, styles.customInput]}
                      placeholder="Value"
                      value={row.value}
                      onChangeText={text =>
                        setCustomFeatures(current =>
                          current.map(entry =>
                            entry.id === row.id
                              ? { ...entry, value: text }
                              : entry,
                          ),
                        )
                      }
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setCustomFeatures(current =>
                          current.filter(entry => entry.id !== row.id),
                        )
                      }
                      accessibilityLabel="Remove feature"
                    >
                      <X size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <View style={s.field}>
              <Text style={s.label}>Quantity</Text>
              {choosesStudents ? (
                <Text style={s.hint}>{pieces} (one per selected student)</Text>
              ) : (
                <TextInput
                  style={s.input}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              )}
            </View>
          </ScrollView>

          <Text style={styles.total}>
            Total {formatCurrency(unitPrice * pieces)}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancel} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <SubmitButton
              label="Add to cart"
              onPress={handleAdd}
              isLoading={addItem.isPending}
              disabled={!product || !complete}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  scroll: { marginTop: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  preview: { gap: 8 },
  previewRow: { flexDirection: 'row', gap: 10 },
  modeRow: { flexDirection: 'row', gap: 8 },
  mode: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customInput: { flex: 1 },
  total: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
