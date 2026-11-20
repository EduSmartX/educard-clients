/**
 * Store Catalog Screen - browse and configure products for a bulk order
 */

import {
  APPROVAL_STATUS,
  CUSTOM_FEATURES_KEY,
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  PRODUCT_ATTRIBUTE_SCOPE,
  PRODUCT_KIND,
  STORE_CONFIG_KEY,
  getErrorMessage,
  type BookSet,
  type CartItemConfiguration,
  type CatalogProduct,
  type Class,
  type IdCardTemplate,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Plus, ShoppingCart, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
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
import { EmptyState, LoadingState } from '@/components/common/ListStates';
import { useClasses } from '@/features/classes';
import {
  useAddCartItem,
  useBookSets,
  useCart,
  useCatalog,
  useIdCardTemplates,
} from '@/features/store';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

interface CustomFeatureRow {
  id: number;
  name: string;
  value: string;
}

function parseListValue(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(entry => entry.trim())
    .filter(Boolean);
}

/** School-level attributes are set once on the web Store Setup page, not per line. */
function lineAttributes(product: CatalogProduct) {
  return product.attributes.filter(
    attribute => attribute.scope !== PRODUCT_ATTRIBUTE_SCOPE.ORGANIZATION,
  );
}

function isComplete(
  product: CatalogProduct,
  configuration: CartItemConfiguration,
): boolean {
  return lineAttributes(product)
    .filter(attribute => attribute.is_required)
    .every(attribute => {
      const value = configuration[attribute.code];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
}

/** One entry per grade: templates and book sets are approved per grade. */
function classLabel(section: Class): string {
  return (
    section.display_name ||
    [section.class_master?.name, section.name].filter(Boolean).join(' - ')
  );
}

/** The approved template that will print for a section: its grade's, else the default. */
function resolveTemplate(
  templates: IdCardTemplate[],
  section: Class | undefined,
): IdCardTemplate | undefined {
  const grade = section?.class_master?.name;
  return (
    templates.find(
      template =>
        !template.is_default && Boolean(grade) && template.class_name === grade,
    ) ?? templates.find(template => template.is_default)
  );
}

export default function StoreCatalogScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [configuration, setConfiguration] = useState<CartItemConfiguration>({});
  const [customFeatures, setCustomFeatures] = useState<CustomFeatureRow[]>([]);
  const [quantity, setQuantity] = useState('1');
  const [classId, setClassId] = useState('');
  const [bookSet, setBookSet] = useState<BookSet | undefined>();

  const isIdCard = selected?.kind === PRODUCT_KIND.ID_CARD;
  const isBookSet = selected?.kind === PRODUCT_KIND.BOOK_SET;

  const { data, isLoading } = useCatalog();
  const { data: cartResponse } = useCart();
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

  const products = data?.data ?? [];
  const cartCount = cartResponse?.data?.item_count ?? 0;
  const classes = useMemo(() => classesData?.classes ?? [], [classesData]);
  const templates = templatesResponse?.data ?? [];
  const bookSets = bookSetsResponse?.data ?? [];
  const selectedClass = classes.find(section => section.public_id === classId);
  const template = selectedClass
    ? resolveTemplate(templates, selectedClass)
    : undefined;

  const visibleAttributes = selected ? lineAttributes(selected) : [];

  const kindComplete = isIdCard
    ? Boolean(template)
    : isBookSet
      ? Boolean(bookSet)
      : true;

  const closeModal = () => {
    setSelected(null);
    setConfiguration({});
    setCustomFeatures([]);
    setQuantity('1');
    setClassId('');
    setBookSet(undefined);
  };

  const openProduct = (product: CatalogProduct) => {
    if (product.setup_required) {
      showToast(
        'info',
        `Set ${product.missing_properties.join(', ')} for ${product.name} in Store Setup on the web first.`,
      );
      return;
    }
    setSelected(product);
  };

  const handleAdd = () => {
    if (!selected) {
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

    const payload: CartItemConfiguration = { ...configuration };
    if (Object.keys(custom).length > 0) {
      payload[CUSTOM_FEATURES_KEY] = custom;
    }
    if (isIdCard) {
      payload[STORE_CONFIG_KEY.CLASS] = classId;
    }
    if (isBookSet && bookSet) {
      payload[STORE_CONFIG_KEY.BOOK_SET] = bookSet.public_id;
    }

    addItem.mutate(
      {
        product_public_id: selected.public_id,
        quantity: Math.max(1, Number(quantity) || 1),
        configuration: payload,
      },
      {
        onSuccess: () => {
          showToast('success', `${selected.name} added to cart`);
          closeModal();
        },
        onError: error =>
          showToast('error', getErrorMessage(error, 'Could not add this item')),
      },
    );
  };

  const renderProduct = ({ item }: { item: CatalogProduct }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openProduct(item)}
      activeOpacity={0.8}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.category_name}</Text>
        <Text style={styles.cardPrice}>
          {item.kind === PRODUCT_KIND.BOOK_SET
            ? 'Priced per class'
            : `${formatCurrency(item.price)} / ${item.unit_label}`}
        </Text>
        {item.setup_required && (
          <Text style={styles.setupRequired}>Setup required</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store</Text>
        <TouchableOpacity onPress={() => navigation.navigate('StoreCart')}>
          <View>
            <ShoppingCart size={22} color="#111827" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingState color="#2563eb" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={40} color="#9ca3af" />}
          message="No products available"
          subMessage="No store products have been enabled for your school yet."
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.public_id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={Boolean(selected)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}
          >
            <Text style={styles.modalTitle}>{selected?.name}</Text>
            <Text style={styles.cardMeta}>
              {isBookSet
                ? bookSet
                  ? `${formatCurrency(bookSet.price)} / set`
                  : 'Priced from the class book list'
                : `${selected ? formatCurrency(selected.price) : ''} / ${selected?.unit_label ?? ''}`}
            </Text>

            <ScrollView style={styles.modalScroll}>
              {isIdCard && (
                <View style={styles.field}>
                  <Text style={styles.label}>Class *</Text>
                  <View style={styles.optionRow}>
                    {classes.map(section => {
                      const active = section.public_id === classId;
                      return (
                        <TouchableOpacity
                          key={section.public_id}
                          style={[styles.option, active && styles.optionActive]}
                          onPress={() => setClassId(section.public_id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              active && styles.optionTextActive,
                            ]}
                          >
                            {classLabel(section)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedClass && template && (
                    <View style={styles.templateRow}>
                      {template.image_url ? (
                        <Image
                          source={{ uri: template.image_url }}
                          style={styles.templateThumb}
                        />
                      ) : null}
                      <Text style={styles.hint}>
                        {template.name} (
                        {template.is_default
                          ? 'school default'
                          : template.class_name}
                        )
                      </Text>
                    </View>
                  )}
                  {selectedClass && !template && (
                    <Text style={styles.setupRequired}>
                      No approved ID card template for{' '}
                      {classLabel(selectedClass)}. Upload one in Store Setup on
                      the web.
                    </Text>
                  )}
                </View>
              )}

              {isBookSet && (
                <View style={styles.field}>
                  <Text style={styles.label}>Book set *</Text>
                  {bookSets.length === 0 ? (
                    <Text style={styles.setupRequired}>
                      No approved book sets yet. Request one in Store Setup on
                      the web.
                    </Text>
                  ) : (
                    <View style={styles.optionRow}>
                      {bookSets.map(set => {
                        const active = set.public_id === bookSet?.public_id;
                        return (
                          <TouchableOpacity
                            key={set.public_id}
                            style={[
                              styles.option,
                              active && styles.optionActive,
                            ]}
                            onPress={() => setBookSet(set)}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                active && styles.optionTextActive,
                              ]}
                            >
                              {set.class_name} — {set.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                  {bookSet?.items.map((book, index) => (
                    <Text key={`${book.title}-${index}`} style={styles.hint}>
                      {book.title}
                      {book.quantity > 1 ? ` × ${book.quantity}` : ''} ·{' '}
                      {formatCurrency(book.line_total)}
                    </Text>
                  ))}
                </View>
              )}

              {visibleAttributes.map(attribute => (
                <View key={attribute.code} style={styles.field}>
                  <Text style={styles.label}>
                    {attribute.display_name}
                    {attribute.is_required ? ' *' : ''}
                  </Text>

                  {attribute.input_type ===
                    PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT && (
                    <View style={styles.optionRow}>
                      {attribute.options.map(option => {
                        const active =
                          configuration[attribute.code] === option.value;
                        return (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.option,
                              active && styles.optionActive,
                            ]}
                            onPress={() =>
                              setConfiguration(current => ({
                                ...current,
                                [attribute.code]: option.value,
                              }))
                            }
                          >
                            <Text
                              style={[
                                styles.optionText,
                                active && styles.optionTextActive,
                              ]}
                            >
                              {option.display_label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {attribute.input_type ===
                    PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST && (
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      multiline
                      placeholder="IDs separated by commas or spaces"
                      onChangeText={text =>
                        setConfiguration(current => ({
                          ...current,
                          [attribute.code]: parseListValue(text),
                        }))
                      }
                    />
                  )}

                  {(attribute.input_type ===
                    PRODUCT_ATTRIBUTE_INPUT_TYPE.TEXT ||
                    attribute.input_type ===
                      PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER) && (
                    <TextInput
                      style={styles.input}
                      keyboardType={
                        attribute.input_type ===
                        PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER
                          ? 'numeric'
                          : 'default'
                      }
                      onChangeText={text =>
                        setConfiguration(current => ({
                          ...current,
                          [attribute.code]: text,
                        }))
                      }
                    />
                  )}
                </View>
              ))}

              <View style={styles.field}>
                <View style={styles.customHeader}>
                  <Text style={styles.label}>Custom features</Text>
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
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {customFeatures.length === 0 ? (
                  <Text style={styles.hint}>
                    Add anything the catalog does not cover, such as embroidery
                    text.
                  </Text>
                ) : (
                  customFeatures.map(row => (
                    <View key={row.id} style={styles.customRow}>
                      <TextInput
                        style={[styles.input, styles.customInput]}
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
                        style={[styles.input, styles.customInput]}
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

              <View style={styles.field}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <SubmitButton
                label="Add to cart"
                onPress={handleAdd}
                isLoading={addItem.isPending}
                disabled={
                  !selected ||
                  !kindComplete ||
                  !isComplete(selected, configuration)
                }
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  thumb: { width: 88, height: 88 },
  thumbFallback: { backgroundColor: '#f3f4f6' },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalScroll: { marginTop: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  optionActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 13, color: '#374151' },
  optionTextActive: { color: '#2563eb', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  hint: { fontSize: 12, color: '#6b7280' },
  setupRequired: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 4,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  templateThumb: { width: 64, height: 40, borderRadius: 4 },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customInput: { flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
