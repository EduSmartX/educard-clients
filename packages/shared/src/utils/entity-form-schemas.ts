/**
 * Shared Entity Form Validation Schemas
 * Zod schemas for Teacher, Student, Class, Subject forms
 * Used by both Web and Mobile applications
 */

import { z } from "zod";

// Reusable Field Validators

const requiredString = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .min(1, `${label} is required`);

const optionalString = () => z.string().optional().or(z.literal(""));

const emailField = (label = "Email") =>
  z
    .string()
    .min(1, `${label} is required`)
    .email("Please enter a valid email address");

const optionalEmail = () =>
  z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal(""));

const phoneField = (label = "Phone") =>
  z
    .string()
    .regex(/^[6-9]\d{9}$/, `${label} must be a valid 10-digit mobile number`)
    .optional()
    .or(z.literal(""));

const optionalDate = () =>
  z
    .string()
    .refine(
      (v) => !v || v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "Date must be in YYYY-MM-DD format",
    )
    .optional()
    .or(z.literal(""));

const _genderField = () =>
  z.enum(["M", "F", "O"], {
    errorMap: () => ({ message: "Please select a gender" }),
  });

// Export for potential future use to avoid unused variable + void operator
export { _genderField };

const requiredGender = () =>
  z
    .string()
    .min(1, "Gender is required")
    .refine((v) => ["M", "F", "O"].includes(v), "Please select a valid gender");

// TEACHER Form Schemas

const nameRefinement = {
  check: (data: { first_name: string; last_name: string }) =>
    data.first_name.length > 1 || data.last_name.length > 1,
  message: "Both names cannot be a single character",
  path: ["last_name"] as [string],
};

/** Base teacher object (without refinement) */
const teacherQuickBase = z.object({
  employee_id: requiredString("Employee ID"),
  email: emailField("Email"),
  first_name: requiredString("First name"),
  last_name: requiredString("Last name"),
  gender: requiredGender(),
});

/** Quick-add teacher: only required fields */
export const teacherQuickSchema = teacherQuickBase.refine(
  nameRefinement.check,
  { message: nameRefinement.message, path: nameRefinement.path },
);

/** Full teacher form: all fields */
export const teacherFullSchema = teacherQuickBase
  .extend({
    organization_role: optionalString(),
    phone: phoneField("Phone"),
    blood_group: optionalString(),
    date_of_birth: optionalDate(),
    designation: optionalString(),
    highest_qualification: optionalString(),
    specialization: optionalString(),
    experience_years: z
      .string()
      .refine((v) => {
        if (!v || v === "") {
          return true;
        }
        const n = Number(v);
        return !Number.isNaN(n) && n >= 0 && n <= 70;
      }, "Experience must be between 0 and 70")
      .optional()
      .or(z.literal("")),
    supervisor_email: optionalEmail(),
    joining_date: optionalDate(),
    street_address: optionalString(),
    city: optionalString(),
    state: optionalString(),
    postal_code: optionalString(),
    country: optionalString(),
  })
  .refine(nameRefinement.check, {
    message: nameRefinement.message,
    path: nameRefinement.path,
  });

// STUDENT Form Schemas

/** Base student object (without refinement) */
const studentQuickBase = z.object({
  class_id: requiredString("Class"),
  first_name: requiredString("First name"),
  last_name: requiredString("Last name"),
  roll_number: requiredString("Roll number"),
});

/** Quick-add student: only required fields */
export const studentQuickSchema = studentQuickBase.refine(
  nameRefinement.check,
  { message: nameRefinement.message, path: nameRefinement.path },
);

/** Full student form: all fields */
export const studentFullSchema = studentQuickBase
  .extend({
    email: optionalEmail(),
    phone: phoneField("Phone"),
    gender: optionalString(),
    blood_group: optionalString(),
    date_of_birth: optionalDate(),
    admission_number: optionalString(),
    admission_date: optionalDate(),
    guardian_name: optionalString(),
    guardian_relationship: optionalString(),
    medical_conditions: optionalString(),
    description: optionalString(),
    previous_school_name: optionalString(),
    previous_school_class: optionalString(),
    previous_school_address: optionalString(),
    street_address: optionalString(),
    city: optionalString(),
    state: optionalString(),
    postal_code: optionalString(),
    country: optionalString(),
  })
  .refine(nameRefinement.check, {
    message: nameRefinement.message,
    path: nameRefinement.path,
  });

// CLASS Form Schema

export const classFormSchema = z.object({
  class_master: requiredString("Class"),
  name: requiredString("Section name"),
  capacity: z
    .string()
    .refine((v) => {
      if (!v || v === "") {
        return true;
      }
      const n = Number(v);
      return !Number.isNaN(n) && n >= 1 && n <= 500;
    }, "Capacity must be between 1 and 500")
    .optional()
    .or(z.literal("")),
  class_teacher_id: optionalString(),
  room_number: optionalString(),
  info: optionalString(),
});

// SUBJECT Form Schema

export const subjectFormSchema = z.object({
  class_id: requiredString("Class"),
  subject_id: requiredString("Subject"),
  subject_type: z
    .enum(["core", "elective", "language"])
    .optional()
    .default("core"),
  teacher_id: optionalString(),
  description: optionalString(),
  display_order: optionalString(),
});

// Validation Helper — Validate a single field against a Zod schema

/**
 * Validate a single field from a Zod object schema.
 * Returns the error message or undefined.
 */
export function validateField(
  schema: z.ZodTypeAny,
  field: string,
  value: string,
  _allValues?: Record<string, unknown>,
): string | undefined {
  // Unwrap ZodEffects to get the underlying ZodObject shape
  let inner: z.ZodTypeAny = schema;
  while (inner instanceof z.ZodEffects) {
    inner = inner._def.schema;
  }
  if (!(inner instanceof z.ZodObject)) {
    return undefined;
  }

  const shape = inner.shape as Record<string, z.ZodTypeAny>;
  const fieldSchema = shape[field];
  if (!fieldSchema) {
    return undefined;
  }

  const result = fieldSchema.safeParse(value);
  if (!result.success) {
    return result.error.issues[0]?.message;
  }
  return undefined;
}

/**
 * Validate all fields of a form object against a Zod schema.
 * Returns a Record<string, string> of field → error message.
 */
export function validateAllFields(
  schema: z.ZodTypeAny,
  values: Record<string, unknown>,
): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0]?.toString();
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

// Type Exports

export type TeacherQuickFormData = z.infer<typeof teacherQuickSchema>;
export type TeacherFullFormData = z.infer<typeof teacherFullSchema>;
export type StudentQuickFormData = z.infer<typeof studentQuickSchema>;
export type StudentFullFormData = z.infer<typeof studentFullSchema>;
export type ClassFormData = z.infer<typeof classFormSchema>;
export type SubjectFormData = z.infer<typeof subjectFormSchema>;
