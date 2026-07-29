/**
 * View Subject Screen
 */

import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DetailScreenBase, DetailSection, DetailRow } from '@/components/screens/DetailScreenBase';
import { useSubjectDetail } from '@/features/subjects';

export default function ViewSubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading, isError } = useSubjectDetail(id || '');

  return (
    <DetailScreenBase
      title="Subject Details"
      subtitle={subject?.name || '...'}
      isLoading={isLoading}
      isError={isError}
      hasData={!!subject}
      errorMessage="Failed to load subject details."
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Subject Info" icon="📚">
          <DetailRow label="Name" value={subject?.name} />
          <DetailRow label="Code" value={subject?.code} />
        </DetailSection>
      </Animated.View>
    </DetailScreenBase>
  );
}
