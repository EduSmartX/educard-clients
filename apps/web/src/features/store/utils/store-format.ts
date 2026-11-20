import {
  CUSTOM_FEATURES_KEY,
  PRODUCT_ATTRIBUTE_SCOPE,
  STORE_CONFIG_KEY,
  type CartItemConfiguration,
  type Class,
  type ConfigurationSnapshot,
  type IdCardTemplate,
  type ProductAttribute,
} from '@educard/shared';

/** Sentinel for "no class": a school-wide default template. */
export const ALL_CLASSES = '__all__';

export function classLabel(section: Class): string {
  return (
    section.display_name || [section.class_master?.name, section.name].filter(Boolean).join(' - ')
  );
}

/** The approved template that will print for a section: its grade's, else the default. */
export function resolveTemplate(
  templates: IdCardTemplate[],
  section: Class | undefined
): IdCardTemplate | undefined {
  const grade = section?.class_master?.name;
  return (
    templates.find((template) => !template.is_default && grade && template.class_name === grade) ??
    templates.find((template) => template.is_default)
  );
}

const SNAPSHOT_LABELS: Record<string, string> = {
  [STORE_CONFIG_KEY.CLASS]: 'Class',
  [STORE_CONFIG_KEY.TEMPLATE]: 'Template',
  [STORE_CONFIG_KEY.BOOK_SET]: 'Book set',
};

function humanize(code: string): string {
  return code.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase());
}

/** Attributes the buyer fills in per cart line; school-level ones live on Store Setup. */
export function orderScopedAttributes(attributes: ProductAttribute[]): ProductAttribute[] {
  return attributes.filter((attribute) => attribute.scope !== PRODUCT_ATTRIBUTE_SCOPE.ORGANIZATION);
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

  for (const [code, value] of entries) {
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
