# EduCard Mobile App - Development Guidelines

## Do's and Don'ts for Mobile Development

---

## 1. Project Setup

### ✅ DO's

```bash
# Use the latest Expo SDK
npx create-expo-app@latest educard-mobile --template tabs

# Always fix Expo dependencies after SDK upgrade
npx expo install --fix

# Use TypeScript strict mode
# tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### ❌ DON'Ts

```bash
# Don't use outdated SDK versions
npx create-expo-app educard-mobile  # Without @latest

# Don't ignore dependency warnings
# Always run: npx expo install --fix

# Don't disable TypeScript checks
{
  "compilerOptions": {
    "strict": false,  // ❌ Never do this
    "noImplicitAny": false  // ❌ Never do this
  }
}
```

---

## 2. Environment Variables

### ✅ DO's

```typescript
// .env.development
EXPO_PUBLIC_API_URL=https://dev-api.educard.com
EXPO_PUBLIC_APP_ENV=development

// .env.production
EXPO_PUBLIC_API_URL=https://api.educard.com
EXPO_PUBLIC_APP_ENV=production

// Access using dot notation ONLY
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const appEnv = process.env.EXPO_PUBLIC_APP_ENV;

// Create a config file for type safety
// constants/config.ts
export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL!,
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV as 'development' | 'staging' | 'production',
  IS_DEV: process.env.EXPO_PUBLIC_APP_ENV === 'development',
} as const;
```

### ❌ DON'Ts

```typescript
// ❌ Never use bracket notation
const apiUrl = process.env['EXPO_PUBLIC_API_URL'];

// ❌ Never destructure
const { EXPO_PUBLIC_API_URL } = process.env;

// ❌ Never store secrets in env files (they're bundled in the app!)
EXPO_PUBLIC_SECRET_KEY=super_secret  // ❌ NEVER!

// ❌ Never commit .env files
// Add to .gitignore:
.env*
!.env.example
```

---

## 3. Navigation (Expo Router)

### ✅ DO's

```typescript
// Use file-based routing properly
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }} 
      />
    </Tabs>
  );
}

// Navigate programmatically with type safety
import { router } from 'expo-router';

// Push to stack
router.push('/student/123');

// Replace current screen
router.replace('/dashboard');

// Go back
router.back();

// Navigate with params
router.push({
  pathname: '/student/[id]',
  params: { id: '123' },
});
```

### ❌ DON'Ts

```typescript
// ❌ Don't use React Navigation directly (use Expo Router)
import { NavigationContainer } from '@react-navigation/native';

// ❌ Don't hardcode routes
router.push('/student/123');  // Use params instead

// ❌ Don't nest navigators unnecessarily
// Keep navigation structure flat when possible

// ❌ Don't forget to handle deep linking
// Configure in app.json
```

---

## 4. Permissions Handling

### ✅ DO's

```typescript
// hooks/usePermissions.ts
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Camera from 'expo-camera';

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export function usePermissions() {
  // Always check permission status first
  const checkCameraPermission = async (): Promise<PermissionResult> => {
    const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
    return { granted: status === 'granted', canAskAgain };
  };

  // Request with proper fallback
  const requestCameraPermission = async (): Promise<boolean> => {
    const { granted, canAskAgain } = await checkCameraPermission();
    
    if (granted) return true;
    
    if (canAskAgain) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    
    // Guide user to settings
    showSettingsAlert('Camera access is required to scan documents');
    return false;
  };

  return { checkCameraPermission, requestCameraPermission };
}

// Show helpful alert when permission denied
const showSettingsAlert = (message: string) => {
  Alert.alert(
    'Permission Required',
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ]
  );
};
```

### ❌ DON'Ts

```typescript
// ❌ Don't request permissions without explanation
await Camera.requestCameraPermissionsAsync();  // User doesn't know why

// ❌ Don't ignore permission denial
const { status } = await Location.requestForegroundPermissionsAsync();
// Always handle denied case!

// ❌ Don't request all permissions at app launch
// Request only when needed for a specific feature

// ❌ Don't assume permissions are granted
// Always verify before using permission-gated APIs
```

---

## 5. API Handling

### ✅ DO's

```typescript
// api/client.ts - Proper API setup
import axios, { AxiosError } from 'axios';
import { Config } from '@/constants/config';

export const api = axios.create({
  baseURL: Config.API_URL,
  timeout: 30000,
});

