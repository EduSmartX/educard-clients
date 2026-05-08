/**
 * Helper functions for managing deleted view functionality
 */

/**
 * Get the title for a list page based on deleted view state
 */
export function getListTitle(resourceName: string, showDeleted: boolean): string {
  return showDeleted ? `Deleted ${resourceName}` : `${resourceName} Management`;
}

/**
 * Get the description for a list page based on deleted view state
 */
export function getListDescription(resourceName: string, showDeleted: boolean): string {
  if (showDeleted) {
    return `View and restore deleted ${resourceName.toLowerCase()}`;
  }
  return `Manage your organization's ${resourceName.toLowerCase()}`;
}

/**
 * Get the card title for a list based on deleted view state
 */
export function getCardTitle(resourceName: string, count: number, showDeleted: boolean): string {
  const prefix = showDeleted ? `Deleted ${resourceName}` : resourceName;
  return `${prefix} (${count})`;
}

/**
 * Get the card description based on filters and deleted view state
 */
export function getCardDescription(
  resourceName: string,
  hasFilters: boolean,
  showDeleted: boolean
): string {
  if (hasFilters) {
    return 'Showing filtered results';
  }
  if (showDeleted) {
    return `Deleted ${resourceName.toLowerCase()} that can be restored`;
  }
  return `All ${resourceName.toLowerCase()} in your organization`;
}

/**
 * Get empty message for data table based on filters and deleted view state
 */
export function getEmptyMessage(
  resourceName: string,
  hasFilters: boolean,
  showDeleted: boolean
): string {
  if (showDeleted) {
    return `No deleted ${resourceName.toLowerCase()} found.`;
  }
  if (hasFilters) {
    return `No ${resourceName.toLowerCase()} found. Try adjusting your filters.`;
  }
  return `No ${resourceName.toLowerCase()} yet. Get started by adding your first ${resourceName.toLowerCase().replace(/s$/, '')}.`;
}
