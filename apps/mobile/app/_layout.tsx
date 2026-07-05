/**
 * Root Layout
 * Configures providers and handles auth state
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/auth-store';
import { queryClient } from '@/lib/query-client';
import { ToastProvider } from '@/lib/toast-context';

// Suppress harmless React Native internal warning from reanimated/gestures
LogBox.ignoreLogs(['viewIsDescendantOf']);

// Keep splash screen visible while loading
void SplashScreen.preventAutoHideAsync();

type AppSegments = ReturnType<typeof useSegments>;

/** Determine the correct dashboard route for a user's role */
function getDashboardRoute(role: string | undefined) {
  const normalized = role?.toLowerCase();
  if (normalized === 'teacher' || normalized === 'employee') {
    return '/(tabs)/(employee)/dashboard' as const;
  }
  if (normalized === 'student') {
    return '/(tabs)/(parent)/dashboard' as const;
  }
  return '/(tabs)/(admin)/dashboard' as const;
}

/** Check if the user needs to be redirected based on role and current segments */
function shouldRedirectAuthenticated(segments: AppSegments, role: string | undefined): boolean {
  const inAuthGroup = segments[0] === '(auth)';
  const inSharedScreens = segments[0] === '(shared-screens)';
  const inModals = segments[0] === ('(modals)' as (typeof segments)[0]);

  // Allow shared screens and modals for all authenticated users
  if (inSharedScreens || inModals) return false;

  const normalized = role?.toLowerCase();
  const isAdmin = normalized === 'admin';
  const isTeacher = normalized === 'teacher' || normalized === 'employee';
  // Note: there is no Parent role - student accounts are logged into by
  // parents/guardians on their child's behalf and reuse the Parent tab
  // group, so this only ever needs to check isStudent.
  const isStudent = normalized === 'student';

  const inAdminTabs = segments[0] === '(tabs)' && segments[1] === '(admin)';
  const inEmployeeTabs = segments[0] === '(tabs)' && segments[1] === '(employee)';
  const inParentTabs = segments[0] === '(tabs)' && segments[1] === '(parent)';

  return (
    inAuthGroup ||
    (isAdmin && !inAdminTabs) ||
    (isTeacher && !inEmployeeTabs) ||
    (isStudent && !inParentTabs)
  );
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);
  const isNavigating = useRef(false);

  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();

  // Track mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    if (isMounted) {
      void initialize();
    }
  }, [initialize, isMounted]);

  // Hide splash screen when initialized
  useEffect(() => {
    if (isInitialized && isMounted) {
      void SplashScreen.hideAsync();
    }
  }, [isInitialized, isMounted]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized || !isMounted) return;

    // Prevent multiple navigations during state transitions
    if (isNavigating.current) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      isNavigating.current = true;
      router.replace('/(auth)/login');
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    } else if (isAuthenticated && shouldRedirectAuthenticated(segments, user?.role)) {
      isNavigating.current = true;
      router.replace(getDashboardRoute(user?.role));
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    }
  }, [isAuthenticated, isInitialized, segments, user, router, isMounted]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(shared-screens)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="(modals)"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RootLayoutNav />
          </ToastProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
