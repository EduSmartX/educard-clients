/**
 * Store Product Setup Screen - customise one product for the school, then publish it.
 *
 * EduCard's master product is shown until the school customises it. Every mandatory
 * field must be filled before "Save & publish"; only published products can be ordered.
 */
import {
  PRODUCT_KIND,
  getErrorMessage,
  type CatalogProduct,
  type ProductAttribute,
  type ProductClassLook,
} from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import {
  CheckCircle2,
  ChevronLeft,
  Circle,
  ImageOff,
  ImagePlus,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { getMediaUrl } from '@/constants/config';
import {
  formatCurrency,
  pickStoreImage,
  schoolAttributes,
  useAddProductPhoto,
  useCatalog,
  useProductLooks,
  useSaveClassLook,
  useSaveProductCustomization,
  useUnpublishProduct,
} from '@/features/store';
import { AttributeInput } from '@/features/store/components/AttributeInput';
import {
  ClassScopePicker,
  WHOLE_SCHOOL_SCOPE,
  isScopeComplete,
  scopeClassIds,
  useGradeOptions,
  type ClassScope,
} from '@/features/store/components/ClassScopePicker';
import {
  ORDER_COLOURS,
  OrderStep,
} from '@/features/store/components/OrderParts';
import { ProductPhotoGrid } from '@/features/store/components/ProductPhotoGrid';
import { storeStyles as s } from '@/features/store/components/store-styles';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { layoutStyles } from '@/styles';
import { showToast } from '@/utils/toast';

import { PublishBadge } from './setup/ProductLooksSetup';

function PhotoUploader({ product }: { product: CatalogProduct }) {
  const [scope, setScope] = useState<ClassScope>(WHOLE_SCHOOL_SCOPE);
  const add = useAddProductPhoto(product.public_id);

  const upload = async () => {
    const image = await pickStoreImage();
    if (!image) {
      return;
    }
    add.mutate(
      { image, classPublicIds: scopeClassIds(scope) },
      {
        onSuccess: () => showToast('success', 'Photo added'),
        onError: error =>
          showToast('error', getErrorMessage(error, 'Upload failed')),
      },
    );
  };

  return (
    <View style={styles.uploader}>
      <Text style={s.label}>Add a photo for</Text>
      <ClassScopePicker value={scope} onChange={setScope} />
      <TouchableOpacity
        style={[s.secondaryButton, !isScopeComplete(scope) && styles.disabled]}
        disabled={!isScopeComplete(scope) || add.isPending}
        onPress={() => void upload()}
      >
        {add.isPending ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <ImagePlus size={16} color="#2563eb" />
        )}
        <Text style={s.secondaryButtonText}>Choose photo</Text>
      </TouchableOpacity>
    </View>
  );
}

