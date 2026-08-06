/**
 * Student Fee Edit Screen (Mobile)
 * Lets admin edit discount/referral fields and optional fee-component selections.
 */

import type { StudentFeeComponentItem } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Lock, Save, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  RefreshControl,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { ErrorState, LoadingState } from '@/components/common/ListStates';
import { SubmitButton } from '@/components/common/SubmitButton';
import { FormInput } from '@/components/forms/FormInput';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { extractApiError } from '@/utils/api-error';
import { showToast } from '@/utils/toast';

import {
  useStudentFee,
  useUpdateStudentFee,
  useUpdateStudentFeeComponents,
} from '../hooks';

type ComponentSelection = {
  is_selected: boolean;
  admin_note: string;
};

export default function StudentFeeEditScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'FeeStudentEdit'>>();
  const { id } = route.params;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const {
    data: fee,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useStudentFee(id ?? '');
  const updateStudentFee = useUpdateStudentFee();
  const updateComponents = useUpdateStudentFeeComponents();

  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [discountReason, setDiscountReason] = useState('');
  const [referralName, setReferralName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [componentSelections, setComponentSelections] = useState<
    Record<string, ComponentSelection>
  >({});

  useEffect(() => {
    if (!fee) return;

    setDiscountPercentage(String(fee.discount_percentage ?? 0));
    setDiscountReason(fee.discount_reason ?? '');
    setReferralName(fee.referral_name ?? '');
    setReferralCode(fee.referral_code ?? '');

    const nextSelections: Record<string, ComponentSelection> = {};
    (fee.components ?? []).forEach((component: StudentFeeComponentItem) => {
      nextSelections[component.fee_component_public_id] = {
        is_selected: component.is_selected,
        admin_note: component.admin_note ?? '',
      };
    });
    setComponentSelections(nextSelections);
  }, [fee]);

  const selectedOptionalCount = useMemo(
    () =>
      (fee?.components ?? []).filter(component => {
        if (component.component_type === 'mandatory') return true;
        return (
          componentSelections[component.fee_component_public_id]?.is_selected ??
          component.is_selected
        );
      }).length,
    [componentSelections, fee?.components],
  );

  const validateDiscount = () => {
    if (!discountPercentage.trim()) {
      setDiscountError('');
      return true;
    }
    const parsed = Number(discountPercentage);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setDiscountError('Discount must be between 0 and 100');
      return false;
    }
    setDiscountError('');
    return true;
  };

  const handleSaveDiscount = () => {
    if (!id || !validateDiscount()) return;
    updateStudentFee.mutate(
      {
        id,
        data: {
          discount_percentage: discountPercentage.trim()
            ? Number(discountPercentage)
            : 0,
          discount_reason: discountReason.trim() || '',
          referral_name: referralName.trim() || '',
          referral_code: referralCode.trim() || '',
        },
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Success',
            'Discount & referral info updated successfully.',
          );
        },
        onError: err => {
          Alert.alert('Error', extractApiError(err));
        },
      },
    );
  };

  const handleSaveComponents = () => {
    if (!id || !fee?.components?.length) return;

    const components = fee.components.map(
      (component: StudentFeeComponentItem) => ({
        component_public_id: component.fee_component_public_id,
        is_selected:
          componentSelections[component.fee_component_public_id]?.is_selected ??
          component.is_selected,
        admin_note:
          componentSelections[component.fee_component_public_id]?.admin_note ??
          '',
      }),
    );

    updateComponents.mutate(
      { id, data: { components } },
      {
        onSuccess: () => {
          showToast('success', 'Fee components updated successfully');
          navigation.navigate('FeeStudentDetail', { id });
        },
      },
    );
  };

  if (isLoading)
    return <LoadingState color="#7c3aed" message="Loading edit form..." />;
  if (isError || !fee) {
    return (
      <ErrorState
        message="Failed to load student fee"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7c3aed', '#a78bfa']} style={styles.header}>
        <Animated.View entering={FadeIn} style={styles.circle1} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Edit Fee — {fee.student_name}
            </Text>
            <Text style={styles.headerSub}>{fee.class_name}</Text>
          </View>
          <Settings size={20} color="rgba(255,255,255,0.85)" />
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#7c3aed"
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
          <Text style={styles.sectionTitle}>Discount & Referral</Text>
          <FormInput
            label="Discount Percentage (%)"
            value={discountPercentage}
            onChangeText={setDiscountPercentage}
            onBlurValidate={validateDiscount}
            placeholder="0"
            keyboardType="decimal-pad"
            error={discountError}
          />

          <FormInput
            label="Discount Reason"
            value={discountReason}
            onChangeText={setDiscountReason}
            placeholder="e.g. Sibling discount"
          />

          <FormInput
            label="Referral Name"
            value={referralName}
            onChangeText={setReferralName}
            placeholder="Referrer name"
          />

          <FormInput
            label="Referral Code"
            value={referralCode}
            onChangeText={setReferralCode}
            placeholder="e.g. REF2026"
          />

          <SubmitButton
            label="Save Discount & Referral"
            onPress={handleSaveDiscount}
            isLoading={updateStudentFee.isPending}
            icon={Save}
            color="#7c3aed"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150)} style={styles.card}>
          <Text style={styles.sectionTitle}>Fee Components</Text>
          <Text style={styles.sectionHint}>
            Selected: {selectedOptionalCount} / {fee.components?.length ?? 0}
          </Text>

          {(fee.components ?? []).map((component: StudentFeeComponentItem) => {
            const isMandatory = component.component_type === 'mandatory';
            const selection =
              componentSelections[component.fee_component_public_id];
            const isSelected = selection?.is_selected ?? component.is_selected;
            const adminNote = selection?.admin_note ?? '';

            return (
              <View key={component.public_id} style={styles.componentCard}>
                <View style={styles.componentTopRow}>
                  <View style={styles.flex1}>
                    <Text style={styles.componentName}>{component.name}</Text>
                    <Text style={styles.componentMeta}>
                      {isMandatory ? 'Mandatory' : 'Optional'} • ₹
                      {Number(component.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {isMandatory ? (
                    <View style={styles.mandatoryPill}>
                      <Lock size={12} color="#475569" />
                      <Text style={styles.mandatoryText}>Locked</Text>
                    </View>
                  ) : (
                    <Switch
                      value={isSelected}
                      onValueChange={value => {
                        setComponentSelections(prev => ({
                          ...prev,
                          [component.fee_component_public_id]: {
                            ...prev[component.fee_component_public_id],
                            is_selected: value,
                          },
                        }));
                      }}
                      trackColor={{ false: '#cbd5e1', true: '#a78bfa' }}
                      thumbColor={isSelected ? '#7c3aed' : '#f8fafc'}
                    />
                  )}
                </View>

                {!isMandatory && (
                  <FormInput
                    label="Admin Note (optional)"
                    value={adminNote}
                    onChangeText={value => {
                      setComponentSelections(prev => ({
                        ...prev,
                        [component.fee_component_public_id]: {
                          ...prev[component.fee_component_public_id],
                          admin_note: value,
                        },
                      }));
                    }}
                    placeholder="Reason for selection change"
                  />
                )}
              </View>
            );
          })}

          <SubmitButton
            label="Save Component Selection"
            onPress={handleSaveComponents}
            isLoading={updateComponents.isPending}
            icon={Save}
            color="#059669"
          />
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.82)' },

  scroll: { padding: 14, gap: 12, paddingBottom: 36 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 10,
  },
  sectionHint: { fontSize: 12, color: '#64748b', marginBottom: 10 },

  componentCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fcfcff',
  },
  componentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  componentName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  componentMeta: { marginTop: 2, fontSize: 12, color: '#64748b' },
  mandatoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mandatoryText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  headerTextWrap: { flex: 1, marginLeft: 10 },
  flex1: { flex: 1 },
});
