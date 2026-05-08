/**
 * Organization Type Options
 * Synced with backend: edusphere/organizations/constants.py -> OrganizationTypes
 */
export const ORGANIZATION_TYPES = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'trust', label: 'Trust' },
] as const;

/**
 * Board Affiliation Options
 * Synced with backend: edusphere/organizations/constants.py -> BoardAffiliations
 */
export const BOARD_AFFILIATIONS = [
  { value: 'cbse', label: 'CBSE' },
  { value: 'icse', label: 'ICSE' },
  { value: 'ib', label: 'IB (International Baccalaureate)' },
  { value: 'state_board', label: 'State Board' },
  { value: 'other', label: 'Other' },
] as const;

/**
 * Helper to get label from value
 */
export const getOrganizationTypeLabel = (value: string) => {
  return ORGANIZATION_TYPES.find((type) => type.value === value)?.label || value;
};

export const getBoardAffiliationLabel = (value: string) => {
  return BOARD_AFFILIATIONS.find((board) => board.value === value)?.label || value;
};
