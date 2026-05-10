/**
 * Shared Form Helpers
 * Reusable utilities for building API payloads and parsing API errors
 * Used by both Web and Mobile create/edit forms
 */

// Type definitions
type FormValue = string | number | boolean | null | undefined;
type FormValues = Record<string, FormValue>;
export type ApiErrorData = Record<string, unknown>;

/** Safely trim a string value */
function safeTrim(value: FormValue): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

/** Backend field → form field mapping for nested user errors */
const DEFAULT_FIELD_MAP: Record<string, string> = {
  "user.email": "email",
  "user.first_name": "first_name",
  "user.last_name": "last_name",
  "user.phone": "phone",
  "user.gender": "gender",
  "user.blood_group": "blood_group",
  "user.date_of_birth": "date_of_birth",
  "user.organization_role": "organization_role",
};

/**
 * Parse API error response into a flat field→message errors object.
 * Handles nested backend error formats like `{ user: { email: ["..."] } }`.
 *
 * @returns `{ fieldErrors, generalError }` — fieldErrors is a Record<string,string>,
 *   generalError is a string if no field-level errors found.
 */
export function parseApiErrors(
  data: ApiErrorData | null | undefined,
  fieldMap: Record<string, string> = DEFAULT_FIELD_MAP,
): { fieldErrors: Record<string, string>; generalError: string | null } {
  if (!data || typeof data !== "object") {
    return { fieldErrors: {}, generalError: "An unexpected error occurred." };
  }

  // If it's a simple { message: "..." } or { detail: "..." }
  if (typeof data.message === "string" && Object.keys(data).length <= 3) {
    return { fieldErrors: {}, generalError: data.message };
  }
  if (typeof data.detail === "string") {
    return { fieldErrors: {}, generalError: data.detail };
  }

  const fieldErrors: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "success" || key === "code" || key === "message") { continue; }

    if (Array.isArray(value)) {
      // Direct field error: { employee_id: ["This field is required."] }
      const mapped = fieldMap[key] || key;
      fieldErrors[mapped] = value[0];
    } else if (typeof value === "object" && value !== null) {
      // Nested object: { user: { email: ["..."], phone: ["..."] } }
      for (const [subKey, subValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const compositeKey = `${key}.${subKey}`;
        const mapped = fieldMap[compositeKey] || subKey;
        if (Array.isArray(subValue)) {
          fieldErrors[mapped] = subValue[0];
        } else if (typeof subValue === "string") {
          fieldErrors[mapped] = subValue;
        }
      }
    } else if (typeof value === "string") {
      const mapped = fieldMap[key] || key;
      fieldErrors[mapped] = value;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, generalError: null };
  }

  const message = data.message;
  const detail = data.detail;
  const generalError = (typeof message === "string" ? message : null) || 
                       (typeof detail === "string" ? detail : null) || 
                       "Operation failed.";

  return {
    fieldErrors: {},
    generalError,
  };
}

/**
 * Strip empty strings, null, undefined from an object (shallow).
 * Useful for building API payloads where empty optional fields should be omitted.
 */
