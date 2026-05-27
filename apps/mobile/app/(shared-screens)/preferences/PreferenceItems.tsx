/**
 * Preference Item Components
 * Extracted from OrgPreferencesScreen to reduce cognitive complexity
 */

import { Colors } from '@educard/shared';
import { RotateCcw, Check, X, HelpCircle, ChevronDown } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Keyboard } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { formatDropdownValue, getRadioLabels, isPositiveValue } from './_constants';
import { styles } from './_styles';

import type { OrganizationPreference } from '@/features/preferences';

export interface PreferenceItemProps {
  pref: OrganizationPreference;
  canManage: boolean;
  isPending: boolean;
  tooltipPref: string | null;
  setTooltipPref: (id: string | null) => void;
  onUpdate: (publicId: string, value: string | string[]) => void;
  onReset: (pref: OrganizationPreference) => void;
  editingTextPref: string | null;
  editTextValue: string;
  setEditingTextPref: (id: string | null) => void;
  setEditTextValue: (val: string) => void;
  setDropdownPref: (pref: OrganizationPreference | null) => void;
  setMultiSelectPref: (pref: OrganizationPreference | null) => void;
  setMultiSelectValues: (vals: string[]) => void;
}

// ── Tooltip badge ──
function TooltipBadge({
  pref,
  tooltipPref,
  setTooltipPref,
}: Readonly<Pick<PreferenceItemProps, 'pref' | 'tooltipPref' | 'setTooltipPref'>>) {
  if (!pref.description) return null;
  const isOpen = tooltipPref === pref.public_id;
  return (
    <>
      <TouchableOpacity
        onPress={() => setTooltipPref(isOpen ? null : pref.public_id)}
        hitSlop={10}
        style={styles.tooltipBadge}
      >
        <HelpCircle size={16} color="#7c3aed" />
      </TouchableOpacity>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.tooltip}>
          <View style={styles.tooltipArrow} />
          <Text style={styles.tooltipText}>{pref.description}</Text>
        </Animated.View>
      )}
    </>
  );
}

function ResetButton({
  pref,
  canManage,
  onReset,
}: Readonly<Pick<PreferenceItemProps, 'pref' | 'canManage' | 'onReset'>>) {
  if (!canManage) return null;
  return (
    <TouchableOpacity onPress={() => onReset(pref)} style={styles.resetLink}>
      <RotateCcw size={11} color={Colors.gray[400]} />
      <Text style={styles.resetLinkText}>Reset</Text>
    </TouchableOpacity>
  );
}

// ── Yes/No pill buttons ──
export function RadioPillsItem(props: Readonly<PreferenceItemProps>) {
  const { pref, canManage, isPending, onUpdate } = props;
  const labels = getRadioLabels(pref);
  if (!labels) return <TextInputItem {...props} />;
  const isPositive = isPositiveValue(pref);
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLabelRow}>
        <TooltipBadge
          pref={pref}
          tooltipPref={props.tooltipPref}
          setTooltipPref={props.setTooltipPref}
        />
        <Text style={styles.prefName}>{pref.display_name}</Text>
      </View>
      <View style={styles.pillRow}>
        <TouchableOpacity
          style={[
            styles.pill,
            isPositive && styles.pillActiveGreen,
            !canManage && styles.pillDisabled,
          ]}
          onPress={() => canManage && onUpdate(pref.public_id, labels.trueVal)}
          disabled={isPending || !canManage}
          activeOpacity={canManage ? 0.7 : 1}
        >
          <Text style={[styles.pillText, isPositive && styles.pillTextActive]}>
            {labels.trueLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.pill,
            !isPositive && styles.pillActiveRed,
            !canManage && styles.pillDisabled,
          ]}
          onPress={() => canManage && onUpdate(pref.public_id, labels.falseVal)}
          disabled={isPending || !canManage}
          activeOpacity={canManage ? 0.7 : 1}
        >
          <Text style={[styles.pillText, !isPositive && styles.pillTextActive]}>
            {labels.falseLabel}
          </Text>
        </TouchableOpacity>
      </View>
      <ResetButton pref={pref} canManage={canManage} onReset={props.onReset} />
    </View>
  );
}

// ── Choice dropdown ──
export function ChoiceItem(props: Readonly<PreferenceItemProps>) {
  const { pref, canManage, setDropdownPref } = props;
  const currentVal = String(pref.value);
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLabelRow}>
        <TooltipBadge
          pref={pref}
          tooltipPref={props.tooltipPref}
          setTooltipPref={props.setTooltipPref}
        />
        <Text style={styles.prefName}>{pref.display_name}</Text>
      </View>
      <TouchableOpacity
        style={[styles.dropdown, !canManage && { opacity: 0.6 }]}
        onPress={() => canManage && setDropdownPref(pref)}
        activeOpacity={canManage ? 0.7 : 1}
        disabled={!canManage}
      >
        <Text style={styles.dropdownText}>{formatDropdownValue(currentVal) || 'Select...'}</Text>
        <ChevronDown size={16} color={Colors.gray[500]} />
      </TouchableOpacity>
      <ResetButton pref={pref} canManage={canManage} onReset={props.onReset} />
    </View>
  );
}

