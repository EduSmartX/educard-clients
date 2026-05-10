/**
 * Phone Number Masking Utilities
 **/
export function maskPhoneNumber(phone?: string | null, showFull?: boolean): string {
  if (!phone) return '—';

  if (phone.includes('*')) {
    return phone;
  }

  if (showFull) return phone;

  // Apply client-side masking as fallback
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 6) {
    return '******';
  }

  const visibleStart = digits.slice(0, 2);
  const visibleEnd = digits.slice(-2);
  const maskedLength = digits.length - 4;
  const masked = '*'.repeat(maskedLength);

  return `${visibleStart}${masked}${visibleEnd}`;
}

/**
 * Check if user can view phone numbers
 * @param userRole - Current user's role (admin, teacher, etc.)
 * @param isSupervisor - Whether the teacher is a supervisor
 * @param isClassTeacher - Whether the teacher is a class teacher for the target class
 * @param targetType - Type of data being viewed: 'teacher', 'student', 'guardian'
 * @param isSubordinate - For teachers, whether the target is a subordinate
 */
export function canViewPhoneNumber({
  userRole,
  isSupervisor = false,
  isClassTeacher = false,
  targetType,
  isSubordinate = false,
}: {
  userRole: string;
  isSupervisor?: boolean;
  isClassTeacher?: boolean;
  targetType: 'teacher' | 'student' | 'guardian';
  isSubordinate?: boolean;
}): boolean {
  // Admin can see all phone numbers
  if (userRole === 'admin') {
    return true;
  }

  // For teacher viewing another teacher's phone
  if (targetType === 'teacher') {
    // Only supervisor can see subordinate teacher's phone
    return isSupervisor && isSubordinate;
  }

  // For student or guardian phone numbers
  if (targetType === 'student' || targetType === 'guardian') {
    // Class teacher can see their students' and guardians' phones
    return isClassTeacher;
  }

  return false;
}

/**
 * Get phone display value - either actual number or masked
 */
export function getPhoneDisplay({
  phone,
  userRole,
  isSupervisor = false,
  isClassTeacher = false,
  targetType,
  isSubordinate = false,
}: {
  phone?: string | null;
  userRole: string;
  isSupervisor?: boolean;
  isClassTeacher?: boolean;
  targetType: 'teacher' | 'student' | 'guardian';
  isSubordinate?: boolean;
}): string {
  if (!phone) return '—';

  // If phone is already masked from backend, display as-is
  if (phone.includes('*')) {
    return phone;
  }

  const canView = canViewPhoneNumber({
    userRole,
    isSupervisor,
    isClassTeacher,
    targetType,
    isSubordinate,
  });

  return canView ? phone : maskPhoneNumber(phone);
}
