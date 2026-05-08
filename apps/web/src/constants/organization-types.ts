/**
 * Organization Type and Board Affiliation Constants
 * These match the backend constants exactly from edusphere/organizations/constants.py
 */

export const ORGANIZATION_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  TRUST: 'trust',
} as const;

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: ORGANIZATION_TYPES.PUBLIC, label: 'Public' },
  { value: ORGANIZATION_TYPES.PRIVATE, label: 'Private' },
  { value: ORGANIZATION_TYPES.TRUST, label: 'Trust' },
];

export const BOARD_AFFILIATIONS = {
  CBSE: 'cbse',
  ICSE: 'icse',
  IB: 'ib',
  STATE_BOARD: 'state_board',
  OTHER: 'other',
} as const;

export const BOARD_AFFILIATION_OPTIONS = [
  { value: BOARD_AFFILIATIONS.CBSE, label: 'CBSE' },
  { value: BOARD_AFFILIATIONS.ICSE, label: 'ICSE' },
  { value: BOARD_AFFILIATIONS.IB, label: 'IB (International Baccalaureate)' },
  { value: BOARD_AFFILIATIONS.STATE_BOARD, label: 'State Board' },
  { value: BOARD_AFFILIATIONS.OTHER, label: 'Other' },
];
