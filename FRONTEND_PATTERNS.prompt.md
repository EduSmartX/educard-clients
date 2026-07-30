# EduCard Frontend Patterns — Web & Mobile (Android/iOS)

> **Purpose:** The single reference for HOW we build features in this monorepo. When you add a new
> screen, page, or feature to **either** the web app or the mobile app, follow these patterns so the
> codebase stays consistent, reusable across roles, and lint/type clean.
>
> **How to use:** Attach/reference this file when prompting for a new feature. Match the existing
> patterns first; only introduce a new pattern if none fits, and then document it here.

---

## 0. Golden rules (read first)

1. **`packages/shared` (`@educard/shared`) is the single source of truth** for API endpoints, query
   keys, types, constants, validation schemas, colors, and role helpers. Web AND mobile consume it.
2. **NEVER change `@educard/shared` in a way that impacts the web flow.** Treat it as **read-only**;
   only _consume_ existing exports. If something genuinely must be added, add it **additively**
   (new export, no signature/behavior change to existing ones) and verify the **web app still builds
   and typechecks** before finishing. Sanity check: `git status --porcelain` should not show
   unexpected `packages/shared/` or `apps/web/` changes.
3. **Reusable-across-roles first.** We have 3 roles — **Admin (Principal)**, **Employee (Staff)**,
   **Parent (Student portal)**. Build one component/base and parameterize it per role; do not
   copy-paste per role.
4. **Quality gate is zero-tolerance:** `--max-warnings=0`. Code must pass **typecheck + lint + test**
   before a task is done. No `console.log`, no unused imports, no `any` (use real interfaces).
5. **Barrel exports (`index.ts`)** in every folder for clean single-source imports.
6. **Mutations live in their own file / hooks**, separate from queries, for modularity.
7. **Keep files focused. If a file exceeds ~500 lines, split** into modules/subcomponents.
8. **Comments are short (one line) and only when non-obvious.**

---

## 1. Monorepo layout

```
educard-clients/
├── apps/
│   ├── web/          # Vite + React + TS + Tailwind (SPA). Desktop + responsive mobile web.
│   ├── mobile/       # React Native CLI (bare) 0.83 — Android/iOS. ACTIVE mobile app.
│   ├── mobile-expo/  # Original Expo app — REFERENCE ONLY (source of truth for migration). Do not ship.
│   └── assets/
├── packages/
│   └── shared/       # @educard/shared — API endpoints, query keys, types, constants, zod, colors, role helpers.
└── FRONTEND_PATTERNS.prompt.md  (this file)
```

Backend mirrors roles too: API folders split by `admin`, `employee`, `parent` with proper
authN/authZ classes.

---

## 2. Shared package `@educard/shared` (used by both apps)

Import from `@educard/shared` — do not re-declare these locally:

- **`API_ENDPOINTS`**, `buildUrl` — every backend route (incl. `STUDENT_PORTAL`, role-scoped URLs).
- **`QueryKeys`** — canonical TanStack Query keys.
- **Types** — user, org, attendance, exams, fee, etc.
- **Constants** — `USER_ROLES`, `*_OPTIONS`, `ORGANIZATION_TYPES`, `SIGNUP_STEP_*`, messages.
- **Validation** — zod schemas (`loginSchema`, `signupSchema`, `organizationRegistrationSchema`, …)
  and helpers (`isValidEmail`, `isValidPhone`, …).
- **Colors / theme** — `Colors`, `colors`, `getRoleGradient`, `getRoleThemeColors`, `getSubjectColor`.
- **Error helpers** — `parseError`/`parseApiError`/`getErrorMessage`/`getFieldErrors`/`isValidationError`,
  `isDeletedDuplicateError`.

**Rule:** if a value is meaningful to both platforms, it belongs in shared — but adding there requires
the web-safety check in Golden Rule #2.

---

## 3. WEB app patterns (`apps/web`)

**Stack:** Vite, React, TypeScript (strict), Tailwind, TanStack Query, React Hook Form + zod,
shadcn-style `ui/` primitives, sonner (toasts), axios via `lib/api`.

### 3.1 Folder structure (feature-based)

