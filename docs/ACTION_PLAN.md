# Action Plan: Addressing Remaining SonarCloud Issues

## 🎯 PRIORITY MATRIX

| Priority | Issue Type                        | Count | Effort | Impact |
| -------- | --------------------------------- | ----- | ------ | ------ |
| P0       | TypeScript `any` in API responses | 15    | Medium | High   |
| P1       | TypeScript `any` in form handlers | 8     | Low    | High   |
| P2       | LocalStorage token security       | 20    | High   | High   |
| P3       | TypeScript `any` in utils         | 7     | Low    | Medium |
| P4       | Regex validation review           | 6     | Medium | Low    |

---

## 📋 DETAILED ACTION ITEMS

### P0: API Response Types (Week 1)

**Files to Update:**

1. `apps/web/src/features/leave/components/manage-leave-balances.tsx`

   ```typescript
   // Line 101 - Replace any with proper type
   function parseManageableUsers(data: any): ManageableUser[];

   // Recommended fix:
   interface RawManageableUserData {
     id: string;
     full_name: string;
     email: string;
     role: string;
     // Add other fields from API
   }
   function parseManageableUsers(
     data: RawManageableUserData[],
   ): ManageableUser[];
   ```

2. `apps/mobile/app/(shared-screens)/classes/[id].tsx`

   ```typescript
   // Line 64, 83 - Map functions with any
   items={c.subjects.map((s: any) => ...)}

   // Recommended fix:
   interface Subject {
     public_id: string;
     name: string;
     code: string;
   }
   items={c.subjects.map((s: Subject) => ...)}
   ```

**Estimated Time:** 2-3 days  
**Testing Required:** Unit tests for type safety

---

### P1: Form Handler Types (Week 1)

**Files to Update:**

1. `apps/web/src/components/form/guardian-form.tsx`

   ```typescript
   // Line 21 - Generic form type
   form: any;

   // Recommended fix:
   import { UseFormReturn } from "react-hook-form";
   import { GuardianFormValues } from "@/types/forms";

   form: UseFormReturn<GuardianFormValues>;
   ```

2. `apps/mobile/app/(shared-screens)/teachers/create.tsx`

   ```typescript
   // Line 115 - Field update handler
   (field: string, value: any) => { ... }

   // Recommended fix:
   type FieldValue = string | number | boolean | Date;
   (field: keyof TeacherFormData, value: FieldValue) => { ... }
   ```

**Estimated Time:** 1-2 days  
**Testing Required:** Form validation tests

---

### P2: LocalStorage Security (Week 2-3)

**Strategy Options:**

#### Option A: Keep LocalStorage (Easier)

1. Implement encryption at rest
2. Add token rotation
3. Shorten token lifetime

**Implementation:**

```typescript
// Create secure storage utility
import CryptoJS from "crypto-js";

class SecureStorage {
  private readonly encryptionKey: string;

  constructor() {
    // Generate unique key per session/device
    this.encryptionKey = this.getOrCreateKey();
  }

  setItem(key: string, value: string): void {
    const encrypted = CryptoJS.AES.encrypt(
      value,
      this.encryptionKey,
    ).toString();
    localStorage.setItem(key, encrypted);
  }

  getItem(key: string): string | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.encryptionKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch {
      return null;
    }
  }
}
```

#### Option B: Migrate to httpOnly Cookies (Better Security)

1. Backend changes required
2. Update auth flow
3. Remove localStorage for tokens

**Migration Plan:**

- Week 2: Backend cookie support
- Week 3: Frontend migration
- Week 4: Testing & rollout

**Estimated Time:** 1-2 weeks (Option A) or 3-4 weeks (Option B)  
**Testing Required:** Full auth flow testing

---

### P3: Utility Function Types (Week 2)

**Files to Update:**

1. `apps/mobile/src/lib/animated-shim.tsx` (Lines 22-101)
   - Replace animation function `any` types with proper interfaces

2. `apps/mobile/src/lib/lucide-shim.tsx` (Line 187)
   - Replace `style?: any` with proper React style type

**Quick Wins:**

```typescript
// Before:
style?: any;

// After:
import { ViewStyle, TextStyle } from 'react-native';
style?: ViewStyle | TextStyle;
```

