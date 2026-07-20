/**
 * Teacher Form Utility Functions
 * Transforms form data to API payload format
 */

import type { TeacherFormValues } from '../schemas/teacher-form-schema';
import type { CreateTeacherPayload, UpdateTeacherPayload, TeacherDetail } from '../types';
import { ADDRESS_TYPE, type GenderValue, type BloodGroupValue } from '@/constants';
import { getTenDigitPhoneNumber } from '@/lib/phone-utils';

/**
 * Transform form values to CREATE payload format
 * Backend expects nested user object with address and organization_role (ID)
 */
export function transformFormToCreatePayload(values: TeacherFormValues): CreateTeacherPayload {
  const hasAddress =
    values.street_address ||
    values.address_line_2 ||
    values.city ||
    values.state ||
    values.postal_code ||
    values.country;

  const payload: CreateTeacherPayload = {
    employee_id: values.employee_id,
    user: {
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      gender: values.gender,
    },
  };

  if (values.organization_role) {
    payload.user.organization_role = Number.parseInt(values.organization_role);
  }

  if (values.phone) {
    payload.user.phone = values.phone;
  }

  if (values.blood_group) {
    payload.user.blood_group = values.blood_group;
  }

  if (values.date_of_birth) {
    payload.user.date_of_birth = values.date_of_birth;
  }

  if (values.supervisor_email) {
    payload.user.supervisor_email = values.supervisor_email;
  }

  if (hasAddress) {
    payload.user.address = {
      address_type: values.address_type || ADDRESS_TYPE.USER_CURRENT,
      street_address: values.street_address || '',
      address_line_2: values.address_line_2 || '',
      city: values.city || '',
      state: values.state || '',
      zip_code: values.postal_code || '',
      country: values.country || '',
    };
  }

  if (values.designation) {
    payload.designation = values.designation;
  }

  if (values.highest_qualification) {
    payload.highest_qualification = values.highest_qualification;
  }

  if (values.specialization) {
    payload.specialization = values.specialization;
  }

  if (values.experience_years !== undefined) {
    payload.experience_years = values.experience_years;
  }

  if (values.joining_date) {
    payload.joining_date = values.joining_date;
  }

  if (values.subjects && values.subjects.length > 0) {
    payload.subjects = values.subjects;
  }

  return payload;
}

/**
 * Transform form values to UPDATE payload format
 * Backend expects nested user object with organization_role (ID)
 */
export function transformFormToUpdatePayload(values: TeacherFormValues): UpdateTeacherPayload {
  const hasAddress =
    values.street_address ||
    values.address_line_2 ||
    values.city ||
    values.state ||
    values.postal_code ||
    values.country;

  const user: UpdateTeacherPayload['user'] = {
    email: values.email,
    first_name: values.first_name,
    last_name: values.last_name,
    gender: values.gender,
    ...(values.organization_role && {
      organization_role: Number.parseInt(values.organization_role),
    }),
    ...(values.phone && { phone: values.phone }),
    ...(values.blood_group && { blood_group: values.blood_group }),
    ...(values.date_of_birth && { date_of_birth: values.date_of_birth }),
    ...(values.supervisor_email && { supervisor_email: values.supervisor_email }),
    ...(hasAddress && {
      address: {
        address_type: values.address_type || ADDRESS_TYPE.USER_CURRENT,
        street_address: values.street_address || '',
        address_line_2: values.address_line_2 || '',
        city: values.city || '',
        state: values.state || '',
        zip_code: values.postal_code || '',
        country: values.country || '',
      },
    }),
  };

  return {
    employee_id: values.employee_id,
    user,
    ...(values.designation && { designation: values.designation }),
    ...(values.highest_qualification && { highest_qualification: values.highest_qualification }),
    ...(values.specialization && { specialization: values.specialization }),
    ...(values.experience_years !== undefined && { experience_years: values.experience_years }),
    ...(values.joining_date && { joining_date: values.joining_date }),
    ...(values.subjects && values.subjects.length > 0 && { subjects: values.subjects }),
  };
}

/**
 * Transform teacher response to form values for editing
 * @param teacher - Teacher detail from API
 */
export function transformTeacherToForm(teacher: TeacherDetail): Partial<TeacherFormValues> {
  let organizationRoleId = '';
  if (teacher.user?.organization_role?.id) {
    organizationRoleId = teacher.user.organization_role.id.toString();
  }

  return {
    employee_id: teacher.employee_id || '',
    email: teacher.user?.email || '',
    first_name: teacher.user?.first_name || '',
    last_name: teacher.user?.last_name || '',
    phone: getTenDigitPhoneNumber(teacher.user?.phone || ''),
    gender: (teacher.user?.gender as GenderValue) || undefined,
    blood_group: (teacher.user?.blood_group as BloodGroupValue) || undefined,
    date_of_birth: teacher.user?.date_of_birth || '',
    organization_role: organizationRoleId,
    supervisor_email: teacher.user?.supervisor?.email || '',
    designation: teacher.designation || '',
    highest_qualification: teacher.highest_qualification || '',
    specialization: teacher.specialization || '',
    experience_years: teacher.experience_years || undefined,
    joining_date: teacher.joining_date || '',
    address_type: teacher.user?.address?.address_type || ADDRESS_TYPE.USER_CURRENT,
    street_address: teacher.user?.address?.street_address || '',
    address_line_2: teacher.user?.address?.address_line_2 || '',
    city: teacher.user?.address?.city || '',
    state: teacher.user?.address?.state || '',
    postal_code: teacher.user?.address?.zip_code || '',
    country: teacher.user?.address?.country || '',
    subjects: teacher.subjects?.map((subject) => Number.parseInt(subject.public_id)) || [],
  };
}
