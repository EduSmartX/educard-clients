/**
 * Working Day Policy Card Component
 * Extracted to reduce cognitive complexity of OrgPreferencesScreen
 */

import { Colors } from '@educard/shared';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { SaturdayOffPattern, WorkingDayPolicy } from '@/features/holidays/api/holidays-api';

import { styles } from './_styles';
import { SaturdayPatternModal } from './PreferenceModals';

const SATURDAY_OPTIONS: { label: string; value: SaturdayOffPattern }[] = [
  { label: 'No Saturdays Off', value: 'NONE' },
  { label: '2nd Saturday Off', value: 'SECOND_ONLY' },
  { label: '2nd & 4th Saturday Off', value: 'SECOND_AND_FOURTH' },
  { label: 'All Saturdays Off', value: 'ALL' },
];

const getSaturdayLabel = (val: SaturdayOffPattern) =>
  SATURDAY_OPTIONS.find((o) => o.value === val)?.label ?? val;

interface WorkingDayPolicyCardProps {
  currentPolicy: WorkingDayPolicy | null;
  canManage: boolean;
  isPending: boolean;
  onUpdate: (field: string, value: boolean | SaturdayOffPattern) => void | Promise<void>;
  animationDelay: number;
}

export function WorkingDayPolicyCard({
  currentPolicy,
  canManage,
  isPending,
  onUpdate,
  animationDelay,
}: Readonly<WorkingDayPolicyCardProps>) {
  const [wdpExpanded, setWdpExpanded] = useState(false);
  const [saturdayDropdownOpen, setSaturdayDropdownOpen] = useState(false);

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(animationDelay).duration(400)}
        style={styles.categoryCard}
      >
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => setWdpExpanded(!wdpExpanded)}
          activeOpacity={0.7}
        >
          <View style={[styles.catIconCircle, { backgroundColor: '#fef3c7' }]}>
            <Calendar size={18} color="#d97706" />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catTitle}>Working Day Policy</Text>
            <Text style={styles.catCount}>Sunday & Saturday rules</Text>
          </View>
          {wdpExpanded ? (
            <ChevronUp size={20} color={Colors.gray[400]} />
          ) : (
            <ChevronDown size={20} color={Colors.gray[400]} />
          )}
        </TouchableOpacity>

        {wdpExpanded && (
          <View style={styles.prefList}>
            {/* Sunday Off */}
            <View style={styles.prefRow}>
              <View style={styles.prefLabelRow}>
                <Text style={styles.prefName}>Sunday Off</Text>
              </View>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    currentPolicy?.sunday_off !== false && styles.pillActiveGreen,
                    !canManage && styles.pillDisabled,
                  ]}
                  onPress={() => {
                    if (canManage) void onUpdate('sunday_off', true);
                  }}
                  disabled={isPending || !canManage}
                  activeOpacity={canManage ? 0.7 : 1}
                >
                  <Text
                    style={[
                      styles.pillText,
                      currentPolicy?.sunday_off !== false && styles.pillTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pill,
                    currentPolicy?.sunday_off === false && styles.pillActiveRed,
                    !canManage && styles.pillDisabled,
                  ]}
                  onPress={() => {
                    if (canManage) void onUpdate('sunday_off', false);
                  }}
                  disabled={isPending || !canManage}
                  activeOpacity={canManage ? 0.7 : 1}
                >
                  <Text
                    style={[
                      styles.pillText,
                      currentPolicy?.sunday_off === false && styles.pillTextActive,
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Saturday Off Pattern */}
            <View style={styles.prefRow}>
              <View style={styles.prefLabelRow}>
                <Text style={styles.prefName}>Saturday Off Pattern</Text>
              </View>
              <TouchableOpacity
                style={[styles.dropdown, !canManage && { opacity: 0.6 }]}
                onPress={() => canManage && setSaturdayDropdownOpen(true)}
                activeOpacity={canManage ? 0.7 : 1}
                disabled={!canManage}
              >
                <Text style={styles.dropdownText}>
                  {currentPolicy
                    ? getSaturdayLabel(currentPolicy.saturday_off_pattern)
                    : 'Select...'}
                </Text>
                <ChevronDown size={16} color={Colors.gray[500]} />
              </TouchableOpacity>
            </View>

            {currentPolicy?.effective_from && (
              <>
                <View style={styles.divider} />
                <View style={styles.prefRow}>
                  <View style={styles.prefLabelRow}>
                    <Text style={styles.prefName}>Effective From</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: Colors.gray[600] }}>
                    {currentPolicy.effective_from}
                  </Text>
                </View>
              </>
            )}

            {!currentPolicy && (
              <View style={{ padding: 12, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: Colors.gray[400], textAlign: 'center' }}>
                  No policy set yet. Choose options above to create one.
                </Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      <SaturdayPatternModal
        visible={saturdayDropdownOpen}
        onClose={() => setSaturdayDropdownOpen(false)}
        options={SATURDAY_OPTIONS}
        currentPattern={currentPolicy?.saturday_off_pattern}
        onSelect={(value) => void onUpdate('saturday_off_pattern', value)}
      />
    </>
  );
}
