import {
  CUSTOM_FEATURES_KEY,
  type CartItemConfiguration,
  type ProductAttribute,
} from '@educard/shared';

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
    if (code === CUSTOM_FEATURES_KEY) {
      for (const [name, custom] of Object.entries(value as Record<string, string>)) {
        parts.push(`${name}: ${custom}`);
      }
      continue;
    }

    const attribute = attributes?.find((item) => item.code === code);
    const label = attribute?.display_name ?? code;

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
  return attributes
    .filter((attribute) => attribute.is_required)
    .every((attribute) => {
      const value = configuration[attribute.code];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
}