// Use React Query for data fetching
// hooks/useStudents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useStudents(classId: string) {
  return useQuery({
    queryKey: ['students', classId],
    queryFn: () => fetchStudents(classId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Mutations with optimistic updates
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markAttendance,
    onMutate: async (newAttendance) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['attendance'] });
      const previousData = queryClient.getQueryData(['attendance']);
      queryClient.setQueryData(['attendance'], (old) => ({
        ...old,
        ...newAttendance,
      }));
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['attendance'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
```

### ❌ DON'Ts

```typescript
// ❌ Don't fetch data in components directly
useEffect(() => {
  fetch('/api/students')
    .then(res => res.json())
    .then(setStudents);
}, []);

// ❌ Don't ignore loading states
const { data } = useStudents();
return <StudentList students={data} />;  // data might be undefined!

// ❌ Don't ignore errors
const { data } = useStudents();  // What if it fails?

// ❌ Don't make API calls without timeout
fetch('/api/students');  // Could hang forever

// ❌ Don't store API responses in local state (use React Query)
const [students, setStudents] = useState([]);
```

---

## 6. Network Handling

### ✅ DO's

```typescript
// providers/NetworkProvider.tsx
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState } from 'react';

interface NetworkContextType {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isConnected: true,
  connectionType: null,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isOnline: true,
    isConnected: true,
    connectionType: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isOnline: state.isInternetReachable ?? true,
        isConnected: state.isConnected ?? true,
        connectionType: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

// Show offline banner
function OfflineBanner() {
  const { isOnline } = useNetwork();
  
  if (isOnline) return null;
  
  return (
    <View style={styles.banner}>
      <WifiOffIcon />
      <Text>You're offline. Some features may be limited.</Text>
    </View>
  );
}
```

### ❌ DON'Ts

```typescript
// ❌ Don't assume network is always available
const response = await fetch('/api/data');  // Will fail silently offline

// ❌ Don't show generic error for network issues
catch (error) {
  Alert.alert('Error', 'Something went wrong');  // Not helpful
}

// ❌ Don't block the entire app when offline
if (!isOnline) {
  return <Text>Please connect to internet</Text>;  // Bad UX
}

// ❌ Don't ignore connection type (WiFi vs Cellular)
// Large downloads should warn on cellular
```

---

## 7. Responsive UI

### ✅ DO's

```typescript
// Use NativeWind (Tailwind) for responsive design
import { View, Text } from 'react-native';

function DashboardCard() {
  return (
    <View className="w-full sm:w-1/2 lg:w-1/3 p-2">
      <View className="bg-white rounded-lg shadow p-4">
        <Text className="text-lg sm:text-xl font-bold">Card Title</Text>
      </View>
    </View>
  );
}

// Use useWindowDimensions for dynamic calculations
import { useWindowDimensions } from 'react-native';

function ResponsiveGrid() {
  const { width } = useWindowDimensions();
  const columns = width < 640 ? 2 : width < 1024 ? 3 : 4;
  
  return (
    <FlatList
      data={items}
      numColumns={columns}
      key={columns}  // Force re-render when columns change
      renderItem={({ item }) => <GridItem item={item} />}
    />
  );
}

// Use SafeAreaView for proper padding
import { SafeAreaView } from 'react-native-safe-area-context';

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      {children}
    </SafeAreaView>
  );
}
```

### ❌ DON'Ts

```typescript
// ❌ Don't use fixed pixel values
<View style={{ width: 375 }}>  // iPhone width, won't work everywhere

// ❌ Don't ignore safe areas
<View style={{ paddingTop: 44 }}>  // Hard-coded notch height

// ❌ Don't use percentage for everything
<View style={{ width: '33%' }}>  // Might not look good on tablets

// ❌ Don't ignore landscape orientation
// Test your app in both orientations

// ❌ Don't use ScrollView for long lists
<ScrollView>
  {items.map(item => <Item key={item.id} />)}  // Bad for performance
</ScrollView>
// Use FlatList or FlashList instead
```

---

## 8. Push Notifications

### ✅ DO's

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  // Must be a physical device
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  // Android-specific channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token.data;
}

// Handle notification tap
export function setupNotificationListeners() {
  // When user taps notification
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(data);
    }
  );

  return () => subscription.remove();
}

function handleNotificationNavigation(data: NotificationData) {
  switch (data.type) {
    case 'attendance':
      router.push(`/attendance/${data.classId}`);
      break;
    case 'exam':
      router.push(`/exams/${data.examId}`);
      break;
    case 'announcement':
      router.push('/notifications');
      break;
  }
}
```

### ❌ DON'Ts

```typescript
// ❌ Don't test push notifications on simulator
// They only work on physical devices

// ❌ Don't request notification permission at app launch
// Wait for a relevant moment

// ❌ Don't ignore token refresh
// Tokens can change, always update on backend

// ❌ Don't send sensitive data in notification payload
// Payload is visible in system notification center

// ❌ Don't forget to handle notification when app is killed
// Use background handlers for critical notifications
```

---

## 9. Performance

### ✅ DO's

```typescript
// Use memo for expensive components
import { memo } from 'react';

const StudentCard = memo(function StudentCard({ student }: Props) {
  return (
    <View>
      <Text>{student.name}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.student.id === nextProps.student.id;
});

// Use useCallback for event handlers
const handlePress = useCallback(() => {
  router.push(`/student/${studentId}`);
}, [studentId]);

// Use useMemo for expensive calculations
const sortedStudents = useMemo(() => {
  return [...students].sort((a, b) => a.name.localeCompare(b.name));
}, [students]);

// Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={students}
  renderItem={renderStudent}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>

// Use expo-image for better image performance
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>

// Lazy load screens
const HeavyScreen = lazy(() => import('./HeavyScreen'));
```