**Estimated Time:** 1 day  
**Testing Required:** Visual regression tests

---

### P4: Regex Validation Review (Week 3)

**Files to Review:**

1. `apps/web/src/lib/utils/bulk-upload/field-validators.ts`
2. `apps/web/src/features/leave/components/manage-leave-balances.tsx`

**Review Checklist:**

- [ ] Check for nested quantifiers (e.g., `(a+)+`)
- [ ] Verify input length limits
- [ ] Test with long strings (>10000 chars)
- [ ] Add timeout mechanism

**Example Protection:**

```typescript
function safeRegexMatch(
  pattern: RegExp,
  input: string,
  maxLength = 1000,
): RegExpMatchArray | null {
  if (input.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} chars)`);
  }

  // Set timeout for regex execution
  const timeout = setTimeout(() => {
    throw new Error("Regex execution timeout");
  }, 100); // 100ms timeout

  try {
    return input.match(pattern);
  } finally {
    clearTimeout(timeout);
  }
}
```

**Estimated Time:** 2 days  
**Testing Required:** Performance tests with edge cases

---

## 📅 SPRINT PLANNING

### Sprint 1 (Week 1)

- [ ] P0: API Response Types (50% complete)
- [ ] P1: Form Handler Types (100% complete)
- [ ] Document pattern for team

### Sprint 2 (Week 2)

- [ ] P0: API Response Types (100% complete)
- [ ] P3: Utility Function Types (100% complete)
- [ ] P2: LocalStorage - Decision & Planning

### Sprint 3 (Week 3)

- [ ] P2: LocalStorage implementation (50-100%)
- [ ] P4: Regex validation review
- [ ] Update tests

### Sprint 4 (Week 4)

- [ ] P2: LocalStorage complete (if needed)
- [ ] Final testing
- [ ] Documentation update
- [ ] SonarCloud verification

---

## 🧪 TESTING STRATEGY

### Unit Tests

- Type assertion tests for all changed types
- Mock API responses with proper types
- Form validation with typed values

### Integration Tests

- Auth flow with new storage mechanism
- API calls with typed responses
- Form submissions with validation

### Security Tests

- XSS prevention verification
- Token encryption validation
- CSRF protection check

### Performance Tests

- Regex performance with large inputs
- Storage encryption overhead
- Type checking compile time

---

## 📊 SUCCESS METRICS

| Metric                     | Current | Target | Deadline  |
| -------------------------- | ------- | ------ | --------- |
| SonarCloud Security Issues | 1       | 0      | Week 1 ✅ |
| TypeScript `any` Count     | 30+     | <5     | Week 3    |
| Code Coverage              | Unknown | 80%    | Week 4    |
| Technical Debt Ratio       | Unknown | <5%    | Week 4    |
| Security Rating            | Unknown | A      | Week 4    |

---

## 👥 RESOURCE ALLOCATION

**Required Skills:**

- TypeScript expert (2 days/week)
- Security specialist (1 day for review)
- Backend developer (if migrating to cookies)
- QA engineer (full-time week 4)

**Dependencies:**

- Backend team (for cookie implementation)
- DevOps (for testing environment)
- Security team (for audit)

---

## 🚨 ROLLBACK PLAN

If issues arise during implementation:

1. **Type Changes:** Revert commits, use `as unknown as Type` temporarily
2. **Storage Changes:** Feature flag to switch between old/new storage
3. **Critical Failures:** Immediate rollback, hotfix deployment

**Monitoring:**

- Error tracking (Sentry)
- Performance monitoring
- User feedback channels

---

## 📚 RESOURCES

**Documentation:**

- TypeScript Handbook: https://www.typescriptlang.org/docs/
- React Hook Form Types: https://react-hook-form.com/ts
- OWASP Security Guide: https://owasp.org/www-project-web-security-testing-guide/

**Tools:**

- TypeScript Playground: https://www.typescriptlang.org/play
- Regex Tester: https://regex101.com/
- Security Checklist: https://github.com/OWASP/CheatSheetSeries

---

**Created:** May 25, 2026  
**Owner:** Development Team Lead  
**Review Date:** Weekly (every Friday)
