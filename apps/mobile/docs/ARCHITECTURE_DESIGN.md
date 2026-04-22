# EduCard Mobile App - Architecture Design Document

## Overview

EduCard Mobile is a cross-platform application built with **Expo SDK 52+** supporting Web, Android, and iOS from a single codebase. The app serves three user roles: **Admin (Principal)**, **Employee (Teacher/Staff)**, and **Parent**.

---

## 1. Project Structure

```
educard-mobile/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/                   # Authentication screens (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main tab navigation (authenticated)
│   │   ├── _layout.tsx
│   │   ├── (admin)/              # Admin-specific tabs
│   │   │   ├── _layout.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── teachers.tsx
│   │   │   ├── students.tsx
│   │   │   ├── classes.tsx
│   │   │   └── settings.tsx
│   │   ├── (employee)/           # Employee-specific tabs
│   │   │   ├── _layout.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── attendance.tsx
│   │   │   ├── timetable.tsx
│   │   │   └── profile.tsx
│   │   └── (parent)/             # Parent-specific tabs
│   │       ├── _layout.tsx
│   │       ├── dashboard.tsx
│   │       ├── children.tsx
│   │       ├── attendance.tsx
│   │       └── notifications.tsx
│   ├── (modals)/                 # Modal screens
│   │   ├── student-details.tsx
│   │   ├── mark-attendance.tsx
│   │   └── exam-results.tsx
│   ├── _layout.tsx               # Root layout with providers
│   └── index.tsx                 # Entry point (redirects based on auth)
├── src/
│   ├── api/                      # API layer
│   │   ├── client.ts             # Axios instance with interceptors
│   │   ├── auth.ts
│   │   ├── students.ts
│   │   ├── attendance.ts
│   │   ├── exams.ts
│   │   └── index.ts
│   ├── components/               # Shared components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── index.ts
│   │   ├── forms/                # Form components
│   │   │   ├── FormField.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Select.tsx
│   │   │   └── index.ts
│   │   ├── layout/               # Layout components
│   │   │   ├── Screen.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── TabBar.tsx
│   │   │   └── index.ts
│   │   └── common/               # Common feature components
│   │       ├── LoadingScreen.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── NetworkStatus.tsx
│   │       ├── EmptyState.tsx
│   │       └── index.ts
│   ├── features/                 # Feature modules (role-based)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── teachers/
│   │   │   ├── students/
│   │   │   └── index.ts
│   │   ├── employee/
│   │   │   ├── dashboard/
│   │   │   ├── attendance/
│   │   │   ├── timetable/
│   │   │   └── index.ts
│   │   └── parent/
│   │       ├── dashboard/
│   │       ├── children/
│   │       └── index.ts
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── useNetwork.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useRefreshOnFocus.ts
│   │   └── index.ts
│   ├── lib/                      # Utilities
│   │   ├── storage.ts            # Secure storage wrapper
│   │   ├── permissions.ts        # Permission handlers
│   │   ├── notifications.ts      # Push notification setup
│   │   ├── network.ts            # Network utilities
│   │   └── index.ts
│   ├── providers/                # Context providers
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── NetworkProvider.tsx
│   │   ├── NotificationProvider.tsx
│   │   └── index.ts
│   ├── constants/                # App constants
│   │   ├── config.ts
│   │   ├── routes.ts
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript types
│   │   ├── api.ts
│   │   ├── navigation.ts
│   │   ├── user.ts
│   │   └── index.ts
│   └── utils/                    # Utility functions
│       ├── date.ts
│       ├── validation.ts
│       ├── format.ts
│       └── index.ts
├── assets/                       # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
├── ios/                          # iOS native code (generated)
│   └── EduCard/
│       └── PrivacyInfo.xcprivacy
├── android/                      # Android native code (generated)
├── app.json                      # Expo configuration
├── app.config.ts                 # Dynamic Expo config
├── eas.json                      # EAS Build configuration
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── .env.development
├── .env.staging
├── .env.production
└── package.json
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Expo SDK 52+ | Cross-platform development |
| Routing | Expo Router v3 | File-based navigation |
| State | Zustand + React Query | Global state + Server state |
| Styling | NativeWind (Tailwind) | Utility-first styling |
| Forms | React Hook Form + Zod | Form handling + validation |
| API | Axios + React Query | HTTP client + caching |
| Storage | expo-secure-store | Secure token storage |
| Notifications | expo-notifications | Push notifications |
| Auth | JWT + Refresh tokens | Authentication |

---

## 3. Navigation Architecture

### 3.1 Navigation Flow

```
┌─────────────────────────────────────────────────────────┐
│                      Root Layout                         │
│  (AuthProvider, ThemeProvider, NetworkProvider, etc.)   │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    ┌───────────────┐               ┌───────────────┐
    │  (auth) Group │               │  (tabs) Group │
    │ Unauthenticated│              │ Authenticated │
    └───────────────┘               └───────────────┘
            │                               │
    ┌───────┴───────┐           ┌──────────┼──────────┐
    ▼               ▼           ▼          ▼          ▼
  Login      Forgot Pass    (admin)   (employee)  (parent)
  Signup                    Tab Nav    Tab Nav    Tab Nav
