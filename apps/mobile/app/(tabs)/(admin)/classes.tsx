/**
 * Classes List Screen (Admin Tab)
 * Uses the reusable ClassList component from features
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { ClassList } from '@/features/classes';

export default function ClassesScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/(admin)/management');
  }, [router]);

  return <ClassList onBack={handleBack} />;
}
