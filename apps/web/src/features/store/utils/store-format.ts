import type { CartItemConfiguration, ProductAttribute } from '@educard/shared';

export function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

/** Turn a stored configuration into "Size: M · Students: 40 selected" for display. */
export function describeConfiguration(
  configuration: CartItemConfiguration,
  attributes?: ProductAttribute[]
): string {
  const entries = Object.entries(configuration ?? {});
  if (entries.length === 0) {
    return '';
  }

  return entries
    .map(([code, value]) => {
      const attribute = attributes?.find((item) => item.code === code);
      const label = attribute?.display_name ?? code;

      if (Array.isArray(value)) {
        return `${label}: ${value.length} selected`;
      }

      const option = attribute?.options.find((item) => item.value === value);
      return `${label}: ${option?.display_label ?? value}`;
    })
    .join(' · ');
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