```
src/
├── features/<feature>/{api,hooks,components,pages,types,utils}/  + index.ts
│   └── role features: features/{admin,employee,parent,student}
├── components/
│   ├── ui/        # primitives: data-table, date-picker, multi-select, searchable-select,
│   │              #   form, form-error, dialog, combobox, pagination, sonner, ...
│   ├── common/    # page-header, delete-confirmation-dialog, bulk-upload-dialog,
│   │              #   resource-list-layout, *-avatar, action-button-group, ...
│   ├── form/      # form-fields, generic-multi-select-field, phone-input, address-form, ...
│   ├── tables/    # common-columns
│   ├── filters/   # resource-filter
│   ├── layout/    # protected-layout, dashboard-{layout,header,sidebar,page-header}
│   ├── guards/ dashboard/ theme/ branding/ export/
├── hooks/         # use-auth, use-filter-params, use-form-error-handler, use-role, ...
├── lib/           # api, token-manager, utils, ...
└── providers/     # critical-operation-provider
```

### 3.2 Reusable building blocks (use these, don't rebuild)

- **List page:** `DataTable` (`components/ui/data-table`) + `Pagination` + `ResourceFilter` +
  `common-columns`. Wrap in `resource-list-layout`.
- **Page header:** `PageHeader` (`components/common/page-header`) — consistent typography
  (`text-3xl` bold), smart icon mapping from title keywords, action buttons render right
  (`flex-shrink-0`). Use it for forms too.
- **Forms:** React Hook Form + zod. Use generic field components in `components/form`
  (support string/number/bool/choice/multi-choice). Force Select re-render for view/edit with
  `key={`${itemId}-${field.value}`}`. Extract validation to `utils` (never inline).
- **Errors:** `form-error` + `use-form-error-handler` — **highlight the specific field** from the
  backend error response; non-field errors go to toast.
- **Toasts:** `sonner` with a circular close button (top-right).
- **Dialogs:** `delete-confirmation-dialog` (amber/warning theme, `isSoftDelete` aware),
  `bulk-upload-dialog` (surface row-0 file-level errors), `reactivate-/warning-confirmation-dialog`.
- **Pickers:** `date-picker`, `date-time-picker`, `month-year-picker`, `multi-select`,
  `searchable-select`, `combobox` — always reuse these, never hand-roll inputs.
- **Avatars/images:** `user-avatar`, `student-avatar`, `subject-avatar` with profile/org images.

### 3.3 Data layer

- Query hooks + **mutations in a separate file**. After a mutation, **invalidate related queries**.
- API modules match the backend serializer shape **exactly** (handle nested objects).
- Header/user/org fetched **once** in `protected-layout`, not per page.

### 3.4 Responsive & layout

- Grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; headers `flex-col sm:flex-row`.
- Mobile: hide logo, gradient glass-morphism header (`h-16 sm:h-20`), sidebar `fixed` with
  `translate-x`, hamburger `top-4 left-4`.
- Typography hierarchy `text-2xl → text-lg → text-sm`; field borders `px-4 py-4 last:border-b-0`.

### 3.5 Quality gate (web)

ESLint strict: `no-console` = **error** (only `console.warn/error`), `--max-warnings=0`, no `any`,
Prettier applied, TypeScript compiles. Run eslint `--fix` before committing.

---

## 4. MOBILE app patterns (`apps/mobile`, React Native CLI)

**Stack:** RN 0.83 (New Arch, Hermes), React Navigation 7 (native-stack + bottom-tabs),
TanStack Query 5, Zustand (auth store), axios (`@/api/client`), React Hook Form + zod,
NativeWind 4 (`className`), `react-native-linear-gradient`, `lucide-react-native`,
`react-native-reanimated`.

> **Reference, don't reinvent:** the original screen logic lives in `apps/mobile-expo`. Port it and
> swap only the Expo-coupled parts (see §4.5). Reuse the same business logic/hooks verbatim.

### 4.1 Folder structure

```
src/
├── api/          # client (axios+interceptors), auth, profile, otp, organization, *-utils, index barrel
├── features/<feature>/{api,hooks}/ + index.ts   # students, classes, teachers, subjects,
│                                                 #   attendance, timetable, student-portal, ...
├── screens/{auth,admin,employee,parent,settings,shared}/
├── navigation/   # RootNavigator, MainStackNavigator, MainTabsNavigator, tabs/*, types.ts, legacy-route
├── components/{ui,layout,common,dashboard,forms,screens,navigation}/
├── hooks/  constants/  lib/  styles/  utils/
```

### 4.2 Navigation architecture (IMPORTANT)

