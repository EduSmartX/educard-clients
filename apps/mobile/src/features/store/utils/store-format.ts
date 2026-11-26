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

import { getMediaUrl } from '@/constants/config';

/**
 * A product's main picture as a full URL, like the web store: the school's own upload
 * first, else EduCard's default artwork. (`image_url` alone is empty until the school
 * uploads its own picture.)
 */
export function productImageUrl(
  product: Pick<CatalogProduct, 'images' | 'image_url'>,
): string | undefined {
  return getMediaUrl(product.images?.[0] || product.image_url);
}

export function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/** "26 Nov 2026" (empty for no date). */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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

/**
 * The approved template that will print for a section of an ID card product: the
 * product's own card first (its grade's, else its school-wide one), then the same two
 * for general cards that are not tied to a product.
 */
export function resolveTemplate(
  templates: IdCardTemplate[],
  section: Class | undefined,
  productId?: string,
): IdCardTemplate | undefined {
  const grade = section?.class_master?.name;
  const pools = [
    ...(productId
      ? [templates.filter(item => item.product_public_id === productId)]
      : []),
    templates.filter(item => !item.product_public_id),
  ];
  for (const pool of pools) {
    const found =
      pool.find(
        item => !item.is_default && Boolean(grade) && item.class_name === grade,
      ) ?? pool.find(item => item.is_default);
    if (found) {
      return found;
    }
  }
  return undefined;
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
