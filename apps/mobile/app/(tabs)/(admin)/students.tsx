/**
 * Students List Screen (Admin Tab)
 * Uses the reusable StudentList component from features
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { StudentList } from '@/features/students';

export default function StudentsScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/(admin)/management');
  }, [router]);

  return <StudentList onBack={handleBack} />;
}
