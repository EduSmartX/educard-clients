# EduCard Frontend Learning Roadmap

> A step-by-step roadmap to learn everything needed to confidently work on `educard-clients` (Web + Mobile). Check off each item as you complete it. Backend is **excluded** intentionally.

**Your Actual Stack (verified from package.json):**

| Area           | Web (`apps/web`)                                | Mobile (`apps/mobile`)                              |
| -------------- | ----------------------------------------------- | --------------------------------------------------- |
| Core           | React 19.2, TypeScript, Vite                    | React Native 0.83.6 (New Architecture), React 19.2  |
| Navigation     | React Router                                    | React Navigation 7 (native-stack + bottom-tabs)     |
| State (server) | TanStack Query 5.60                             | TanStack Query 5.90                                 |
| State (client) | React hooks/context                             | Zustand 5.0.8                                       |
| Forms          | React Hook Form 7.66 + Zod                      | React Hook Form 7.62 + Zod 4.1                      |
| Styling        | Tailwind CSS + Radix UI                         | NativeWind 4.2 (Tailwind for RN)                    |
| Animation      | Framer Motion 12.23                             | Reanimated 4.2.1 + worklets                         |
| Extras         | TipTap, Axios, date-fns, TanStack Table/Virtual | Firebase (analytics/crashlytics/messaging), Notifee |
| Monorepo       | pnpm workspaces                                 | pnpm workspaces                                     |
| Testing        | Vitest + RTL                                    | Jest 29.6 + @testing-library/react-native           |

---

## Phase 0 — Prerequisites (if rusty)

- [ ] JavaScript ES6+ (destructuring, spread, async/await, modules, closures)
  - 📺 Udemy: **"The Complete JavaScript Course 2024"** by Jonas Schmedtmann
