/**
 * Student Homework — assignments and submission status for a selected date.
 */

import { useNavigation } from '@react-navigation/native';
import { format, addDays } from 'date-fns';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';

import { colors } from '@/constants/colors';
import {
  useStudentHomework,
  type HomeworkItem,
} from '@/features/student-portal';
import type { SharedStackNavigation } from '@/navigation/types';

import { academicsStyles as s } from './academics-styles';
import { safeFormat } from './academics-utils';

function getDefaultHomeworkDate(): Date {
  const now = new Date();
  return now.getHours() >= 16 ? addDays(now, 1) : addDays(now, -1);
}

interface StatusTone {
  label: string;
  bg: string;
  text: string;
  accent: string;
}

function getStatusTone(hw: HomeworkItem): StatusTone {
  if (hw.my_submission_status === 'not_submitted')
    return {
      label: 'Not Submitted',
      bg: '#fee2e2',
      text: '#b91c1c',
      accent: '#ef4444',
    };
  if (hw.is_overdue)
    return {
      label: 'Overdue',
      bg: '#fee2e2',
      text: '#b91c1c',
      accent: '#ef4444',
    };
  if (hw.my_submission_status === 'reviewed')
    return {
      label: 'Reviewed',
      bg: '#dbeafe',
      text: '#1d4ed8',
      accent: '#3b82f6',
    };
  if (hw.my_submission_status === 'submitted')
    return {
      label: 'Submitted',
      bg: '#dcfce7',
      text: '#15803d',
      accent: '#22c55e',
    };
  return {
    label: 'Pending',
    bg: '#fef3c7',
    text: '#b45309',
    accent: '#f59e0b',
  };
}

export function HomeworkSection() {
  const navigation = useNavigation<SharedStackNavigation>();
  const [selectedDate, setSelectedDate] = useState(getDefaultHomeworkDate);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const {
    data: homework,
    isLoading,
    isRefetching,
    refetch,
  } = useStudentHomework(dateStr);

  const goDay = (offset: number) =>
    setSelectedDate(prev => addDays(prev, offset));

  const dateLabel = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return format(selectedDate, 'EEE, d MMM');
  })();

  const renderHomeworkList = () => {
    if (isLoading) {
      return (
        <View style={s.stateCard}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={s.stateTitle}>Loading homework</Text>
        </View>
      );
    }

    if (!homework || homework.length === 0) {
      return (
        <View style={s.stateCard}>
          <BookOpen size={32} color="#94a3b8" />
          <Text style={s.stateTitle}>No homework assigned</Text>
          <Text style={s.stateMessage}>
            Nothing was assigned for {format(selectedDate, 'EEEE, d MMMM yyyy')}
            .
          </Text>
        </View>
      );
    }

    return homework.map((hw: HomeworkItem) => {
      const tone = getStatusTone(hw);
      return (
        <TouchableOpacity
          key={hw.public_id}
          onPress={() =>
            navigation.navigate('StudentHomeworkDetail', {
              id: hw.public_id,
              date: dateStr,
            })
          }
          style={[s.card, { borderLeftColor: tone.accent }]}
          activeOpacity={0.7}
        >
          <View style={s.cardTopRow}>
            <View style={s.cardTitleWrap}>
              <Text style={s.cardTitle}>{hw.title}</Text>
              <Text style={s.cardSubtitle}>
                {hw.subject_name}
                {hw.chapter ? ` • ${hw.chapter}` : ''}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: tone.bg }]}>
              <Text style={[s.badgeText, { color: tone.text }]}>
                {tone.label}
              </Text>
            </View>
          </View>

          <View style={s.cardMetaRow}>
            <Clock size={13} color="#94a3b8" />
            <Text style={s.cardMetaText}>
              Due {safeFormat(hw.due_datetime, 'd MMM, h:mm a')}
            </Text>
          </View>
          <View style={s.cardMetaRow}>
            <User size={13} color="#94a3b8" />
            <Text style={s.cardMetaText}>{hw.assigned_by_name}</Text>
          </View>

          {hw.priority === 'high' && (
            <View style={s.priorityRow}>
              <AlertTriangle size={13} color="#dc2626" />
              <Text style={s.priorityText}>High priority</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    });
  };

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
      <View style={s.dateBar}>
        <TouchableOpacity
          onPress={() => goDay(-1)}
          style={s.dateArrow}
          accessibilityLabel="Previous day"
        >
          <ChevronLeft size={20} color="#475569" />
        </TouchableOpacity>
        <View style={s.dateCenter}>
          <Text style={s.dateLabel}>{dateLabel}</Text>
          <Text style={s.dateValue}>{format(selectedDate, 'd MMMM yyyy')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => goDay(1)}
          style={s.dateArrow}
          accessibilityLabel="Next day"
        >
          <ChevronRight size={20} color="#475569" />
        </TouchableOpacity>
      </View>

      {renderHomeworkList()}
    </ScrollView>
  );
}
