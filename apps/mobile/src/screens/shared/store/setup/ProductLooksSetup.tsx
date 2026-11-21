/**
 * Store Setup > Products: how each product looks for the school (values such as shirt
 * colour, and photos), with optional per-class overrides. EduCard decides which
 * properties are set here and which are mandatory; sizes are chosen per order.
 */
import {
  PRODUCT_KIND,
  getErrorMessage,
  type CatalogProduct,
  type ProductClassLook,
} from '@educard/shared';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SubmitButton } from '@/components/common';
import { useClasses } from '@/features/classes';
import {
  oneSectionPerGrade,
  schoolAttributes,
  useCatalog,
  useProductLooks,
  useSaveClassLook,
  useUpdateProductProperties,
} from '@/features/store';
import { AttributeInput } from '@/features/store/components/AttributeInput';
import { ProductPhotoGrid } from '@/features/store/components/ProductPhotoGrid';
import { storeStyles as s } from '@/features/store/components/store-styles';
import { showToast } from '@/utils/toast';

const SCHOOL = 'school';

function SchoolScope({ product }: { product: CatalogProduct }) {
  const [values, setValues] = useState<Record<string, string>>(
    () => product.organization_properties ?? {},
  );
  const save = useUpdateProductProperties();
  const looks = useProductLooks(product.public_id);
  const attributes = schoolAttributes(product);
  const missingRequired = attributes.some(
    attribute => attribute.is_required && !values[attribute.code],
  );

  return (
    <View>
      {attributes.map(attribute => (
        <View key={attribute.code} style={s.field}>
          <Text style={s.label}>
            {attribute.display_name}
            {attribute.is_required ? ' *' : ' (optional)'}
          </Text>
          <AttributeInput
            attribute={attribute}
            value={values[attribute.code] ?? ''}
            onChange={value =>
              setValues(current => ({ ...current, [attribute.code]: value }))
            }
          />
        </View>
      ))}
      {attributes.length > 0 && (
        <View style={s.field}>
          <SubmitButton
            label="Save"
            isLoading={save.isPending}
            disabled={missingRequired}
            onPress={() =>
              save.mutate(
                { publicId: product.public_id, properties: values },
                {
                  onSuccess: () =>
                    showToast('success', `${product.name} saved`),
                  onError: error =>
                    showToast(
                      'error',
                      getErrorMessage(error, 'Could not save'),
                    ),
                },
              )
            }
          />
        </View>
      )}
      <Text style={s.label}>School photos</Text>
      {looks.isLoading ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        <ProductPhotoGrid
          productPublicId={product.public_id}
          photos={looks.data?.data.school.photos ?? []}
          emptyHint="No photos yet: EduCard's picture is shown. Add your school's own."
        />
      )}
    </View>
  );
}

interface ClassScopeProps {
  product: CatalogProduct;
  gradeName: string;
  sectionPublicId: string;
  look: ProductClassLook | undefined;
}

