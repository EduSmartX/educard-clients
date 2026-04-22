/**
 * Organization Options Constants
 * Synced with backend: edusphere/organizations/constants.py
 * Used by both web and mobile apps
 */

/**
 * Organization Type Options
 * Backend: OrganizationTypes enum
 */
export const ORGANIZATION_TYPES = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'trust', label: 'Trust' },
] as const;

/**
 * Board Affiliation Options
 * Backend: BoardAffiliations enum
 */
export const BOARD_AFFILIATIONS = [
  { value: 'cbse', label: 'CBSE' },
  { value: 'icse', label: 'ICSE' },
  { value: 'ib', label: 'IB' },
  { value: 'state_board', label: 'State Board' },
  { value: 'other', label: 'Other' },
] as const;

// Type definitions
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]['value'];
export type BoardAffiliation = (typeof BOARD_AFFILIATIONS)[number]['value'];

/**
 * Helper to get label from value
 */
export const getOrganizationTypeLabel = (value: string): string => {
  return ORGANIZATION_TYPES.find((type) => type.value === value)?.label || value;
};

export const getBoardAffiliationLabel = (value: string): string => {
  return BOARD_AFFILIATIONS.find((board) => board.value === value)?.label || value;
};
