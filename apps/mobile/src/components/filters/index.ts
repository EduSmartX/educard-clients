/**
 * Filters Components Index (slice)
 * Per-entity filter configs are added here as list screens are migrated.
 */

export {
  FilterModal,
  type FilterField,
  type FilterOption,
} from './FilterModal';
export { ActiveFilters } from './ActiveFilters';
export {
  GENDER_FILTER_FIELD,
  makeDeletedToggle,
  getGenderLabel,
  getDeletedLabel,
  type FilterLabel,
} from './SharedFilterFields';
export {
  SUBJECT_FILTER_FIELDS,
  getSubjectFilterLabels,
} from './SubjectFilters';
export { CLASS_FILTER_FIELDS, getClassFilterLabels } from './ClassFilters';
export {
  TEACHER_FILTER_FIELDS,
  getTeacherFilterLabels,
} from './TeacherFilters';
export {
  STUDENT_FILTER_FIELDS,
  useStudentFilterFields,
  getStudentFilterLabels,
} from './StudentFilters';
export {
  ClassFilterDropdown,
  getClassLabel,
  buildClassOptions,
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
