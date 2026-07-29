/**
 * Teachers List Screen (Admin Tab)
 * Uses the reusable TeacherList component from features
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { TeacherList } from '@/features/teachers';

export default function TeachersScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/(admin)/management');
  }, [router]);

  return <TeacherList onBack={handleBack} />;
}