// ── Multi-choice ──
export function MultiChoiceItem(props: Readonly<PreferenceItemProps>) {
  const { pref, canManage, setMultiSelectPref, setMultiSelectValues } = props;
  const values = Array.isArray(pref.value) ? pref.value : [];
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLabelRow}>
        <TooltipBadge
          pref={pref}
          tooltipPref={props.tooltipPref}
          setTooltipPref={props.setTooltipPref}
        />
        <Text style={styles.prefName}>{pref.display_name}</Text>
      </View>
      <TouchableOpacity
        style={[styles.dropdown, !canManage && { opacity: 0.6 }]}
        onPress={() => {
          if (!canManage) return;
          setMultiSelectPref(pref);
          setMultiSelectValues([...values]);
        }}
        activeOpacity={canManage ? 0.7 : 1}
        disabled={!canManage}
      >
        <Text style={styles.dropdownText} numberOfLines={1}>
          {values.length > 0 ? values.map(formatDropdownValue).join(', ') : 'Select...'}
        </Text>
        <ChevronDown size={16} color={Colors.gray[500]} />
      </TouchableOpacity>
      {values.length > 0 && (
        <View style={styles.chipRow}>
          {values.map((v) => (
            <View key={v} style={styles.selectedChip}>
              <Text style={styles.selectedChipText}>{formatDropdownValue(v)}</Text>
            </View>
          ))}
        </View>
      )}
      <ResetButton pref={pref} canManage={canManage} onReset={props.onReset} />
    </View>
  );
}

// ── Text / Number input ──
export function TextInputItem(props: Readonly<PreferenceItemProps>) {
  const {
    pref,
    canManage,
    editingTextPref,
    editTextValue,
    setEditingTextPref,
    setEditTextValue,
    onUpdate,
  } = props;
  const isEditing = editingTextPref === pref.public_id;
  const currentVal = String(pref.value);
  const isNumber = pref.field_type === 'number';
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLabelRow}>
        <TooltipBadge
          pref={pref}
          tooltipPref={props.tooltipPref}
          setTooltipPref={props.setTooltipPref}
        />
        <Text style={styles.prefName}>{pref.display_name}</Text>
      </View>
      {isEditing && canManage ? (
        <View style={styles.textEditRow}>
          <TextInput
            style={styles.textInput}
            value={editTextValue}
            onChangeText={setEditTextValue}
            autoFocus
            keyboardType={isNumber ? 'numeric' : 'default'}
            placeholder={`Enter ${pref.display_name.toLowerCase()}`}
            placeholderTextColor={Colors.gray[400]}
            onSubmitEditing={() => {
              onUpdate(pref.public_id, editTextValue);
              setEditingTextPref(null);
            }}
          />
          <TouchableOpacity
            style={styles.textSaveBtn}
            onPress={() => {
              onUpdate(pref.public_id, editTextValue);
              setEditingTextPref(null);
              Keyboard.dismiss();
            }}
          >
            <Check size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textCancelBtn}
            onPress={() => {
              setEditingTextPref(null);
              Keyboard.dismiss();
            }}
          >
            <X size={16} color={Colors.gray[500]} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.textValueBox, !canManage && { opacity: 0.6 }]}
          onPress={() => {
            if (!canManage) return;
            setEditingTextPref(pref.public_id);
            setEditTextValue(currentVal);
          }}
          activeOpacity={canManage ? 0.7 : 1}
          disabled={!canManage}
        >
          <Text style={[styles.textValue, !currentVal && styles.textPlaceholder]}>
            {currentVal || (canManage ? 'Tap to set value' : 'Not set')}
          </Text>
        </TouchableOpacity>
      )}
      <ResetButton pref={pref} canManage={canManage} onReset={props.onReset} />
    </View>
  );
}

// ── Choice pills for 2-option choices ──
export function ChoicePillsItem(props: Readonly<PreferenceItemProps>) {
  const { pref, canManage, isPending, onUpdate } = props;
  const vals = pref.applicable_values ?? [];
  const currentVal = String(pref.value);
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefLabelRow}>
        <TooltipBadge
          pref={pref}
          tooltipPref={props.tooltipPref}
          setTooltipPref={props.setTooltipPref}
        />
        <Text style={styles.prefName}>{pref.display_name}</Text>
      </View>
      <View style={styles.pillRow}>
        {vals.map((val) => {
          const isActive = val === currentVal;
          return (
            <TouchableOpacity
              key={val}
              style={[
                styles.pill,
                isActive && styles.pillActiveBlue,
                !canManage && styles.pillDisabled,
              ]}
              onPress={() => canManage && onUpdate(pref.public_id, val)}
              disabled={isPending || !canManage}
              activeOpacity={canManage ? 0.7 : 1}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{val}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <ResetButton pref={pref} canManage={canManage} onReset={props.onReset} />
    </View>
  );
}

/** Render a single preference based on type */
export function PreferenceItem(props: Readonly<PreferenceItemProps>) {
  const rendererMap = {
    radio: RadioPillsItem,
    choicePills: ChoicePillsItem,
    choice: ChoiceItem,
    multi: MultiChoiceItem,
    text: TextInputItem,
  } as const;
  const type = getPreferenceRendererType(props.pref);
  const Component = rendererMap[type];
  return <Component {...props} />;
}

function getPreferenceRendererType(
  pref: OrganizationPreference
): 'radio' | 'choicePills' | 'choice' | 'multi' | 'text' {
  if (pref.field_type === 'radio') return 'radio';
  if (pref.field_type === 'choice' && pref.applicable_values) {
    return pref.applicable_values.length === 2 ? 'choicePills' : 'choice';
  }
  if (pref.field_type === 'multi-choice') return 'multi';
  return 'text';
}