- [ ] Git & GitHub basics (branch, merge, rebase, PR workflow, cherry-pick)
  - 📺 Udemy: **"Git Complete"** by Catalin Tudose (or free: [learngitbranching.js.org](https://learngitbranching.js.org))
- [ ] HTML/CSS fundamentals (flexbox, grid, box model)
  - 📺 Udemy: **"The Complete 2024 Web Development Bootcamp"** (sections 1-10) by Dr. Angela Yu

---

## Phase 1 — TypeScript (foundation for everything)

- [ ] Types, interfaces, generics, utility types (`Partial`, `Pick`, `Omit`)
- [ ] Type narrowing, discriminated unions
- [ ] Strict mode, `unknown` vs `any` (project uses strict mode, no `any`)
- 📺 Udemy: **"Understanding TypeScript"** by Maximilian Schwarzmüller
- 📺 Udemy: **"TypeScript: The Complete Developer's Guide"** by Stephen Grider
- 📖 Official docs: [typescriptlang.org/docs](https://www.typescriptlang.org/docs/)

---

## Phase 2 — React 19 Core

- [ ] Components, props, state, hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`)
- [ ] Custom hooks (project convention: `{ data, isLoading, error, actions }`)
- [ ] Context API
- [ ] React 19 features: Actions, `use()` hook, improved refs
- [ ] Suspense + lazy loading (used in `App.tsx` for route-level code splitting)
- 📺 Udemy: **"React - The Complete Guide"** by Maximilian Schwarzmüller (covers React 19)
- 📖 Official docs: [react.dev/learn](https://react.dev/learn)

---

## Phase 3 — Web App Stack (`apps/web`)

### 3.1 Vite

- [ ] Dev server, env vars, build config
- 📖 Docs: [vitejs.dev/guide](https://vitejs.dev/guide/)

### 3.2 React Router

- [ ] Routes, nested routes, lazy routes, navigation hooks
- 📺 Udemy: **"React Router 6"** section in Schwarzmüller's React course

### 3.3 TanStack Query (server state — critical, used everywhere)

- [ ] `useQuery`, `useMutation`, query keys, invalidation, caching
- [ ] Optimistic updates
- 📺 Udemy: **"React Query - The Complete Developer's Guide"** by Stephen Grider / Bonnie Schulkin
- 📖 Official docs: [tanstack.com/query/latest](https://tanstack.com/query/latest) (excellent, often better than courses)

### 3.4 TanStack Table & Virtual

- [ ] Column defs, sorting, filtering, pagination
- [ ] Virtualization for large lists
- 📖 Official docs: [tanstack.com/table](https://tanstack.com/table/latest), [tanstack.com/virtual](https://tanstack.com/virtual/latest)

### 3.5 React Hook Form + Zod

- [ ] `useForm`, `register`, `Controller`, validation via `zodResolver`
- [ ] Schema-first validation patterns
- 📺 Udemy: **"React Hook Form" section** in any modern React course, or free YouTube crash course
- 📖 Docs: [react-hook-form.com](https://react-hook-form.com), [zod.dev](https://zod.dev)

### 3.6 Radix UI + Tailwind (shadcn/ui style)

- [ ] Unstyled accessible primitives (dialog, dropdown, select, tabs, tooltip)
- [ ] Tailwind utility classes, `class-variance-authority`, `clsx`
- 📺 Udemy: **"Tailwind CSS From Scratch"** by Brad Traversy
- 📖 Docs: [radix-ui.com](https://www.radix-ui.com), [ui.shadcn.com](https://ui.shadcn.com) (even if not using shadcn directly, patterns match)

### 3.7 Framer Motion

- [ ] Basic animations, variants, `AnimatePresence`
- 📖 Docs: [framer.com/motion](https://www.framer.com/motion/)

### 3.8 Misc

- [ ] Axios interceptors (for shared API client)
- [ ] TipTap basics (if touching rich text editor features)
- [ ] `date-fns` for date formatting

---

## Phase 4 — Mobile App Stack (`apps/mobile`)

### 4.1 React Native Fundamentals

- [ ] Core components (`View`, `Text`, `ScrollView`, `FlatList`, `Modal`)
- [ ] New Architecture (Fabric + TurboModules) — what it changes vs old arch
- [ ] Platform-specific code (`Platform.OS`, `.ios.tsx`/`.android.tsx`)
- [ ] Keyboard handling (`KeyboardAvoidingView`, safe areas) — you've already debugged this firsthand
- 📺 Udemy: **"React Native - The Practical Guide"** by Maximilian Schwarzmüller
- 📺 Udemy: **"The Complete React Native + Hooks Course"** by Stephen Grider

### 4.2 React Navigation 7

- [ ] Native stack navigator, bottom tabs, nested navigators
- [ ] Passing params, deep linking basics
- 📖 Docs: [reactnavigation.org](https://reactnavigation.org) (very good official docs)

### 4.3 Zustand

- [ ] Store creation, selectors, persistence (used for `auth-store.ts`)
- 📺 YouTube: "Zustand in 100 seconds" + official docs (library is simple, course not needed)
- 📖 Docs: [zustand.docs.pmnd.rs](https://zustand.docs.pmnd.rs)

### 4.4 NativeWind

- [ ] Tailwind classes in RN via `className` prop
- 📖 Docs: [nativewind.dev](https://www.nativewind.dev)

### 4.5 Reanimated 4 + Worklets

- [ ] Shared values, `useAnimatedStyle`, gestures (`react-native-gesture-handler`)
- 📺 Udemy: **"React Native Reanimated 2/3"** by Catalin Miron (concepts transfer to v4)
- 📖 Docs: [docs.swmansion.com/react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)

### 4.6 Native Modules Used in This Project

- [ ] Firebase (`@react-native-firebase/*`): analytics, crashlytics, messaging (push notifications)
- [ ] Notifee (local notifications)
- [ ] `react-native-image-picker`, `react-native-contacts`, `react-native-keychain`, `react-native-geolocation`, `react-native-permissions`, `react-native-document-picker`, `react-native-share`
- 📖 Docs: read each library's README on GitHub/npm as needed — no full course required, these are task-specific

### 4.7 Android/iOS Native Layer (what you already touched)

- [ ] Gradle basics, `build.gradle`, `AndroidManifest.xml`, `strings.xml`
- [ ] Signing configs, keystores, versionCode/versionName
- [ ] iOS `Info.plist`, `app.json` (Expo-adjacent config even in bare RN)
- 📺 Udemy: **"React Native Deployment"** sections in any RN course cover this lightly; otherwise learn via official docs as issues arise

---

## Phase 5 — Shared/Cross-cutting Skills

- [ ] **pnpm workspaces / monorepo** — linking `@educard/shared`, running filtered scripts
  - 📖 Docs: [pnpm.io/workspaces](https://pnpm.io/workspaces)
- [ ] **Testing**: Vitest + React Testing Library (web), Jest + @testing-library/react-native (mobile)
  - 📺 Udemy: **"Testing React with Jest and React Testing Library"** by Bonnie Schulkin
- [ ] **ESLint + Prettier + Husky + lint-staged + Commitlint** — understand why commits get blocked
- [ ] **CI/CD basics** (GitHub Actions) — read `.github/workflows/*.yml` to understand what checks run on PRs

---

## Suggested Timeline (if starting fresh, ~10-15 hrs/week)

| Weeks | Focus                                                                              |
| ----- | ---------------------------------------------------------------------------------- |
| 1-2   | Phase 0 + Phase 1 (JS/Git/TypeScript)                                              |
| 3-4   | Phase 2 (React core)                                                               |
| 5-7   | Phase 3 (Web stack — TanStack Query first, then forms, then UI)                    |
| 8-10  | Phase 4 (Mobile — RN fundamentals, navigation, then Zustand/NativeWind/Reanimated) |
| 11    | Phase 5 (tooling/testing)                                                          |
| 12    | Build a practice project combining everything (see below)                          |

## If Time-Constrained — Priority Order

1. TypeScript basics
2. React core hooks
3. TanStack Query
4. React Hook Form + Zod
5. React Native fundamentals + Navigation
6. Everything else, learned on-demand as you touch those files

---

## Practice Project Idea (optional, do after Phase 3-4)

Build a mini CRUD feature mirroring the `students`/`teachers` pattern in this repo:

- A list screen (TanStack Query `useQuery` + TanStack Table/FlatList)
- A create/edit form (React Hook Form + Zod + Radix dialog / RN Modal)
- Optimistic delete (TanStack Query `useMutation`)
- Shared types between a "web" and "mobile" version to practice the monorepo pattern

Ask the agent to scaffold this when ready — it can generate a guided practice app that intentionally uses the same patterns as this codebase.
