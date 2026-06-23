/** Holiday type display config */
export const HOLIDAY_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; darkBg: string; icon: string }
> = {
  NATIONAL_HOLIDAY: {
    label: 'National Holiday',
    color: '#dc2626',
    bg: '#fef2f2',
    darkBg: '#fee2e2',
    icon: '🏛️',
  },
  STATE_HOLIDAY: {
    label: 'State Holiday',
    color: '#dc2626',
    bg: '#fef2f2',
    darkBg: '#fee2e2',
    icon: '🏛️',
  },
  FESTIVAL: {
    label: 'Festival',
    color: '#ea580c',
    bg: '#fff7ed',
    darkBg: '#ffedd5',
    icon: '🎉',
  },
  ORGANIZATION_HOLIDAY: {
    label: 'Organization',
    color: '#059669',
    bg: '#ecfdf5',
    darkBg: '#d1fae5',
    icon: '🏢',
  },
  SECOND_SATURDAY: {
    label: '2nd Saturday',
    color: '#4f46e5',
    bg: '#eef2ff',
    darkBg: '#e0e7ff',
    icon: '📅',
  },
  SUNDAY: { label: 'Sunday', color: '#db2777', bg: '#fce7f3', darkBg: '#fbcfe8', icon: '☀️' },
  SATURDAY: {
    label: 'Saturday',
    color: '#6b7280',
    bg: '#f9fafb',
    darkBg: '#f3f4f6',
    icon: '📅',
  },
  OTHER: { label: 'Other', color: '#7c3aed', bg: '#f5f3ff', darkBg: '#ede9fe', icon: '📌' },
};

export const HOLIDAY_TYPE_OPTIONS = [
  { value: 'NATIONAL_HOLIDAY', label: '🏛️ National Holiday' },
  { value: 'STATE_HOLIDAY', label: '🏛️ State Holiday' },
  { value: 'FESTIVAL', label: '🎉 Festival' },
  { value: 'ORGANIZATION_HOLIDAY', label: '🏢 Organization Holiday' },
  { value: 'OTHER', label: '📌 Other' },
];

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