export function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== "" && val !== null && val !== undefined) {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

/**
 * Build teacher create/update payload from flat form values.
 * Nests user fields properly for the backend API.
 */
export function buildTeacherPayload(
  form: FormValues,
  quickAdd: boolean,
): Record<string, unknown> {
  const user: Record<string, unknown> = {
    email: safeTrim(form.email),
    first_name: safeTrim(form.first_name),
    last_name: safeTrim(form.last_name),
    gender: form.gender,
    ...stripEmpty({
      organization_role: form.organization_role
        ? Number(form.organization_role)
        : undefined,
      phone: safeTrim(form.phone),
      blood_group: form.blood_group || undefined,
      date_of_birth: form.date_of_birth || undefined,
      supervisor_email: safeTrim(form.supervisor_email),
    }),
  };

  const payload: Record<string, unknown> = {
    employee_id: safeTrim(form.employee_id),
    user,
  };

  if (!quickAdd) {
    Object.assign(
      payload,
      stripEmpty({
        designation: safeTrim(form.designation),
        highest_qualification: safeTrim(form.highest_qualification),
        specialization: safeTrim(form.specialization),
        experience_years: form.experience_years
          ? Number(form.experience_years)
          : undefined,
        joining_date: form.joining_date || undefined,
        emergency_contact_name: safeTrim(form.emergency_contact_name),
        emergency_contact_number: safeTrim(form.emergency_contact_number),
      }),
    );

    const addr = stripEmpty({
      street_address: safeTrim(form.street_address),
      city: safeTrim(form.city),
      state: safeTrim(form.state),
      postal_code: safeTrim(form.postal_code),
      country: safeTrim(form.country),
    });
    if (Object.keys(addr).length > 0) {
      user.address = { ...addr, address_type: "user_current" };
    }
  }

  return payload;
}

/**
 * Build student create/update payload from flat form values.
 */
export function buildStudentPayload(
  form: FormValues,
  quickAdd: boolean,
): Record<string, unknown> {
  const user: Record<string, unknown> = {
    first_name: safeTrim(form.first_name),
    last_name: safeTrim(form.last_name),
    email: safeTrim(form.email) || `student_${Date.now()}@placeholder.com`,
    role: "student",
    ...stripEmpty({
      phone: safeTrim(form.phone),
      gender: form.gender || undefined,
      blood_group: form.blood_group || undefined,
      date_of_birth: form.date_of_birth || undefined,
    }),
  };

  const payload: Record<string, unknown> = {
    class_assigned: form.class_id,
    roll_number: safeTrim(form.roll_number),
    user,
    ...stripEmpty({
      admission_number: safeTrim(form.admission_number),
      admission_date: form.admission_date || undefined,
    }),
  };

  if (!quickAdd) {
    Object.assign(
      payload,
      stripEmpty({
        guardian_name: safeTrim(form.guardian_name),
        guardian_phone: safeTrim(form.guardian_phone),
        guardian_email: safeTrim(form.guardian_email),
        guardian_relationship: form.guardian_relationship || undefined,
        medical_conditions: safeTrim(form.medical_conditions),
        description: safeTrim(form.description),
        emergency_contact_name: safeTrim(form.emergency_contact_name),
        emergency_contact_phone: safeTrim(form.emergency_contact_phone),
        previous_school_name: safeTrim(form.previous_school_name),
        previous_school_class: safeTrim(form.previous_school_class),
        previous_school_address: safeTrim(form.previous_school_address),
      }),
    );

    const addr = stripEmpty({
      street_address: safeTrim(form.street_address),
      city: safeTrim(form.city),
      state: safeTrim(form.state),
      postal_code: safeTrim(form.postal_code),
      country: safeTrim(form.country),
    });
    if (Object.keys(addr).length > 0) {
      user.address = { ...addr, address_type: "user_current" };
    }
  }

  return payload;
}

/**
 * Build class create/update payload from flat form values.
 */
export function buildClassPayload(form: FormValues): Record<string, unknown> {
  return {
    class_master: Number(form.class_master),
    name: safeTrim(form.name),
    ...stripEmpty({
      capacity: form.capacity ? Number(form.capacity) : undefined,
      class_teacher: form.class_teacher_id || form.class_teacher || undefined,
      room_number: safeTrim(form.room_number),
      info: safeTrim(form.info),
    }),
  };
}

/**
 * Build subject create/update payload from flat form values.
 */
export function buildSubjectPayload(form: FormValues): Record<string, unknown> {
  return {
    class_id: form.class_id,
    subject_id: Number(form.subject_id),
    subject_type: form.subject_type || "core",
    ...stripEmpty({
      teacher_id: form.teacher_id || undefined,
      description: safeTrim(form.description),
    }),
  };
}
