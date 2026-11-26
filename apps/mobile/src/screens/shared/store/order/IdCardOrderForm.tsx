/**
 * Order ID cards (same steps as the web):
 *   1. Classes: all classes, or only the ones you select. Each class prints with the design
 *      approved for it; classes without a design or without students are skipped.
 *   2. Who: every student of those classes, or specific students searched across them.
 *   3. Preview: the real card for a student of a chosen class.
 *
 * The cart gets one line per class (each class has its own design and approval).
 */
import {
  APPROVAL_STATUS,
  STORE_CONFIG_KEY,
  getErrorMessage,
  type CartItemConfiguration,
  type CatalogProduct,
  type Class,
  type IdCardTemplate,
  type Student,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  Users,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/common';
import {
  MultiSelectModal,
  SingleSelectModal,
} from '@/components/common/SelectionModal';
import { SegmentedSelector } from '@/components/ui';
import { useClasses } from '@/features/classes';
import {
  classLabel,
  formatCurrency,
  resolveTemplate,
  useAddCartItem,
  useClassStudents,
  useIdCardTemplates,
} from '@/features/store';
import { CardSides } from '@/features/store/components/CardSides';
import {
  ChoiceCard,
  Notice,
  OrderStep,
  PickerButton,
} from '@/features/store/components/OrderParts';
import { StudentPickerModal, studentClassLabel } from '@/features/students';
import type { SharedStackNavigation } from '@/navigation/types';
import { showToast } from '@/utils/toast';

type Scope = 'all' | 'selected';
type Audience = 'all' | 'specific';
type Sheet = 'classes' | 'students' | 'preview' | null;

interface ClassPlan {
  section: Class;
  template: IdCardTemplate | undefined;
  students: number | undefined;
  ready: boolean;
}

export function IdCardOrderForm({ product }: { product: CatalogProduct }) {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const addItem = useAddCartItem();

  const [scope, setScope] = useState<Scope>('selected');
  const [classIds, setClassIds] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>('all');
  const [picked, setPicked] = useState<Student[]>([]);
  const [previewClassId, setPreviewClassId] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);

  const { data: classesData } = useClasses({ page_size: 100 });
  const sections = useMemo(() => classesData?.classes ?? [], [classesData]);
  const { data: templatesResponse } = useIdCardTemplates({
    status: APPROVAL_STATUS.APPROVED,
  });
  const templates = useMemo(
    () => templatesResponse?.data ?? [],
    [templatesResponse],
  );

  const plans: ClassPlan[] = useMemo(
    () =>
      classIds.flatMap(id => {
        const section = sections.find(item => item.public_id === id);
        if (!section) {
          return [];
        }
        const template = resolveTemplate(templates, section, product.public_id);
        const students = section.student_count;
        return [
          {
            section,
            template,
            students,
            ready: Boolean(template) && students !== 0,
          },
        ];
      }),
    [classIds, sections, templates, product.public_id],
  );
  const ready = plans.filter(plan => plan.ready);
  const skipped = plans.filter(plan => !plan.ready);
  const specific = audience === 'specific';
  const pickedClassIds = new Set(
    picked.map(student => student.class_info?.public_id),
  );
  const ordered = specific
    ? ready.filter(plan => pickedClassIds.has(plan.section.public_id))
    : ready;
  const cardCount = specific
    ? picked.length
    : ready.reduce((sum, plan) => sum + (plan.students ?? 0), 0);

  const previewPlan =
    ready.find(plan => plan.section.public_id === previewClassId) ??
    ordered[0] ??
    ready[0];
  const previewStudents = useClassStudents(previewPlan?.section.public_id);
  const previewStudent =
    (specific
      ? picked.find(
          student =>
            student.class_info?.public_id === previewPlan?.section.public_id,
        )
      : undefined) ?? previewStudents.students[0];
  const template = previewPlan?.template;

  const chooseScope = (next: Scope) => {
    setScope(next);
    setClassIds(
      next === 'all' ? sections.map(section => section.public_id) : [],
    );
    setPicked([]);
    setPreviewClassId('');
  };
  const toggleClass = (id: string) => {
    setClassIds(current =>
      current.includes(id)
        ? current.filter(value => value !== id)
        : [...current, id],
    );
    setPicked(current =>
      current.filter(student => student.class_info?.public_id !== id),
    );
    setPreviewClassId('');
  };

  const blocker =
    classIds.length === 0
      ? 'Choose the classes.'
      : ready.length === 0
        ? 'None of the chosen classes has both an approved design and students.'
        : specific && picked.length === 0
          ? 'Pick the students.'
          : '';

  const handleAdd = () => {
    const configuration: CartItemConfiguration = {};
    const single = ordered.length === 1 && classIds.length === 1;
    if (single) {
      configuration[STORE_CONFIG_KEY.CLASS] = ordered[0].section.public_id;
    }
    if (specific) {
      configuration[STORE_CONFIG_KEY.STUDENT_IDS] = picked.map(
        student => student.public_id,
      );
    } else if (single) {
      configuration[STORE_CONFIG_KEY.ALL_STUDENTS] = true;
    }
    addItem.mutate(
      {
        product_public_id: product.public_id,
        configuration,
        ...(single
          ? {}
          : { classes: ordered.map(plan => plan.section.public_id) }),
      },
      {
        onSuccess: () => {
          showToast(
            'success',
            ordered.length > 1
              ? `${product.name} for ${ordered.length} classes added to cart`
              : `${product.name} added to cart`,
          );
          navigation.goBack();
        },
        onError: error =>
          showToast('error', getErrorMessage(error, 'Could not add this item')),
      },
    );
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <OrderStep
          step={1}
          title="Choose the classes"
          description="Each class prints with the design approved for it."
          complete={ready.length > 0}
        >
          <SegmentedSelector
            options={[
              {
                value: 'all' as const,
                label: `All classes (${sections.length})`,
              },
              { value: 'selected' as const, label: 'Only selected' },
            ]}
            value={scope}
            onChange={chooseScope}
          />
          {scope === 'selected' ? (
            <PickerButton
              label={
                classIds.length
                  ? `${classIds.length} class${
                      classIds.length === 1 ? '' : 'es'
                    } selected`
                  : ''
              }
              placeholder="Choose one or more classes"
              onPress={() => setSheet('classes')}
            />
          ) : null}
          {plans.map(plan => (
            <View
              key={plan.section.public_id}
              style={[styles.planRow, !plan.ready && styles.planSkipped]}
            >
              {plan.ready ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <AlertTriangle size={18} color="#d97706" />
              )}
              <View style={styles.flex}>
                <Text style={styles.planName}>{classLabel(plan.section)}</Text>
                <Text style={styles.planMeta}>
                  {plan.ready
                    ? `${plan.students ?? '?'} cards · ${
                        plan.template?.name ?? ''
                      }`
                    : !plan.template
                      ? 'No approved design: skipped'
                      : 'No students yet: skipped'}
                </Text>
              </View>
              {scope === 'selected' ? (
                <TouchableOpacity
                  hitSlop={10}
                  onPress={() => toggleClass(plan.section.public_id)}
                  accessibilityLabel={`Remove ${classLabel(plan.section)}`}
                >
                  <X size={18} color="#6b7280" />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
          {skipped.length > 0 ? (
            <Notice tone="warning">
              {skipped.length} class{skipped.length === 1 ? ' is' : 'es are'}{' '}
              skipped and will not be added to the cart.
            </Notice>
          ) : null}
        </OrderStep>

        <OrderStep
          step={2}
          title="Who are the cards for?"
          description="One card per student, filled in from their profile."
          complete={ready.length > 0 && cardCount > 0}
        >
          {ready.length === 0 ? (
            <Text style={styles.muted}>Choose a class first.</Text>
          ) : (
            <>
              <ChoiceCard
                icon={Users}
                title="All students"
                description={`Everyone in the ${ready.length} class${
                  ready.length === 1 ? '' : 'es'
                } (${ready.reduce(
                  (sum, plan) => sum + (plan.students ?? 0),
                  0,
                )} cards)`}
                selected={!specific}
                onSelect={() => setAudience('all')}
              />
              <ChoiceCard
                icon={UserCheck}
                title="Specific students"
                description={
                  ready.length > 1
                    ? 'Search across the chosen classes'
                    : 'Search by name or roll number'
                }
                selected={specific}
                onSelect={() => setAudience('specific')}
              />
              {specific ? (
                <>
                  <PickerButton
                    label={
                      picked.length
                        ? `${picked.length} student${
                            picked.length === 1 ? '' : 's'
                          } selected`
                        : ''
                    }
                    placeholder="Search and select students"
                    onPress={() => setSheet('students')}
                  />
                  {picked.length > 0 ? (
                    <Text style={styles.muted} numberOfLines={3}>
                      {picked
                        .slice(0, 6)
                        .map(student =>
                          ready.length > 1
                            ? `${student.full_name} (${studentClassLabel(
                                student,
                              )})`
                            : student.full_name,
                        )
                        .join(', ')}
                      {picked.length > 6 ? ` +${picked.length - 6} more` : ''}
                    </Text>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </OrderStep>

        <OrderStep
          step={3}
          title="Card preview"
          description="Exactly as it will print."
        >
          {template && previewStudent ? (
            <>
              {ready.length > 1 ? (
                <PickerButton
                  label={`Preview: ${
                    previewPlan ? classLabel(previewPlan.section) : ''
                  }`}
                  placeholder="Choose a class to preview"
                  onPress={() => setSheet('preview')}
                />
              ) : null}
              <Text style={styles.muted}>
                {previewStudent.full_name} · {template.name}
              </Text>
              {template.can_preview ? (
                <CardSides
                  frontPath={template.front_preview_url}
                  backPath={
                    template.design?.has_back ? template.back_preview_url : null
                  }
                  orientation={template.design?.orientation ?? 'landscape'}
                  width={width - 32 - 28 - 4}
                  student={previewStudent.public_id}
                />
              ) : (
                <Text style={styles.muted}>
                  EduCard is still preparing this card’s print design.
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.muted}>Choose a class to see the card.</Text>
          )}
        </OrderStep>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.barSummary}>
          <Text style={styles.barMeta}>
            {ordered.length} class{ordered.length === 1 ? '' : 'es'} ·{' '}
            {cardCount} card
            {cardCount === 1 ? '' : 's'}
          </Text>
          <Text style={styles.barTotal}>
            {formatCurrency(cardCount * Number(product.price))}
          </Text>
        </View>
        {blocker ? <Text style={styles.blocker}>{blocker}</Text> : null}
        <SubmitButton
          label="Add to cart"
          onPress={handleAdd}
          isLoading={addItem.isPending}
          disabled={Boolean(blocker)}
        />
      </View>

      <MultiSelectModal
        visible={sheet === 'classes'}
        onClose={() => setSheet(null)}
        title="Choose classes"
        options={sections.map(section => ({
          value: section.public_id,
          label: classLabel(section),
        }))}
        selectedValues={classIds}
        onToggle={toggleClass}
        searchable
        searchPlaceholder="Search classes"
      />
      <StudentPickerModal
        visible={sheet === 'students'}
        onClose={() => setSheet(null)}
        classIds={ready.map(plan => plan.section.public_id)}
        value={picked}
        onChange={setPicked}
      />
      <SingleSelectModal
        visible={sheet === 'preview'}
        onClose={() => setSheet(null)}
        title="Preview class"
        options={ready.map(plan => ({
          value: plan.section.public_id,
          label: classLabel(plan.section),
        }))}
        selectedValue={previewPlan?.section.public_id ?? ''}
        onSelect={value => setPreviewClassId(value)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14 },
  muted: { fontSize: 14, color: '#6b7280', lineHeight: 20 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
  },
  planSkipped: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  planName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  planMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    elevation: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  barSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barMeta: { fontSize: 14, color: '#4b5563', fontWeight: '600' },
  barTotal: { fontSize: 18, fontWeight: '800', color: '#111827' },
  blocker: { fontSize: 13, color: '#b45309' },
});