```

### 3.2 Role-Based Tab Configuration

```typescript
// Admin Tabs
const ADMIN_TABS = [
  { name: 'dashboard', icon: 'home', label: 'Home' },
  { name: 'teachers', icon: 'users', label: 'Teachers' },
  { name: 'students', icon: 'graduation-cap', label: 'Students' },
  { name: 'classes', icon: 'building', label: 'Classes' },
  { name: 'settings', icon: 'settings', label: 'Settings' },
];

// Employee Tabs
const EMPLOYEE_TABS = [
  { name: 'dashboard', icon: 'home', label: 'Home' },
  { name: 'attendance', icon: 'clipboard-check', label: 'Attendance' },
  { name: 'timetable', icon: 'calendar', label: 'Timetable' },
  { name: 'exams', icon: 'file-text', label: 'Exams' },
  { name: 'profile', icon: 'user', label: 'Profile' },
];

// Parent Tabs
const PARENT_TABS = [
  { name: 'dashboard', icon: 'home', label: 'Home' },
  { name: 'children', icon: 'users', label: 'Children' },
  { name: 'attendance', icon: 'calendar-check', label: 'Attendance' },
  { name: 'notifications', icon: 'bell', label: 'Alerts' },
  { name: 'profile', icon: 'user', label: 'Profile' },
];
```

---

## 4. Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    App Launch                            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Check Stored Tokens    │
              │  (SecureStore)          │
              └─────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
      No Tokens                        Has Tokens
            │                               │
            ▼                               ▼
    ┌───────────────┐         ┌─────────────────────────┐
    │  Login Screen │         │  Validate Access Token  │
    └───────────────┘         └─────────────────────────┘
                                            │
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                      Valid                              Expired
                          │                                   │
                          ▼                                   ▼
              ┌───────────────────┐           ┌─────────────────────────┐
              │  Fetch User Data  │           │  Try Refresh Token      │
              │  → Role-based Tab │           └─────────────────────────┘
              └───────────────────┘                         │
                                              ┌─────────────┴─────────────┐
                                              │                           │
                                          Success                      Failed
                                              │                           │
                                              ▼                           ▼
                                    ┌───────────────┐         ┌───────────────┐
                                    │ Update Tokens │         │ Clear Tokens  │
                                    │ → Dashboard   │         │ → Login       │
                                    └───────────────┘         └───────────────┘
```

---

## 5. State Management

### 5.1 Global State (Zustand)

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

// stores/appStore.ts
interface AppState {
  isOnline: boolean;
  pendingSync: PendingSyncItem[];
  setOnline: (status: boolean) => void;
  addPendingSync: (item: PendingSyncItem) => void;
  processPendingSync: () => Promise<void>;
}
```

### 5.2 Server State (React Query)

```typescript
// Query Keys Structure
const queryKeys = {
  auth: ['auth'] as const,
  user: (id: string) => ['user', id] as const,
  students: {
    all: ['students'] as const,
    list: (filters: StudentFilters) => ['students', 'list', filters] as const,
    detail: (id: string) => ['students', 'detail', id] as const,
  },
  attendance: {
    daily: (date: string, classId: string) => ['attendance', date, classId] as const,
    summary: (studentId: string) => ['attendance', 'summary', studentId] as const,
  },
};
```

---

## 6. API Layer Architecture

### 6.1 API Client

```typescript
// api/client.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add Auth Token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor - Handle Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        await SecureStore.setItemAsync('accessToken', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        router.replace('/login');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 6.2 API Error Handling