### ❌ DON'Ts

```typescript
// ❌ Don't create new objects/arrays in render
<FlatList
  data={students}
  contentContainerStyle={{ padding: 16 }}  // New object every render
/>

// ❌ Don't use inline functions without useCallback
<Button onPress={() => handlePress(item.id)} />  // New function every render

// ❌ Don't render everything at once
{students.map(student => <StudentCard student={student} />)}
// Use virtualized lists

// ❌ Don't load all images at once
// Use lazy loading and placeholders

// ❌ Don't ignore re-render cycles
// Use React DevTools Profiler to find issues

// ❌ Don't store derived state
const [sortedStudents, setSortedStudents] = useState([]);
useEffect(() => {
  setSortedStudents(students.sort());
}, [students]);
// Use useMemo instead
```

---

## 10. TypeScript Best Practices

### ✅ DO's

```typescript
// Define proper types for all data
interface Student {
  id: string;
  name: string;
  rollNumber: string;
  classId: string;
  parentId: string;
  createdAt: string;
  updatedAt: string;
}

// Use discriminated unions for state
type RequestState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Use const assertions
const ROLES = ['admin', 'employee', 'parent'] as const;
type Role = typeof ROLES[number];

// Use generics for reusable components
interface ListProps<T> {
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ data, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={keyExtractor}
    />
  );
}

// Type API responses
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

async function fetchStudents(): Promise<ApiResponse<Student[]>> {
  const response = await api.get<ApiResponse<Student[]>>('/students');
  return response.data;
}
```

### ❌ DON'Ts

```typescript
// ❌ Never use 'any'
function handleData(data: any) {}  // ❌

// ❌ Never ignore TypeScript errors
// @ts-ignore
const value = someFunction();  // ❌

// ❌ Don't use 'as' to bypass type checking
const student = data as Student;  // Prefer type guards

// ❌ Don't use non-null assertion operator carelessly
const name = user!.name;  // Could be null at runtime

// ❌ Don't export types from index.ts
export * from './types';  // Creates circular dependencies
// Export types explicitly
export type { Student } from './types';
```

---

## 11. Security

### ✅ DO's

```typescript
// Use SecureStore for sensitive data
import * as SecureStore from 'expo-secure-store';

async function storeToken(token: string) {
  await SecureStore.setItemAsync('accessToken', token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

// Validate all user inputs
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Sanitize data before display
import { sanitize } from 'dompurify';  // For web

// Use HTTPS only
const API_URL = 'https://api.educard.com';  // Never HTTP

// Implement proper logout
async function logout() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('userData');
  queryClient.clear();
  router.replace('/login');
}
```

### ❌ DON'Ts

```typescript
// ❌ Never store sensitive data in AsyncStorage
await AsyncStorage.setItem('accessToken', token);  // Not secure!

// ❌ Never log sensitive data
console.log('User password:', password);  // ❌

// ❌ Never include secrets in client code
const API_KEY = 'sk_live_xxxxx';  // ❌ Will be in bundle

// ❌ Never trust client-side validation alone
// Always validate on server

// ❌ Never store user data in plain text
await AsyncStorage.setItem('user', JSON.stringify(user));  // ❌
```

---

## 12. Code Quality

### ✅ DO's

```typescript
// Use ESLint with strict rules
// .eslintrc.js
module.exports = {
  extends: ['expo', 'prettier'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/exhaustive-deps': 'error',
  },
};

// Use Prettier for formatting
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2
}

// Create barrel exports
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';

// Use absolute imports
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"]
    }
  }
}

// Write meaningful commit messages
git commit -m "feat(auth): add biometric login support"
git commit -m "fix(attendance): handle offline submission"
```

### ❌ DON'Ts

```typescript
// ❌ Don't commit console.log statements
console.log('debug', data);

// ❌ Don't leave TODO comments forever
// TODO: fix this later  // Schedule it or create an issue

// ❌ Don't ignore linting errors
/* eslint-disable */

// ❌ Don't use relative imports across modules
import { Button } from '../../../../components/ui/Button';

// ❌ Don't commit with failing tests
git commit --no-verify  // ❌
```

---

## Quick Reference Checklist

### Before Every Commit

- [ ] No `console.log` statements
- [ ] No `any` types
- [ ] No ESLint errors/warnings
- [ ] TypeScript compiles without errors
- [ ] Prettier applied
- [ ] Tests pass
- [ ] Works on both iOS and Android
- [ ] Works in both orientations
- [ ] Handles offline gracefully
- [ ] Loading states implemented
- [ ] Error states implemented

### Before Every Release

- [ ] All permissions have usage descriptions
- [ ] Privacy manifest updated (iOS)
- [ ] Environment variables set correctly
- [ ] Deep linking tested
- [ ] Push notifications tested
- [ ] Performance profiled
- [ ] Security audit completed
- [ ] Accessibility tested