function ClassScope({
  product,
  gradeName,
  sectionPublicId,
  look,
}: ClassScopeProps) {
  const [values, setValues] = useState<Record<string, string>>(
    () => look?.properties ?? {},
  );
  const save = useSaveClassLook(product.public_id);
  const attributes = schoolAttributes(product);
  const school = product.organization_properties ?? {};

  const submit = (properties: Record<string, string>, message: string) =>
    save.mutate(
      { class_public_id: sectionPublicId, properties },
      {
        onSuccess: () => showToast('success', message),
        onError: error =>
          showToast('error', getErrorMessage(error, 'Could not save')),
      },
    );

  return (
    <View>
      {attributes.length > 0 && (
        <>
          <Text style={[s.hint, styles.gap]}>
            Only set what is different for {gradeName}; the rest follows the
            school.
          </Text>
          {attributes.map(attribute => {
            const inherited = attribute.options.find(
              option => option.value === school[attribute.code],
            );
            return (
              <View key={attribute.code} style={s.field}>
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
          <View style={[s.field, styles.row]}>
            <SubmitButton
              label={`Save for ${gradeName}`}
              isLoading={save.isPending}
              onPress={() =>
                submit(
                  Object.fromEntries(
                    Object.entries(values).filter(([, value]) => value),
                  ),
                  `${gradeName} saved`,
                )
              }
            />
          </View>
          {look && Object.keys(look.properties).length > 0 && (
            <TouchableOpacity
              style={[s.secondaryButton, styles.reset]}
              onPress={() => {
                setValues({});
                submit({}, `${gradeName} now follows the school`);
              }}
            >
              <Text style={s.secondaryButtonText}>Use school settings</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <Text style={s.label}>{gradeName} photos</Text>
      <ProductPhotoGrid
        productPublicId={product.public_id}
        classPublicId={sectionPublicId}
        photos={look?.photos ?? []}
        emptyHint={`No ${gradeName} photos: the school's photo is shown.`}
      />
    </View>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const [scope, setScope] = useState(SCHOOL);
  const [adding, setAdding] = useState(false);
  const [addedGrades, setAddedGrades] = useState<number[]>([]);
  const looks = useProductLooks(product.public_id);
  const { data: classesData } = useClasses({ page_size: 100 });

  const grades = useMemo(
    () => oneSectionPerGrade(classesData?.classes ?? []),
    [classesData],
  );
  const sectionByGrade = useMemo(() => {
    const map = new Map<number, { section: string; name: string }>();
    for (const section of grades) {
      if (section.class_master) {
        map.set(section.class_master.id, {
          section: section.public_id,
          name: section.class_master.name,
        });
      }
    }
    return map;
  }, [grades]);

  const classLooks = looks.data?.data.classes ?? [];
  const gradeIds = Array.from(
    new Set([...classLooks.map(look => look.class_master_id), ...addedGrades]),
  ).filter(gradeId => sectionByGrade.has(gradeId));
  const activeGrade = scope === SCHOOL ? undefined : Number(scope);
  const active =
    activeGrade !== undefined ? sectionByGrade.get(activeGrade) : undefined;
  const hasSchoolAttributes = schoolAttributes(product).length > 0;

  const pill = (key: string, label: string) => {
    const selected = scope === key;
    return (
      <TouchableOpacity
        key={key}
        style={[s.pill, selected && s.pillActive]}
        onPress={() => setScope(key)}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
      >
        <Text style={[s.pillText, selected && s.pillTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.card}>
      <View style={styles.cardHeader}>
        <Text style={[s.cardTitle, styles.flex]}>{product.name}</Text>
        {hasSchoolAttributes && (
          <Text style={product.setup_required ? styles.required : styles.ready}>
            {product.setup_required ? 'Setup required' : 'Ready to order'}
          </Text>
        )}
      </View>

      <View style={[s.optionRow, styles.gap]}>
        {pill(SCHOOL, 'Whole school')}
        {gradeIds.map(gradeId =>
          pill(String(gradeId), sectionByGrade.get(gradeId)?.name ?? ''),
        )}
        <TouchableOpacity
          style={styles.addPill}
          onPress={() => setAdding(current => !current)}
        >
          <Plus size={14} color="#2563eb" />
          <Text style={s.secondaryButtonText}>Class look</Text>
        </TouchableOpacity>
      </View>

      {adding && (
        <View style={[s.optionRow, styles.gap]}>
          {grades
            .filter(
              section =>
                section.class_master &&
                !gradeIds.includes(section.class_master.id),
            )
            .map(section => (
              <TouchableOpacity
                key={section.public_id}
                style={[s.option, s.optionSmall]}
                onPress={() => {
                  const gradeId = section.class_master?.id;
                  if (gradeId !== undefined) {
                    setAddedGrades(current => [...current, gradeId]);
                    setScope(String(gradeId));
                  }
                  setAdding(false);
                }}
              >
                <Text style={s.optionText}>{section.class_master?.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {scope === SCHOOL || !active ? (
        <SchoolScope product={product} />
      ) : (
        <ClassScope
          key={scope}
          product={product}
          gradeName={active.name}
          sectionPublicId={active.section}
          look={classLooks.find(look => look.class_master_id === activeGrade)}
        />
      )}
    </View>
  );
}

export function ProductLooksSetup() {
  const { data, isLoading } = useCatalog({ page_size: 100 });
  // ID cards have their own tab; book sets are approved book lists.
  const products = (data?.data ?? []).filter(
    product =>
      product.kind !== PRODUCT_KIND.ID_CARD &&
      product.kind !== PRODUCT_KIND.BOOK_SET,
  );

  if (isLoading) {
    return <ActivityIndicator color="#2563eb" />;
  }
  if (products.length === 0) {
    return (
      <Text style={s.hint}>
        EduCard has not offered any products to your school yet.
      </Text>
    );
  }
  return (
    <View>
      <Text style={[s.hint, styles.gap]}>
        Set how each product looks for your school, and for any class that
        differs. Sizes are chosen per student when you order.
      </Text>
      {products.map(product => (
        <ProductCard key={product.public_id} product={product} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  reset: { marginBottom: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  required: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  ready: { fontSize: 12, fontWeight: '600', color: '#16a34a' },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