```
RootNavigator (native-stack, auth-gated)
├── Auth  → AuthNavigator (Login/Signup/ForgotPassword/VerifyOtp/ResetPassword)
└── Main  → MainStackNavigator (native-stack)   ← shared/detail screens live here
            ├── "Tabs" → MainTabsNavigator → role bottom tabs (Admin | Employee | Parent)
            └── shared screens on top (Notifications, … added as ported)
```

- **Add a shared/detail screen:** create it in `screens/shared/…`, add a route to
  `SharedStackParamList` (in `navigation/types.ts`) and a `<Stack.Screen>` in `MainStackNavigator`.
- **Navigating from a tab to a shared screen:** `navigation.navigate('Notifications')` — RN bubbles
  to the parent stack. Type the tab screen's nav with the **composite** type from `types.ts`
  (`AdminTabNavigation` / `EmployeeTabNavigation` / `ParentTabNavigation`). Do **not** use a generic
  `<T extends ParamListBase>` composite (fails the string-key constraint) — use the concrete types.
- **Not-yet-ported destinations:** wire a `const pendingScreen = () => undefined;` no-op, then replace
  it with a real `navigation.navigate(...)` when that screen is ported.
- **Role routing:** `MainTabsNavigator` picks the tab navigator by `user.role`
  (admin→Admin, employee/teacher→Employee, parent/student→Parent).

### 4.3 Reusable building blocks (mobile)

- **Screen shell:** `components/layout/Screen` (safe area + optional KeyboardAwareScrollView) and
  `Header` (back/notif/settings). Detail/shared screens use gradient header via `@/styles` `headerStyles`.
- **Cards/atoms:** `components/ui/{Card, Avatar, Badge, FloatingCard, SectionHeader, QuickActionsGrid,
GradientHeader, PressableScale, Modal, SegmentedSelector}`.
- **Dashboards:** `components/dashboard/{StatCard, StatsGrid, TodaySchedule, VerificationBanner}`.
- **Role screen bases (shared admin+employee):** `components/screens/{ManagementScreenBase,
MyWorkScreenBase, AdminPanelBase}` — parameterize with items + `settingsRoute` per role.
- **Header profile button:** `components/common/HeaderProfileButton`.
- **Gradients:** always `import { LinearGradient } from '@/lib/linear-gradient'` (wrapper that accepts
  readonly color tuples). Never import `react-native-linear-gradient` or `expo-linear-gradient` directly.
- **Forms (mobile):** wrap form entry screens in **`KeyboardAwareScrollView`**; reuse
  `components/forms/*` (e.g. `AddressForm`). Use React Hook Form + zod + `@educard/shared` schemas.
  Reusable pickers (DatePicker/DateTimePicker, searchable + multi-select dropdown, error wrappers)
  are shared components — reuse one implementation everywhere.

### 4.4 Data layer (mobile)

- Each feature = `api/<name>-api.ts` + `hooks/use-<name>.ts` + `index.ts` (slim barrel).
- Copy api/hooks from `mobile-expo` (mostly framework-agnostic). Barrels **exclude** Expo-coupled
  list components until those are ported.
- TanStack Query fire-and-forget: `void queryClient.invalidateQueries(...)` (the mobile eslint sets
  `no-void: off`).

### 4.5 Expo → RN CLI swap table (apply per ported screen)

| Expo API                                                | Replace with                                                 |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `expo-router` `useRouter`/`useLocalSearchParams`/`Link` | `@react-navigation` `useNavigation`/`useRoute`               |
| `expo-linear-gradient`                                  | `@/lib/linear-gradient`                                      |
| `expo-image` `<Image contentFit transition>`            | RN `<Image resizeMode>` (drop `transition`)                  |
| `@expo/vector-icons`                                    | `lucide-react-native`                                        |
| `expo-status-bar`                                       | RN `StatusBar` (`barStyle` map)                              |
| `expo-secure-store`                                     | `@/lib/secure-store` (Keychain)                              |
| `expo-image-picker` / `expo-document-picker`            | `react-native-image-picker` / `react-native-document-picker` |
| `expo-file-system`/`sharing`/`media-library`            | `react-native-fs` + `react-native-share`                     |
| `expo-constants` / env                                  | `react-native-config` (`@/constants/config`)                 |

### 4.6 Styling (mobile)

- **NativeWind `className`** for className-heavy screens (parent/portal) — color tokens
  (`primary/secondary/success/warning/danger/gray`) are defined in `tailwind.config.js`.
- **`StyleSheet.create`** for the design-system screens (admin/employee dashboards) via
  `@/constants/theme` + `@/styles` (`headerStyles`, `layoutStyles`, `bodyStyles`, `cardStyles`, …).
