/**
 * Shared parsers for leave feature data structures.
 * Handles varying API response shapes across admin and teacher contexts.
 */

export interface ClassData {
  public_id: string;
  name: string;
  class_master: {
    id: number;
    name: string;
    code: string;
    display_order: number;
  };
  is_active: boolean;
}

export interface StudentData {
  public_id: string;
  roll_number: string;
  admission_number: string;
  user_info: {
    public_id: string;
    username: string;
    full_name: string;
    email: string;
    phone?: string;
    gender?: string;
  };
  role?: string;
  organization_role?: string;
}

/**
 * Parse classes API data from either admin API or teacher management context.
 * Admin API returns `{ class_master: { id, name, code, ... } }`.
 * Teacher context returns `{ class_master: "ClassName" }`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseClasses(data: any): ClassData[] {
  if (!data) { return []; }
  if (!Array.isArray(data)) { return []; }
  return data.map((cls: Record<string, unknown>) => {
    const cm = cls.class_master;
    if (cm && typeof cm === 'object' && 'name' in cm) {
      const cmObj = cm as { id?: number; name: string; code?: string; display_order?: number };
      return {
        public_id: cls.public_id as string,
        name: cls.name as string,
        class_master: {
          id: cmObj.id || 0,
          name: cmObj.name,
          code: cmObj.code || '',
          display_order: cmObj.display_order || 0,
        },
        is_active: !(cls.is_deleted as boolean),
      };
    }
    return {
      public_id: cls.public_id as string,
      name: cls.name as string,
      class_master: {
        id: 0,
        name: typeof cm === 'string' ? cm : 'Unknown',
        code: '',
        display_order: 0,
      },
      is_active: true,
    };
  });
}

/**
 * Parse students API response (handles nested `{ students: [...] }` or direct array).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseStudents(data: any): StudentData[] {
  if (!data) { return []; }
  if (Array.isArray(data.students)) { return data.students as StudentData[]; }
  if (Array.isArray(data)) { return data as StudentData[]; }
  return [];
}
