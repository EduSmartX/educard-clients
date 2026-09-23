/**
 * Form Components - Centralized exports
 * All form-related components and utilities
 */

// Form Actions & Metadata
export { FormActions } from './form-actions';
export { FormMetadata } from './form-metadata';
export { FormProfilePhoto } from './form-profile-photo';

// Selection Fields
export { ClassSelectField } from './class-select-field';
export { ClassesMultiSelectField } from './classes-multi-select-field';
export { SubjectsMultiSelectField } from './subjects-multi-select-field';
export { SupervisorField } from './supervisor-field';
export { OrganizationRoleField } from './organization-role-field';

// Form Inputs
export { PhoneInput } from './phone-input';

// Complex Forms
export { AddressForm } from './address-form';
export { GuardianForm } from './guardian-form';

// Form Fields (legacy re-exports for backward compatibility)
export {
  TextInputField,
  DateInputField,
  GenderField,
  BloodGroupField,
  SelectField,
} from './form-fields';

// Schemas
export { createAddressSchema, clearAddressFields, type AddressFormData } from './address-schema';