- Pick one approach per screen consistent with the screen you're porting.

### 4.7 Mobile lint rules that bite (satisfy these)

- **`react-native/no-inline-styles`** — flags inline style objects containing **literal values**
  (strings _and_ numbers, e.g. `{ width: 40 }`, `{ color: 'rgba(...)' }`). Fix: hoist to
  `StyleSheet.create`, or for dynamic values assign to a `const` var (an object that references only
  variables is fine). For dynamic width use `... as DimensionValue`.
- **`react-native/no-unused-styles`** — remove unused `StyleSheet` entries.
- **`react/no-unstable-nested-components`** — pass icon **component references** or module-level fns
  as `tabBarIcon`/renderers, never inline `({...}) => <Icon/>`.
- **`no-bitwise`** — add `// eslint-disable-next-line no-bitwise` for intentional hashing/base64.
- **`eslint-comments/no-unused-disable`** — no stale disable directives.

### 4.8 Native concerns (mobile, when relevant)

- **Permissions** (camera/notifications/location): request at point of use, always handle **denial**
  gracefully with a fallback; OS blocks re-prompting after denial.
- **Network:** handle offline/loading/error/retry states for anything requiring internet.
- **Push notifications & performance:** avoid unnecessary reloads/refetches.
- iOS `PrivacyInfo.xcprivacy` + platform permission strings when adding sensitive-API libs.

---

## 5. Cross-cutting patterns (both apps)

- **Toasts:** friendly, modern, with close affordance. Web = `sonner`; mobile = `@/utils/toast` bridge.
- **Errors:** parse via `@educard/shared` error helpers → field-level highlight for validation errors,
  toast for non-field errors.
- **Filters:** one common filter utility/component per app, reused across all list screens.
- **Dates:** one shared DatePicker/DateTimePicker + date utils; never hand-roll per screen.
- **Naming:** files `kebab-case` (web) / `PascalCase` components (mobile screens); barrels everywhere.

---

## 6. New feature / screen checklist

**Web**

1. `features/<feature>/{types,api,hooks(+mutations),components,pages}` + `index.ts`.
2. List page = `DataTable` + `ResourceFilter` + `Pagination` + `common-columns` in
   `resource-list-layout`; forms = RHF + zod + `components/form` fields + `PageHeader`.
3. Errors via `use-form-error-handler`; mutations invalidate related queries.
4. Reuse across roles; gate by role/permission. Typecheck + eslint (0 warnings) + prettier.

**Mobile**

1. Port logic from `mobile-expo`; swap Expo APIs (§4.5). Data layer =
   `features/<feature>/{api,hooks,index}`.
2. Screen in `screens/<role|shared>/…`; if shared/detail, register in `SharedStackParamList` +
   `MainStackNavigator`; replace relevant `pendingScreen` no-ops with real navigation.
3. Reuse `Screen`/`Header`/ui atoms/screen bases; gradients via `@/lib/linear-gradient`; forms in
   `KeyboardAwareScrollView`.
4. Satisfy mobile lint rules (§4.7). Run: `typecheck` + `lint` + `test`.

---

## 7. Commands & commit conventions

**Mobile validation (WSL):**

```
cd educard-clients && corepack pnpm --filter @educard/mobile typecheck
corepack pnpm --filter @educard/mobile lint          # eslint . --max-warnings=0
cd apps/mobile && corepack pnpm test
```

**Web validation:** typecheck + `eslint --fix` (0 warnings) + prettier before commit.

**Commits (commitlint, `educard-clients`):**

- Conventional Commits type prefix required: `type(scope): summary` where type ∈
  `feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`; scope optional, lowercase.
- **Subject (first line) must be all lowercase** — even acronyms/camelCase (`isParent`, `PR`) fail
  `[subject-case]`. Uppercase is fine in the body (after a blank line).
- Keep it a **single concise subject line**; put detail in the body only if asked.
- Pre-commit hooks run prettier + tsc + eslint on staged files.

---

## 8. Do / Don't

**Do:** reuse shared components; parameterize per role; keep files < 500 lines; barrel exports;
mutations separate; validate before done; consume `@educard/shared`.

**Don't:** touch `@educard/shared` in a web-breaking way; hand-roll inputs/tables/dialogs;
inline styles with literals (mobile); leave `console.log`/`any`/unused imports; copy-paste per role;
ship from `mobile-expo`.
