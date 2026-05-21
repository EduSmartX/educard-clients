/**
 * Filters Components Index
 * Export all filter-related components
 */

export { FilterModal, type FilterField, type FilterOption } from './FilterModal';

export { ActiveFilters } from './ActiveFilters';

export { type FilterLabel } from './SharedFilterFields';

export { TEACHER_FILTER_FIELDS, getTeacherFilterLabels } from './TeacherFilters';

export {
  STUDENT_FILTER_FIELDS,
  getStudentFilterLabels,
  useStudentFilterFields,
} from './StudentFilters';

export { SUBJECT_FILTER_FIELDS, getSubjectFilterLabels } from './SubjectFilters';

export { CLASS_FILTER_FIELDS, getClassFilterLabels } from './ClassFilters';

export {
  ClassFilterDropdown,
  buildClassOptions,
  getClassLabel,
  type ClassOption,
} from './ClassFilterDropdown';

export {
  buildFeeStructureFilterFields,
  getFeeStructureFilterLabels,
  type FeeClassOption,
} from './FeeStructureFilters';

export {
  PAYMENT_FILTER_FIELDS,
  getPaymentFilterLabels,
  type PaymentFiltersState,
} from './PaymentFilters';
