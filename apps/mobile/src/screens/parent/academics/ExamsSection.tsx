/**
 * Student Exams — upcoming schedules and completed results.
 */

import { useNavigation } from '@react-navigation/native';
import { CalendarRange, ChevronRight, FileText } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { colors } from '@/constants/colors';
import { useExamSessions, type ExamSession } from '@/features/student-portal';
import type { SharedStackNavigation } from '@/navigation/types';

import { academicsStyles as s } from './academics-styles';
import { safeFormat } from './academics-utils';

export function ExamsSection() {
  const navigation = useNavigation<SharedStackNavigation>();
  const {
    data: sessions,
    isLoading,
    isRefetching,
    refetch,
  } = useExamSessions();

  const now = Date.now();
  const endTime = (session: ExamSession) =>
    new Date(session.end_date).getTime();
  const completed =
    sessions?.filter(session => {
      const t = endTime(session);
      return !Number.isNaN(t) && t < now;
    }) ?? [];
  const upcoming =
    sessions?.filter(session => {
      const t = endTime(session);
      return Number.isNaN(t) || t >= now;
    }) ?? [];

  const renderSessionCard = (
    session: ExamSession,
    mode: 'schedule' | 'results',
  ) => {
    const accent = mode === 'schedule' ? '#6366f1' : '#10b981';
    const pillBg = mode === 'schedule' ? '#e0e7ff' : '#d1fae5';
    const pillText = mode === 'schedule' ? '#4338ca' : '#047857';

    return (
      <TouchableOpacity
        key={session.public_id}
        onPress={() =>
          navigation.navigate('StudentExamDetail', {
            id: session.public_id,
            mode,
          })
        }
        style={[s.card, { borderLeftColor: accent }]}
        activeOpacity={0.7}
      >
        <View style={s.cardTopRow}>
          <View style={s.cardTitleWrap}>
            <Text style={s.cardTitle}>{session.name}</Text>
            <Text style={s.cardSubtitle}>{session.academic_year_name}</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </View>

        <View style={s.cardMetaRow}>
          <CalendarRange size={13} color="#94a3b8" />
          <Text style={s.cardMetaText}>
            {safeFormat(session.start_date, 'd MMM yyyy')} —{' '}
            {safeFormat(session.end_date, 'd MMM yyyy')}
          </Text>
        </View>

        <View style={[s.pill, { backgroundColor: pillBg }]}>
          <Text style={[s.pillText, { color: pillText }]}>
            {mode === 'schedule' ? 'View schedule' : 'View results'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>
        <View style={s.stateCard}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={s.stateTitle}>Loading exams</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      }
    >
      <Text style={s.sectionTitle}>Upcoming</Text>
      {upcoming.length > 0 ? (
        upcoming.map(session => renderSessionCard(session, 'schedule'))
      ) : (
        <View style={s.emptyInline}>
          <Text style={s.emptyInlineText}>No upcoming exams</Text>
        </View>
      )}

      <Text style={[s.sectionTitle, s.sectionTitleSpaced]}>Completed</Text>
      {completed.length > 0 ? (
        completed.map(session => renderSessionCard(session, 'results'))
      ) : (
        <View style={s.emptyInline}>
          <Text style={s.emptyInlineText}>No completed exams yet</Text>
        </View>
      )}

      {!sessions?.length && (
        <View style={[s.stateCard, s.stateCardSpaced]}>
          <FileText size={32} color="#94a3b8" />
          <Text style={s.stateTitle}>No exam sessions</Text>
          <Text style={s.stateMessage}>
            Exam schedules will appear here once your school publishes them.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
