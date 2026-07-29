/**
 * App Entry Point
 * Redirects based on auth state
 */

import { Redirect } from 'expo-router';

import { LoadingSpinner } from '@/components/ui';
import { useAuthStore } from '@/lib/auth-store';

export default function Index() {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  // Show loading while checking auth
  if (!isInitialized) {
    return <LoadingSpinner fullScreen />;
  }

  // Redirect based on auth state
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on role
  const role = user?.role;
  switch (role) {
    case 'admin':
      return <Redirect href="/(tabs)/(admin)/dashboard" />;
    case 'employee':
      return <Redirect href="/(tabs)/(employee)/dashboard" />;
    case 'parent':
    case 'student':
      return <Redirect href="/(tabs)/(parent)/dashboard" />;
    default:
      return <Redirect href="/(tabs)/(admin)/dashboard" />;
  }
}