function ClassDifferences({
  product,
  attributes,
  looks,
  sectionForGrade,
}: {
  product: CatalogProduct;
  attributes: ProductAttribute[];
  looks: ProductClassLook[];
  sectionForGrade: (gradeId: number) => string | undefined;
}) {
  const [scope, setScope] = useState<ClassScope>({
    wholeSchool: false,
    classIds: [],
  });
  const [values, setValues] = useState<Record<string, string>>({});
  const save = useSaveClassLook(product.public_id);
  const school = product.organization_properties ?? {};
  const overrides = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value),
  );
  const withOverrides = looks.filter(
    look => Object.keys(look.properties).length > 0,
  );

  const describe = (look: ProductClassLook) =>
    Object.entries(look.properties)
      .map(([code, value]) => {
        const attribute = attributes.find(item => item.code === code);
        const option = attribute?.options.find(item => item.value === value);
        return `${attribute?.display_name ?? code}: ${
          option?.display_label ?? value
        }`;
      })
      .join(' · ');

  const onError = (error: unknown) =>
    showToast('error', getErrorMessage(error, 'Could not save'));

  return (
    <View style={styles.gap}>
      {withOverrides.map(look => (
        <View key={look.class_master_id} style={styles.overrideRow}>
          <View style={styles.flex}>
            <Text style={styles.strong}>{look.class_name}</Text>
            <Text style={s.hint}>{describe(look)}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Remove ${look.class_name} differences`}
            onPress={() => {
              const section = sectionForGrade(look.class_master_id);
              if (section) {
                save.mutate(
                  { class_public_ids: [section], properties: {} },
                  {
                    onSuccess: () =>
                      showToast(
                        'success',
                        `${look.class_name} now follows the school`,
                      ),
                    onError,
                  },
                );
              }
            }}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.differenceBox}>
        <Text style={s.label}>Classes that differ</Text>
        <ClassScopePicker value={scope} onChange={setScope} classesOnly />
        {attributes.map(attribute => {
          const inherited = attribute.options.find(
            option => option.value === school[attribute.code],
          );
          return (
            <View key={attribute.code} style={styles.gapSmall}>
              <Text style={s.label}>{attribute.display_name}</Text>
              <AttributeInput
                attribute={attribute}
                value={values[attribute.code] ?? ''}
                inheritLabel={`Same as school${
                  inherited ? ` (${inherited.display_label})` : ''
                }`}
                placeholder={
                  school[attribute.code]
                    ? `School: ${school[attribute.code]}`
                    : ''
                }
                onChange={value =>
                  setValues(current => ({
                    ...current,
                    [attribute.code]: value,
                  }))
                }
              />
            </View>
          );
        })}
        <TouchableOpacity
          style={[
            s.secondaryButton,
            (scope.classIds.length === 0 ||
              Object.keys(overrides).length === 0) &&
              styles.disabled,
          ]}
          disabled={
            scope.classIds.length === 0 ||
            Object.keys(overrides).length === 0 ||
            save.isPending
          }
          onPress={() =>
            save.mutate(
              { class_public_ids: scope.classIds, properties: overrides },
              {
                onSuccess: () => {
                  showToast(
                    'success',
                    `Saved for ${scope.classIds.length} class(es)`,
                  );
                  setScope({ wholeSchool: false, classIds: [] });
                  setValues({});
                },
                onError,
              },
            )
          }
        >
          <Text style={s.secondaryButtonText}>
            Apply to {scope.classIds.length || 'selected'} class
            {scope.classIds.length === 1 ? '' : 'es'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SetupForm({ product }: { product: CatalogProduct }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [values, setValues] = useState<Record<string, string>>(
    () => product.organization_properties ?? {},
  );
  const save = useSaveProductCustomization(product.public_id);
  const unpublish = useUnpublishProduct(product.public_id);
  const looks = useProductLooks(product.public_id);
  const grades = useGradeOptions();

  const attributes = schoolAttributes(product);
  const required = attributes.filter(attribute => attribute.is_required);
  const requiredNames = required.map(
    attribute => attribute.display_name || attribute.code,
  );
  const otherBlockers = product.publish_blockers.filter(
    item => !requiredNames.includes(item),
  );
  const checklist = [
    ...required.map(attribute => ({
      label: attribute.display_name,
      done: Boolean(values[attribute.code]),
    })),
    ...otherBlockers.map(item => ({ label: item, done: false })),
  ];
  const ready = checklist.every(item => item.done);

  const sectionForGrade = useMemo(() => {
    const map = new Map(grades.map(option => [option.gradeId, option.value]));
    return (gradeId: number) => map.get(gradeId);
  }, [grades]);
  const classLooks = looks.data?.data.classes ?? [];

  const submit = (publish: boolean) =>
    save.mutate(
      { name, description, properties: values, publish },
      {
        onSuccess: response => showToast('success', response.message),
        onError: error =>
          showToast('error', getErrorMessage(error, 'Could not save')),
      },
    );

  let step = 0;
  const nextStep = () => ++step;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <OrderStep
          step={nextStep()}
          title="Product information"
          description="Leave as is to use EduCard's wording."
        >
          <View style={styles.infoRow}>
            <View style={styles.image}>
              {product.image_url ? (
                <Image
                  source={{ uri: getMediaUrl(product.image_url) }}
                  style={styles.imageInner}
                  resizeMode="contain"
                />
              ) : (
                <ImageOff size={24} color="#9ca3af" />
              )}
            </View>
            <View style={styles.flex}>
              <Text style={s.hint}>
                {product.kind === PRODUCT_KIND.BOOK_SET
                  ? 'Priced per approved book list'
                  : `${formatCurrency(product.price)} / ${product.unit_label}`}
              </Text>
            </View>
          </View>
          <View style={styles.gapSmall}>
            <Text style={s.label}>Name</Text>
            <TextInput
              style={s.input}
              value={name}
              maxLength={150}
              onChangeText={setName}
            />
          </View>
          <View style={styles.gapSmall}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, styles.multiline]}
              value={description}
              multiline
              maxLength={2000}
              onChangeText={setDescription}
            />
          </View>
          {(name !== product.master_name ||
            description !== product.master_description) && (
            <TouchableOpacity
              onPress={() => {
                setName(product.master_name);
                setDescription(product.master_description);
              }}
            >
              <Text style={styles.link}>Use EduCard&apos;s wording</Text>
            </TouchableOpacity>
          )}
        </OrderStep>

        <OrderStep
          step={nextStep()}
          title="Details EduCard needs"
          description="Fields marked * are mandatory before publishing."
          complete={required.every(attribute =>
            Boolean(values[attribute.code]),
          )}
        >
          {attributes.length === 0 ? (
            <Text style={s.hint}>
              EduCard needs nothing from your school for this product; sizes are
              chosen when ordering.
            </Text>
          ) : (
            attributes.map(attribute => (
              <View key={attribute.code} style={styles.gapSmall}>
                <Text style={s.label}>
                  {attribute.display_name}
                  {attribute.is_required ? ' *' : ' (optional)'}
                </Text>
                <AttributeInput
                  attribute={attribute}
                  value={values[attribute.code] ?? ''}
                  onChange={value =>
                    setValues(current => ({
                      ...current,
                      [attribute.code]: value,
                    }))
                  }
                />
              </View>
            ))
          )}
          {product.kind === PRODUCT_KIND.ID_CARD && (
            <Text style={s.hint}>
              ID card designs are chosen in Store Setup → ID cards. At least one
              approved design is needed to publish.
            </Text>
          )}
          {product.kind === PRODUCT_KIND.BOOK_SET && (
            <Text style={s.hint}>
              Class book lists are requested on the web. At least one approved
              list is needed to publish.
            </Text>
          )}
        </OrderStep>

        {product.kind !== PRODUCT_KIND.BOOK_SET && (
          <OrderStep
            step={nextStep()}
            title="Photos"
            description="Add one for the whole school, or the same photo for several classes. The starred photo is the one shown."
          >
            <PhotoUploader product={product} />
            <Text style={styles.strong}>Whole school</Text>
            <ProductPhotoGrid
              productPublicId={product.public_id}
              photos={looks.data?.data.school.photos ?? []}
              emptyHint="No school photos yet: EduCard's picture is shown."
            />
            {classLooks
              .filter(look => look.photos.length > 0)
              .map(look => (
                <View key={look.class_master_id} style={styles.gapSmall}>
                  <Text style={styles.strong}>{look.class_name}</Text>
                  <ProductPhotoGrid
                    productPublicId={product.public_id}
                    classPublicId={sectionForGrade(look.class_master_id)}
                    photos={look.photos}
                    emptyHint=""
                  />
                </View>
              ))}
          </OrderStep>
        )}

        {attributes.length > 0 && (
          <OrderStep
            step={nextStep()}
            title="Differences for some classes (optional)"
            description="Everything else follows the school."
          >
            <ClassDifferences
              product={product}
              attributes={attributes}
              looks={classLooks}
              sectionForGrade={sectionForGrade}
            />
          </OrderStep>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {checklist.length > 0 && (
          <View style={styles.checklist}>
            {checklist.map(item => (
              <View key={item.label} style={styles.checkItem}>
                {item.done ? (
                  <CheckCircle2 size={14} color={ORDER_COLOURS.success} />
                ) : (
                  <Circle size={14} color="#f59e0b" />
                )}
                <Text style={s.hint}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.footerRow}>
          {product.is_published ? (
            <>
              <TouchableOpacity
                style={styles.secondary}
                disabled={unpublish.isPending}
                onPress={() =>
                  unpublish.mutate(undefined, {
                    onSuccess: response =>
                      showToast('success', response.message),
                    onError: error =>
                      showToast('error', getErrorMessage(error)),
                  })
                }
              >
                <Text style={styles.secondaryText}>Unpublish</Text>
              </TouchableOpacity>
              <View style={styles.flex}>
                <SubmitButton
                  label="Save changes"
                  onPress={() => submit(false)}
                  isLoading={save.isPending}
                  disabled={!ready}
                />
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.secondary}
                disabled={save.isPending}
                onPress={() => submit(false)}
              >
                <Text style={styles.secondaryText}>Save draft</Text>
              </TouchableOpacity>
              <View style={styles.flex}>
                <SubmitButton
                  label="Save & publish"
                  onPress={() => submit(true)}
                  isLoading={save.isPending}
                  disabled={!ready}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </>
  );
}

export default function StoreProductSetupScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route =
    useRoute<RouteProp<SharedStackParamList, 'StoreProductSetup'>>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCatalog({ page_size: 100 });
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
          {product ? `Set up ${product.name}` : 'Set up product'}
        </Text>
        {product ? (
          <PublishBadge published={product.is_published} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      {isLoading ? (
        <LoadingState color={ORDER_COLOURS.accent} />
      ) : product ? (
        <SetupForm
          key={`${product.public_id}-${product.publish_status}-${product.name}`}
          product={product}
        />
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
  gap: { gap: 12 },
  gapSmall: { gap: 6 },
  disabled: { opacity: 0.5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: ORDER_COLOURS.border,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: ORDER_COLOURS.text,
  },
  headerSpacer: { width: 24 },
  missing: { padding: 24, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageInner: { width: '100%', height: '100%' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  link: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  strong: { fontSize: 14, fontWeight: '600', color: ORDER_COLOURS.text },
  uploader: {
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#7dd3fc',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 12,
  },
  overrideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: ORDER_COLOURS.border,
    borderRadius: 10,
    padding: 10,
  },
  differenceBox: {
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: ORDER_COLOURS.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  checklist: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secondary: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
