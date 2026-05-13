/**
 * Root Layout
 * Configures providers and handles auth state
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/auth-store';
import { queryClient } from '@/lib/query-client';

// Keep splash screen visible while loading
void SplashScreen.preventAutoHideAsync();

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
    const inAdminTabs = segments[0] === '(tabs)' && segments[1] === '(admin)';
    const inEmployeeTabs = segments[0] === '(tabs)' && segments[1] === '(employee)';
    const inParentTabs = segments[0] === '(tabs)' && segments[1] === '(parent)';
    const inSharedScreens = segments[0] === '(shared-screens)';
    const inModals = segments[0] === '(modals)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated, redirect to login
      isNavigating.current = true;
      router.replace('/(auth)/login');
      // Reset navigation lock after a short delay
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    } else if (isAuthenticated) {
      // Get normalized role
      const role = user?.role?.toLowerCase();
      const isAdmin = role === 'admin';
      const isTeacher = role === 'teacher' || role === 'employee';
      const isParent = role === 'parent';

      // Allow shared screens and modals for all authenticated users
      if (inSharedScreens || inModals) {
        return; // Don't redirect - user is in a valid shared screen
      }

      // Check if user is in wrong dashboard for their role
      const needsRedirect =
        inAuthGroup ||
        (isAdmin && !inAdminTabs) ||
        (isTeacher && !inEmployeeTabs) ||
        (isParent && !inParentTabs);

      if (needsRedirect) {
        isNavigating.current = true;
        if (isAdmin) {
          router.replace('/(tabs)/(admin)/dashboard');
        } else if (isTeacher) {
          router.replace('/(tabs)/(employee)/dashboard');
        } else if (isParent) {
          router.replace('/(tabs)/(parent)/dashboard');
        } else {
          // Default fallback
          router.replace('/(tabs)/(admin)/dashboard');
        }
        // Reset navigation lock after a short delay
        setTimeout(() => {
          isNavigating.current = false;
        }, 500);
      }
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
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
