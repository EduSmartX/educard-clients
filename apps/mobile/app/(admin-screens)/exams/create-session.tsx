/**
 * Create Exam Session Screen
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormInput, FormDropdown, FormDatePicker } from '@/components/forms';
import { useCreateExamSession } from '@/features/exams';
import { EXAM_SESSION_TYPE_LABELS, type ExamSessionType } from '@/features/exams/types';
import { headerStyles, layoutStyles, bodyStyles, cardStyles, buttonStyles } from '@/styles';
import { validateDateRange } from '@/utils/validation';

const adminGradient = getRoleGradient('admin');

const SESSION_TYPE_OPTIONS = Object.entries(EXAM_SESSION_TYPE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export default function CreateExamSessionScreen() {
  const router = useRouter();
  const createSession = useCreateExamSession();

  const [name, setName] = useState('');
  const [sessionType, setSessionType] = useState<string>('unit_test');
  const [academicYear, setAcademicYear] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Session name is required');
      return;
    }
    if (!sessionType) {
      Alert.alert('Error', 'Session type is required');
      return;
    }
    if (!academicYear.trim()) {
      Alert.alert('Error', 'Academic year is required (e.g., 2024-2025)');
      return;
    }
    const dateErr = validateDateRange(startDate, endDate, 'Start date', 'End date');
    if (dateErr) {
      Alert.alert('Error', dateErr);
      return;
    }

    try {
      await createSession.mutateAsync({
        name: name.trim(),
        session_type: sessionType as ExamSessionType,
        academic_year: academicYear.trim(),
        description: description.trim() || undefined,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', extractApiError(err));
    }
  };

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>New Exam Session</Text>
              <Text style={headerStyles.subtitle}>Create a new exam session</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={bodyStyles.scroll} contentContainerStyle={bodyStyles.content}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={cardStyles.cardLarge}>
              <FormInput
                label="Session Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Unit Test 1 - 2024"
                required
              />
              <FormDropdown
                label="Session Type"
                value={sessionType}
                onChange={setSessionType}
                options={SESSION_TYPE_OPTIONS}
                placeholder="Select type"
                required
              />
              <FormInput
                label="Academic Year"
                value={academicYear}
                onChangeText={setAcademicYear}
                placeholder="e.g., 2024-2025"
                required
              />
              <FormInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                multiline
              />
              <FormDatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date (optional)"
              />
              <FormDatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date (optional)"
              />
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[buttonStyles.primary, createSession.isPending && buttonStyles.disabled]}
            onPress={handleSubmit}
            disabled={createSession.isPending}
          >
            {createSession.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={buttonStyles.primaryText}>Create Session</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// All styles now use shared imports from @/styles
