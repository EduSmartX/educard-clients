/**
 * Subject Detail Screen — /(shared-screens)/subjects/[id]
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DetailScreenShell, DetailSection, DetailRow } from '@/components/detail';
import { useSubjectDetail } from '@/features/subjects';

export default function SubjectDetailScreen() {
  const { id, is_deleted } = useLocalSearchParams<{ id: string; is_deleted?: string }>();
  const router = useRouter();
  const isDeleted = is_deleted === 'true';
  const { data: subject, isLoading, isError } = useSubjectDetail(id ?? '', isDeleted);

  const s = subject;
  const subjectName = s?.subject_info?.name ?? s?.name ?? '...';
  const subjectCode = s?.subject_info?.code ?? s?.code;
  const className = s?.class_info?.class_master_name ?? s?.class_info?.name;

  return (
    <DetailScreenShell
      title="Subject Details"
      subtitle={subjectName}
      isLoading={isLoading}
      isError={isError || !subject}
      onBack={() => router.back()}
    >
      <Animated.View entering={FadeInDown.delay(100)}>
        <DetailSection title="Subject Info" icon="📚">
          <DetailRow label="Name" value={s?.subject_info?.name ?? s?.name} />
          <DetailRow label="Code" value={subjectCode} />
          <DetailRow label="Description" value={s?.description} />
        </DetailSection>
      </Animated.View>

      {s?.class_info && (
        <Animated.View entering={FadeInDown.delay(200)}>
          <DetailSection title="Class" icon="🏫">
            <DetailRow label="Class" value={className} />
            <DetailRow label="Section" value={s.class_info.name} />
          </DetailSection>
        </Animated.View>
      )}

      {s?.teacher_info && (
        <Animated.View entering={FadeInDown.delay(300)}>
          <DetailSection title="Teacher" icon="👨‍🏫">
            <DetailRow label="Name" value={s.teacher_info.full_name} />
            <DetailRow label="Email" value={s.teacher_info.email} />
          </DetailSection>
        </Animated.View>
      )}
    </DetailScreenShell>
  );
}
