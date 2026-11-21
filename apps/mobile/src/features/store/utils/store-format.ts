import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  PRODUCT_ATTRIBUTE_SCOPE,
  STORE_CONFIG_KEY,
  STORE_UI_MANAGED_KEYS,
  type CartItemConfiguration,
  type CatalogProduct,
  type Class,
  type IdCardTemplate,
  type ProductAttribute,
  type StudentSizeEntry,
} from '@educard/shared';

export function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function classLabel(section: Class): string {
  return (
    section.display_name ||
    [section.class_master?.name, section.name].filter(Boolean).join(' - ')
  );
}

/** One section per grade: templates, book sets and class looks are per grade. */
export function oneSectionPerGrade(sections: Class[]): Class[] {
  const byGrade = new Map<string, Class>();
  for (const section of sections) {
    const grade = section.class_master?.name ?? classLabel(section);
    if (!byGrade.has(grade)) {
      byGrade.set(grade, section);
    }
  }
  return Array.from(byGrade.values());
}

/** The approved template that will print for a section: its grade's, else the default. */
export function resolveTemplate(
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

/**
 * Attributes picked per cart line. School-level ones live on Store Setup, and class /
 * student keys are chosen with the order screen's own controls.
 */
export function lineAttributes(product: CatalogProduct): ProductAttribute[] {
  return product.attributes.filter(
    attribute =>
      attribute.scope !== PRODUCT_ATTRIBUTE_SCOPE.ORGANIZATION &&
      !STORE_UI_MANAGED_KEYS.includes(attribute.code),
  );
}

export function schoolAttributes(product: CatalogProduct): ProductAttribute[] {
  return product.attributes.filter(
    attribute => attribute.scope === PRODUCT_ATTRIBUTE_SCOPE.ORGANIZATION,
  );
}

/** Students ticked while ordering, mapped to their own values (empty for ID cards). */
export type StudentSelection = Record<string, Record<string, string>>;

/** Attributes that can be filled per student; free lists stay line-level. */
export function perStudentAttributes(
  attributes: ProductAttribute[],
): ProductAttribute[] {
  return attributes.filter(
    attribute => attribute.input_type !== PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST,
  );
}

/**
 * Number of named students on a line (ID cards, per-student sizes), else undefined.
 * Such lines hold one piece per student, so their quantity cannot be edited.
 */
export function lineStudentCount(
  configuration: CartItemConfiguration,
): number | undefined {
  const named =
    configuration?.[STORE_CONFIG_KEY.STUDENT_IDS] ??
    configuration?.[STORE_CONFIG_KEY.STUDENTS];
  return Array.isArray(named) ? named.length : undefined;
}

/** Each student's own values on a per-student line. */
export function lineStudentSizes(
  configuration: CartItemConfiguration,
): StudentSizeEntry[] {
  const entries = configuration?.[STORE_CONFIG_KEY.STUDENTS];
  return Array.isArray(entries) ? (entries as StudentSizeEntry[]) : [];
}

/** "Rahul (Roll 4): size M, waist 28" lines for a per-student breakdown. */
export function describeStudentSizes(entries: StudentSizeEntry[]): string[] {
  return entries.map(entry => {
    const values = Object.entries(entry)
      .filter(
        ([key, value]) =>
          !['student', 'name', 'roll_number'].includes(key) && value,
      )
      .map(([key, value]) => `${key.replace(/_/g, ' ')} ${value}`)
      .join(', ');
    const roll = entry.roll_number ? ` (Roll ${entry.roll_number})` : '';
    return `${entry.name ?? entry.student}${roll}${
      values ? `: ${values}` : ''
    }`;
  });
}
