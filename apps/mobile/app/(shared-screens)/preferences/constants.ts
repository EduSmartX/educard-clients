import { Colors } from '@educard/shared';
import { Settings, Clock, Bell, Shield, Users, BookOpen } from 'lucide-react-native';
import React from 'react';

import type { OrganizationPreference } from '@/features/preferences';

// Category icons and colors
type IconComponent = React.ComponentType<{ size: number; color: string }>;
export const CATEGORY_CONFIG: Record<string, { icon: IconComponent; bg: string; color: string }> = {
  attendance: { icon: Clock, bg: '#dbeafe', color: '#2563eb' },
  leave: { icon: BookOpen, bg: '#dcfce7', color: '#16a34a' },
  notification: { icon: Bell, bg: '#fef3c7', color: '#d97706' },
  email: { icon: Bell, bg: '#fef3c7', color: '#d97706' },
  security: { icon: Shield, bg: '#fce7f3', color: '#db2777' },
  general: { icon: Settings, bg: '#ede9fe', color: '#7c3aed' },
  organization: { icon: Users, bg: '#e0f2fe', color: '#0284c7' },
  student: { icon: Users, bg: '#e0f2fe', color: '#0284c7' },
};

export const getCategoryConfig = (category: string) => {
  const key = category.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_CONFIG.general;
};

/**
 * Format underscore-separated values to readable text
 * e.g., "class_teacher_only" → "Class Teacher Only"
 */
export const formatDropdownValue = (value: string | null | undefined): string => {
  if (!value || typeof value !== 'string') return String(value ?? '');
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Determine the display labels for a radio/boolean-like preference.
 */
export const getRadioLabels = (
  pref: OrganizationPreference
): { falseLabel: string; trueLabel: string; falseVal: string; trueVal: string } | null => {
  if (pref.field_type === 'radio') {
    if (pref.applicable_values?.length === 2) {
      const vals = pref.applicable_values;
      const upper0 = vals[0].toUpperCase();
      const upper1 = vals[1].toUpperCase();
      if (upper0 === 'TRUE' || upper0 === 'YES' || upper0 === 'PRESENT') {
        return { trueLabel: vals[0], falseLabel: vals[1], trueVal: vals[0], falseVal: vals[1] };
      }
      if (upper1 === 'TRUE' || upper1 === 'YES' || upper1 === 'PRESENT') {
        return { trueLabel: vals[1], falseLabel: vals[0], trueVal: vals[1], falseVal: vals[0] };
      }
      return { trueLabel: vals[0], falseLabel: vals[1], trueVal: vals[0], falseVal: vals[1] };
    }
    return { trueLabel: 'Yes', falseLabel: 'No', trueVal: 'TRUE', falseVal: 'FALSE' };
  }
  return null;
};

/** Check if current value is the "true" / positive option */
export const isPositiveValue = (pref: OrganizationPreference): boolean => {
  const val = String(pref.value).toUpperCase();
  return val === 'TRUE' || val === 'YES' || val === 'PRESENT';
};

export const formatCategory = (cat: string) =>
  cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
