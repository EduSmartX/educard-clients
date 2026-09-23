import { Colors } from '@educard/shared';
import { CheckCircle2 } from 'lucide-react-native';
import React from 'react';
import { View, Text } from 'react-native';

import { styles } from './signup-styles';

// Mobile merges email entry and OTP verification, so it has one step fewer than web.
const STEP_LABELS = ['Verify', 'Details', 'Finish'] as const;

export const SIGNUP_STEP_HEADINGS = [
  'Email Verification',
  'Organization Details',
  'Administrator Setup',
] as const;

export function ProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.progressContainer}>
      {STEP_LABELS.map((title, idx) => {
        const step = idx + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        return (
          <View key={step} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCompleted,
                  isCurrent && styles.stepCurrent,
                ]}
              >
                {isCompleted ? (
                  <CheckCircle2 size={16} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      (isCompleted || isCurrent) && styles.stepNumberActive,
                    ]}
                  >
                    {step}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}
              >
                {title}
              </Text>
            </View>
            {idx < STEP_LABELS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineCompleted,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true;
  const digits = phone.replace(/[\s\-()+"]/g, '');
  return /^[6-9]\d{9}$/.test(digits);
};

export function getIconColor(hasError: boolean, isFocused: boolean): string {
  if (hasError) return '#ef4444';
  if (isFocused) return Colors.primary[500];
  return Colors.gray[400];
}
