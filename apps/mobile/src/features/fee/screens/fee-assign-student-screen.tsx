/**
 * Assign Fee Structure to Stu  const studentOptions = (studentsData?.students ?? []).map((s) => ({
    value: s.public_id,
    label: `${s.first_name} ${s.last_name}`,
  })); Screen
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAndroidBack } from '@/hooks';
import { ChevronLeft, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { FormDropdown } from '@/components/forms/FormDropdown';
import { ClassFilterDropdown } from '@/components/filters';
import { FormInput } from '@/components/forms/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { useFeeStructures, useCreateStudentFee, useEligibleStudents } from '../hooks';
import { extractApiError } from '@/utils/api-error';
import { showToast } from '@/utils/toast';

export default function FeeAssignStudentScreen() {
  const router = useRouter();
  useAndroidBack('/(tabs)/(admin)/fee-student-fees');
  const params = useLocalSearchParams<{
    class_id?: string;
    class_public_id?: string;
    student_id?: string;
    structure_id?: string;
  }>();

  const [classId, setClassId] = useState(params.class_id ?? params.class_public_id ?? '');
  const [studentId, setStudentId] = useState(params.student_id ?? '');
  const [structureId, setStructureId] = useState(params.structure_id ?? '');
  const [discountPct, setDiscountPct] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data
  const { data: eligibleStudents, isLoading: studentsLoading } = useEligibleStudents(classId);
  const { data: structuresData } = useFeeStructures({
    is_active: true,
    page_size: 200,
    class_public_id: classId || undefined,
  });
  const { mutate: assignFee, isPending } = useCreateStudentFee();

  const studentOptions = (eligibleStudents ?? []).map((s) => ({
    value: s.public_id,
    label: s.roll_number ? `${s.full_name} (${s.roll_number})` : s.full_name,
  }));

  const structureOptions = (structuresData?.items ?? []).map((s) => ({
    value: s.public_id,
    label: `${s.name} (${s.academic_year})`,
  }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!classId) e.classId = 'Class is required';
    if (!studentId) e.studentId = 'Student is required';
    if (!structureId) e.structureId = 'Fee structure is required';
    if (discountPct) {
      const pct = parseFloat(discountPct);
      if (isNaN(pct) || pct < 0 || pct > 100) e.discountPct = 'Discount must be between 0 and 100';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleClassChange = (value: string) => {
    setClassId(value);
    setStudentId('');
    setStructureId('');
    setErrors((prev) => ({
      ...prev,
      classId: '',
      studentId: '',
      structureId: '',
    }));
  };

  const handleStudentChange = (value: string) => {
    setStudentId(value);
    setErrors((prev) => ({ ...prev, studentId: '' }));
  };

  const handleStructureChange = (value: string) => {
    setStructureId(value);
    setErrors((prev) => ({ ...prev, structureId: '' }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    assignFee(
      {
        student_public_id: studentId,
        fee_structure_public_id: structureId,
        discount_percentage: discountPct ? parseFloat(discountPct) : undefined,
        discount_reason: discountReason || undefined,
      },
      {
        onSuccess: () => {
          showToast('success', 'Fee assigned successfully');
          router.push('/(tabs)/(admin)/fee-student-fees' as any);
        },
        onError: (err) => {
          Alert.alert('Error', extractApiError(err));
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0891b2', '#22d3ee']} style={styles.header}>
        <Animated.View entering={FadeIn} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/(tabs)/(admin)/fee-student-fees')}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Assign Fee Structure</Text>
            <Text style={styles.headerSub}>Link a fee structure to a student</Text>
          </View>
          <UserPlus size={24} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <Text style={styles.sectionTitle}>Class, Student & Structure</Text>

          <ClassFilterDropdown
            label="Class *"
            value={classId}
            onChange={handleClassChange}
            error={errors.classId}
            placeholder="Select class..."
            includeAllOption={false}
            required
          />

          <FormDropdown
            label="Student *"
            options={studentOptions}
            value={studentId}
            onChange={handleStudentChange}
            error={errors.studentId}
            placeholder={classId ? 'Select student...' : 'Select class first'}
            disabled={!classId}
            loading={studentsLoading}
            searchable
          />

          <FormDropdown
            label="Fee Structure *"
            options={structureOptions}
            value={structureId}
            onChange={handleStructureChange}
            error={errors.structureId}
            placeholder={classId ? 'Select fee structure...' : 'Select class first'}
            disabled={!classId}
            searchable
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.card}>
          <Text style={styles.sectionTitle}>Discount (Optional)</Text>

          <FormInput
            label="Discount Percentage (%)"
            value={discountPct}
            onChangeText={setDiscountPct}
            placeholder="0"
            keyboardType="decimal-pad"
            error={errors.discountPct}
          />

          {discountPct ? (
            <FormInput
              label="Discount Reason"
              value={discountReason}
              onChangeText={setDiscountReason}
              placeholder="e.g. Sibling discount, merit scholarship..."
              multiline
              numberOfLines={2}
            />
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.submitRow}>
          <SubmitButton
            label="Assign Fee Structure"
            onPress={handleSubmit}
            isLoading={isPending}
            variant="primary"
          />
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' },
  circle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  scroll: { padding: 14, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  submitRow: { marginTop: 8 },
});
