import {
  CUSTOM_FEATURES_KEY,
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  PRODUCT_ATTRIBUTE_SCOPE,
  STORE_CONFIG_KEY,
  STORE_UI_MANAGED_KEYS,
  type CartItemConfiguration,
  type Class,
  type ConfigurationSnapshot,
  type IdCardTemplate,
  type ProductAttribute,
  type StudentSizeEntry,
} from '@educard/shared';

/** Sentinel for "no class": a school-wide default template. */
export const ALL_CLASSES = '__all__';

export function classLabel(section: Class): string {
  return (
    section.display_name || [section.class_master?.name, section.name].filter(Boolean).join(' - ')
  );
}

/**
 * The approved template that will print for a section of an ID card product: the
 * product's own card first (its grade's, else its school-wide one), then the same two
 * for general cards that are not tied to a product.
 */
export function resolveTemplate(
  templates: IdCardTemplate[],
  section: Class | undefined,
  productId?: string
): IdCardTemplate | undefined {
  const grade = section?.class_master?.name;
  const pools = [
    ...(productId ? [templates.filter((item) => item.product_public_id === productId)] : []),
    templates.filter((item) => !item.product_public_id),
  ];
  for (const pool of pools) {
    const found =
      pool.find((item) => !item.is_default && grade && item.class_name === grade) ??
      pool.find((item) => item.is_default);
    if (found) {
      return found;
    }
  }
  return undefined;
}

const SNAPSHOT_LABELS: Record<string, string> = {
  [STORE_CONFIG_KEY.CLASS]: 'Class',
  [STORE_CONFIG_KEY.TEMPLATE]: 'Template',
  [STORE_CONFIG_KEY.BOOK_SET]: 'Book set',
};

function humanize(code: string): string {
  return code.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

/**
 * Attributes the buyer fills in per cart line. School-level ones live on Store Setup,
 * and class / student keys are picked with the order page's own controls.
 */
export function orderScopedAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes.filter(
    (attribute) =>
      attribute.scope !== PRODUCT_ATTRIBUTE_SCOPE.ORGANIZATION &&
      !STORE_UI_MANAGED_KEYS.includes(attribute.code)
  );
}

/** In-app route of a product's setup & publish page. */
export function storeProductSetupPath(productPublicId: string): string {
  return `/store/setup/products/${encodeURIComponent(productPublicId)}`;
}

/** In-app route of a product's order page. */
export function storeOrderPath(productPublicId: string): string {
  return `/store/order/${encodeURIComponent(productPublicId)}`;
}

export function organizationScopedAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes.filter((attribute) => attribute.scope === PRODUCT_ATTRIBUTE_SCOPE.ORGANIZATION);
}

/** In-app route for a shipment's tracking page; the QR encodes the same path. */
export function trackingPath(token: string): string {
  return `/track/${encodeURIComponent(token)}`;
}

/** Inline data URI for a server-generated QR SVG, safe to use as an <img> source. */
export function qrSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

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

export function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/**
 * Number of named students on a line (ID cards, per-student sizes), else undefined.
 * Such lines hold one piece per student, so their quantity cannot be edited.
 */
export function lineStudentCount(configuration: CartItemConfiguration): number | undefined {
  const named =
    configuration?.[STORE_CONFIG_KEY.STUDENT_IDS] ?? configuration?.[STORE_CONFIG_KEY.STUDENTS];
  return Array.isArray(named) ? named.length : undefined;
}

/** Students ticked while ordering, mapped to their own values (empty for ID cards). */
export type StudentSelection = Record<string, Record<string, string>>;

/** Attributes that can be filled per student; free lists stay line-level. */
export function perStudentAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes.filter(
    (attribute) => attribute.input_type !== PRODUCT_ATTRIBUTE_INPUT_TYPE.LIST
  );
}

/** Each student's own values on a per-student line, for a breakdown list. */
export function lineStudentSizes(configuration: CartItemConfiguration): StudentSizeEntry[] {
  const entries = configuration?.[STORE_CONFIG_KEY.STUDENTS];
  return Array.isArray(entries) ? (entries as StudentSizeEntry[]) : [];
}

/** Turn a stored configuration into "Size: M · Embroidery: Crest" for display. */
export function describeConfiguration(
  configuration: CartItemConfiguration,
  attributes?: ProductAttribute[]
): string {
  const entries = Object.entries(configuration ?? {});
  if (entries.length === 0) {
    return '';
  }

  const parts: string[] = [];

  const students = lineStudentCount(configuration);
  if (students !== undefined) {
    const noun = students === 1 ? 'student' : 'students';
    parts.push(
      configuration[STORE_CONFIG_KEY.ALL_STUDENTS] === true
        ? `All ${students} ${noun} of the class`
        : `${students} ${noun}`
    );
  }

  for (const [code, value] of entries) {
    if (
      code === STORE_CONFIG_KEY.STUDENT_IDS ||
      code === STORE_CONFIG_KEY.STUDENTS ||
      code === STORE_CONFIG_KEY.ALL_STUDENTS
    ) {
      continue;
    }
    if (code === CUSTOM_FEATURES_KEY || code === STORE_CONFIG_KEY.ORGANIZATION_PROPERTIES) {
      for (const [name, custom] of Object.entries(value as Record<string, string>)) {
        parts.push(`${humanize(name)}: ${custom}`);
      }
      continue;
    }

    if (code in SNAPSHOT_LABELS) {
      const snapshot = value as ConfigurationSnapshot;
      if (snapshot?.name) {
        parts.push(`${SNAPSHOT_LABELS[code]}: ${snapshot.name}`);
      }
      continue;
    }

    const attribute = attributes?.find((item) => item.code === code);
    const label = attribute?.display_name ?? humanize(code);

    if (Array.isArray(value)) {
      parts.push(`${label}: ${value.length} selected`);
      continue;
    }

    const option = attribute?.options.find((item) => item.value === value);
    parts.push(`${label}: ${option?.display_label ?? String(value)}`);
  }

  return parts.join(' · ');
}

export function isConfigurationComplete(
  attributes: ProductAttribute[],
  configuration: CartItemConfiguration
): boolean {
  return orderScopedAttributes(attributes)
    .filter((attribute) => attribute.is_required)
    .every((attribute) => {
      const value = configuration[attribute.code];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
}