```typescript
// types/api.ts
interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

// utils/errorHandler.ts
export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    return {
      status: response?.status ?? 500,
      message: response?.data?.message ?? 'Something went wrong',
      errors: response?.data?.errors,
      code: response?.data?.code,
    };
  }
  return {
    status: 500,
    message: 'Network error. Please check your connection.',
  };
}
```

---

## 7. Offline Support Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Network Monitor                        │
│              (NetInfo Event Listener)                   │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    ┌───────────────┐               ┌───────────────┐
    │    Online     │               │    Offline    │
    └───────────────┘               └───────────────┘
            │                               │
            ▼                               ▼
    ┌───────────────────┐       ┌─────────────────────────┐
    │  Normal API Calls │       │  Queue Mutations        │
    │  + Sync Pending   │       │  (AsyncStorage)         │
    └───────────────────┘       └─────────────────────────┘
                                            │
                                            ▼
                                ┌─────────────────────────┐
                                │  Show Offline Banner    │
                                │  Disable certain actions│
                                └─────────────────────────┘
```

### Offline-First Features

| Feature | Offline Behavior |
|---------|------------------|
| View Dashboard | Cached data displayed |
| View Students | Cached list, no search |
| Mark Attendance | Queued, syncs when online |
| View Timetable | Fully cached |
| Submit Forms | Queued with pending indicator |

---

## 8. Push Notification Architecture

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  
  return token.data;
}
```

### Notification Types

| Type | Trigger | Action |
|------|---------|--------|
| Attendance Alert | Student absent | Open attendance screen |
| Exam Scheduled | New exam created | Open exam details |
| Leave Approved | Leave request update | Open leave details |
| Fee Reminder | Payment due | Open fee details |
| Announcement | Admin broadcast | Open notifications |

---

## 9. Performance Optimization

### 9.1 List Optimization

```typescript
// Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={students}
  renderItem={({ item }) => <StudentCard student={item} />}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

### 9.2 Image Optimization

```typescript
// Use expo-image for better caching
import { Image } from 'expo-image';

<Image
  source={{ uri: profileUrl }}
  style={styles.avatar}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

### 9.3 Memoization Strategy

```typescript
// Memoize expensive components
const StudentCard = memo(({ student }: Props) => {
  // Component implementation
}, (prev, next) => prev.student.id === next.student.id);

// Memoize callbacks
const handlePress = useCallback(() => {
  navigation.navigate('StudentDetails', { id: student.id });
}, [student.id]);
```

---

## 10. Security Considerations

### 10.1 Token Storage

```typescript
// Always use SecureStore for sensitive data
import * as SecureStore from 'expo-secure-store';

// Store tokens securely
await SecureStore.setItemAsync('accessToken', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
});

// Never store tokens in AsyncStorage or state
```

### 10.2 API Security

- All API calls use HTTPS
- JWT tokens with short expiry (15 min access, 7 day refresh)
- Certificate pinning for production
- Request signing for sensitive operations

### 10.3 Data Protection

- Biometric authentication option for app unlock
- Auto-logout after inactivity period
- Clear sensitive data on logout
- Encrypted local database (if using SQLite)

---

## 11. Accessibility

```typescript
// Ensure all interactive elements are accessible
<Pressable
  accessible={true}
  accessibilityLabel="Mark student as present"
  accessibilityRole="button"
  accessibilityHint="Double tap to mark attendance"
  onPress={handleMarkPresent}
>
  <Text>Present</Text>
</Pressable>
```

### Accessibility Checklist

- [ ] All images have `accessibilityLabel`
- [ ] Touch targets minimum 44x44 points
- [ ] Color contrast ratio 4.5:1 minimum
- [ ] Screen reader navigation order logical
- [ ] Form fields have labels
- [ ] Error messages announced

---

## 12. Testing Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| Unit | Jest | Utils, Hooks, Store |
| Component | React Testing Library | UI Components |
| Integration | Detox | User Flows |
| E2E | Maestro | Critical Paths |

---

## Next Steps

1. Review and approve this architecture
2. Set up the project with `npx create-expo-app`
3. Configure EAS Build for CI/CD
4. Implement authentication flow first
5. Build core components
6. Add features incrementally by role
