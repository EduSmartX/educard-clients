/**
 * Subjects List Screen (Admin Tab)
 * Uses the reusable SubjectList component from features
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { SubjectList } from '@/features/subjects';

export default function SubjectsScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/(admin)/management');
  }, [router]);

  return <SubjectList onBack={handleBack} />;
}
