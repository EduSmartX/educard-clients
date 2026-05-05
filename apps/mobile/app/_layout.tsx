/**
 * Root Layout
 * Configures providers and handles auth state
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '@/lib/auth-store';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// Create React Query client outside component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Disable auto-refetch to avoid state update issues
    },
  },
});

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  const { isAuthenticated, isInitialized, user, initialize } = useAuthStore();

  // Track mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    if (isMounted) {
      initialize();
    }
  }, [initialize, isMounted]);

  // Hide splash screen when initialized
  useEffect(() => {
    if (isInitialized && isMounted) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized, isMounted]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized || !isMounted) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but in auth group, redirect to appropriate dashboard
      const role = user?.role;
      switch (role) {
        case 'admin':
          router.replace('/(tabs)/(admin)/dashboard');
          break;
        case 'employee':
          router.replace('/(tabs)/(employee)/dashboard');
          break;
        case 'parent':
          router.replace('/(tabs)/(parent)/dashboard');
          break;
        default:
          router.replace('/(tabs)/(admin)/dashboard');
      }
    }
  }, [isAuthenticated, isInitialized, segments, user, router, isMounted]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin-screens)" options={{ animation: 'slide_from_right' }} />
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
