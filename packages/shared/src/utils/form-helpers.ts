/**
 * Shared Form Helpers
 * Reusable utilities for building API payloads and parsing API errors
 * Used by both Web and Mobile create/edit forms
 */

// ============================================================================
// API Error Parser — Maps nested backend errors to flat field errors
// ============================================================================

/** Backend field → form field mapping for nested user errors */
const DEFAULT_FIELD_MAP: Record<string, string> = {
  'user.email': 'email',
  'user.first_name': 'first_name',
  'user.last_name': 'last_name',
  'user.phone': 'phone',
  'user.gender': 'gender',
  'user.blood_group': 'blood_group',
  'user.date_of_birth': 'date_of_birth',
  'user.organization_role': 'organization_role',
};

/**
 * Parse API error response into a flat field→message errors object.
 * Handles nested backend error formats like `{ user: { email: ["..."] } }`.
 * 
 * @returns `{ fieldErrors, generalError }` — fieldErrors is a Record<string,string>,
 *   generalError is a string if no field-level errors found.
 */
export function parseApiErrors(
  data: any,
  fieldMap: Record<string, string> = DEFAULT_FIELD_MAP,
): { fieldErrors: Record<string, string>; generalError: string | null } {
  if (!data || typeof data !== 'object') {
    return { fieldErrors: {}, generalError: 'An unexpected error occurred.' };
  }

  // If it's a simple { message: "..." } or { detail: "..." }
  if (typeof data.message === 'string' && Object.keys(data).length <= 3) {
    return { fieldErrors: {}, generalError: data.message };
  }
  if (typeof data.detail === 'string') {
    return { fieldErrors: {}, generalError: data.detail };
  }

  const fieldErrors: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'success' || key === 'code' || key === 'message') continue;

    if (Array.isArray(value)) {
      // Direct field error: { employee_id: ["This field is required."] }
      const mapped = fieldMap[key] || key;
      fieldErrors[mapped] = value[0];
    } else if (typeof value === 'object' && value !== null) {
      // Nested object: { user: { email: ["..."], phone: ["..."] } }
      for (const [subKey, subValue] of Object.entries(value as Record<string, any>)) {
        const compositeKey = `${key}.${subKey}`;
        const mapped = fieldMap[compositeKey] || subKey;
        if (Array.isArray(subValue)) {
          fieldErrors[mapped] = subValue[0];
        } else if (typeof subValue === 'string') {
          fieldErrors[mapped] = subValue;
        }
      }
    } else if (typeof value === 'string') {
      const mapped = fieldMap[key] || key;
      fieldErrors[mapped] = value;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, generalError: null };
  }

  return { fieldErrors: {}, generalError: data.message || data.detail || 'Operation failed.' };
}

// ============================================================================
// Payload Builder — Remove empty/null values from payload
// ============================================================================

/**
 * Strip empty strings, null, undefined from an object (shallow).
 * Useful for building API payloads where empty optional fields should be omitted.
 */
export function stripEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== '' && val !== null && val !== undefined) {
      (result as any)[key] = val;
    }
  }
  return result;
}

/**
 * Build teacher create/update payload from flat form values.
 * Nests user fields properly for the backend API.
 */
export function buildTeacherPayload(form: Record<string, any>, quickAdd: boolean) {
  const payload: any = {
    employee_id: form.employee_id?.trim(),
    user: {
      email: form.email?.trim(),
      first_name: form.first_name?.trim(),
      last_name: form.last_name?.trim(),
      gender: form.gender,
      ...stripEmpty({
        organization_role: form.organization_role ? Number(form.organization_role) : undefined,
        phone: form.phone?.trim() || undefined,
        blood_group: form.blood_group || undefined,
        date_of_birth: form.date_of_birth || undefined,
        supervisor_email: form.supervisor_email?.trim() || undefined,
      }),
    },
  };

  if (!quickAdd) {
    Object.assign(payload, stripEmpty({
      designation: form.designation?.trim() || undefined,
      highest_qualification: form.highest_qualification?.trim() || undefined,
      specialization: form.specialization?.trim() || undefined,
      experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      joining_date: form.joining_date || undefined,
      emergency_contact_name: form.emergency_contact_name?.trim() || undefined,
      emergency_contact_number: form.emergency_contact_number?.trim() || undefined,
    }));

    const addr = stripEmpty({
      street_address: form.street_address?.trim() || undefined,
      city: form.city?.trim() || undefined,
      state: form.state?.trim() || undefined,
      postal_code: form.postal_code?.trim() || undefined,
      country: form.country?.trim() || undefined,
    });
    if (Object.keys(addr).length > 0) {
      payload.user.address = { ...addr, address_type: 'user_current' };
    }
  }

  return payload;
}

/**
 * Build student create/update payload from flat form values.
 */
export function buildStudentPayload(form: Record<string, any>, quickAdd: boolean) {
  const payload: any = {
    class_assigned: form.class_id,
    roll_number: form.roll_number?.trim(),
    user: {
      first_name: form.first_name?.trim(),
      last_name: form.last_name?.trim(),
      email: form.email?.trim() || `student_${Date.now()}@placeholder.com`,
      role: 'student',
      ...stripEmpty({
        phone: form.phone?.trim() || undefined,
        gender: form.gender || undefined,
        blood_group: form.blood_group || undefined,
        date_of_birth: form.date_of_birth || undefined,
      }),
    },
    ...stripEmpty({
      admission_number: form.admission_number?.trim() || undefined,
      admission_date: form.admission_date || undefined,
    }),
  };

  if (!quickAdd) {
    Object.assign(payload, stripEmpty({
      guardian_name: form.guardian_name?.trim() || undefined,
      guardian_phone: form.guardian_phone?.trim() || undefined,
      guardian_email: form.guardian_email?.trim() || undefined,
      guardian_relationship: form.guardian_relationship || undefined,
      medical_conditions: form.medical_conditions?.trim() || undefined,
      description: form.description?.trim() || undefined,
      emergency_contact_name: form.emergency_contact_name?.trim() || undefined,
      emergency_contact_phone: form.emergency_contact_phone?.trim() || undefined,
      previous_school_name: form.previous_school_name?.trim() || undefined,
      previous_school_class: form.previous_school_class?.trim() || undefined,
      previous_school_address: form.previous_school_address?.trim() || undefined,
    }));

    const addr = stripEmpty({
      street_address: form.street_address?.trim() || undefined,
      city: form.city?.trim() || undefined,
      state: form.state?.trim() || undefined,
      postal_code: form.postal_code?.trim() || undefined,
      country: form.country?.trim() || undefined,
    });
    if (Object.keys(addr).length > 0) {
      payload.user.address = { ...addr, address_type: 'user_current' };
    }
  }

  return payload;
}

/**
 * Build class create/update payload from flat form values.
 */
export function buildClassPayload(form: Record<string, any>) {
  return {
    class_master: Number(form.class_master),
    name: form.name?.trim(),
    ...stripEmpty({
      capacity: form.capacity ? Number(form.capacity) : undefined,
      class_teacher_id: form.class_teacher_id || undefined,
      room_number: form.room_number?.trim() || undefined,
      info: form.info?.trim() || undefined,
    }),
  };
}

/**
 * Build subject create/update payload from flat form values.
 */
export function buildSubjectPayload(form: Record<string, any>) {
  return {
    class_id: form.class_id,
    subject_id: Number(form.subject_id),
    ...stripEmpty({
      teacher_id: form.teacher_id || undefined,
      description: form.description?.trim() || undefined,
    }),
  };
}
