/**
 * SlotCardEditor - a single editable period/break slot card in the slots editor.
 */

import {
  BREAK_TYPES,
  SLOT_TYPE_LABELS,
  type BulkSlotItem,
} from '@educard/shared';
import { Trash2, Clock, BookOpen } from 'lucide-react-native';
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

import {
  SLOT_COLORS,
  SLOT_TYPE_OPTIONS,
  formatTimeDisplay,
} from './slots-editor-utils';
import { st } from './slots-editor-styles';

interface SlotCardEditorProps {
  slot: BulkSlotItem;
  showTypePicker: boolean;
  onToggleTypePicker: () => void;
  onCloseTypePicker: () => void;
  onUpdate: (field: keyof BulkSlotItem, value: string | number) => void;
  onRemove: () => void;
}

export function SlotCardEditor({
  slot,
  showTypePicker,
  onToggleTypePicker,
  onCloseTypePicker,
  onUpdate,
  onRemove,
}: Readonly<SlotCardEditorProps>) {
  const colors = SLOT_COLORS[slot.slot_type] || SLOT_COLORS.period;
  const isBreak = BREAK_TYPES.has(slot.slot_type);

  return (
    <View
      style={[
        st.slotCard,
        { backgroundColor: colors.bg, borderLeftColor: colors.border },
      ]}
    >
      {/* Row 1: Type + Label + Delete */}
      <View style={st.slotTopRow}>
        <TouchableOpacity
          style={[st.typeBadge, { backgroundColor: colors.border + '40' }]}
          onPress={onToggleTypePicker}
        >
          {isBreak ? (
            <Clock size={12} color={colors.text} />
          ) : (
            <BookOpen size={12} color={colors.text} />
          )}
          <Text style={[st.typeText, { color: colors.text }]}>
            {SLOT_TYPE_LABELS[slot.slot_type] || slot.slot_type}
          </Text>
        </TouchableOpacity>
        <TextInput
          style={[st.labelInput, { color: colors.text }]}
          value={slot.label}
          onChangeText={v => onUpdate('label', v)}
          placeholder="Label"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={st.deleteBtn} onPress={onRemove}>
          <Trash2 size={14} color="#dc2626" />
        </TouchableOpacity>
      </View>

      {/* Type Picker (shown inline) */}
      {showTypePicker && (
        <View style={st.typePicker}>
          {SLOT_TYPE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[
                st.typeOption,
                slot.slot_type === opt.value && st.typeOptionActive,
              ]}
              onPress={() => {
                onUpdate('slot_type', opt.value);
                if (BREAK_TYPES.has(opt.value)) {
                  onUpdate('label', opt.label);
                }
                onCloseTypePicker();
              }}
            >
              <Text
                style={[
                  st.typeOptionText,
                  slot.slot_type === opt.value && st.typeOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Row 2: Times */}
      <View style={st.timeRow}>
        <View style={st.timeField}>
          <Text style={st.timeLabel}>Start</Text>
          <TextInput
            style={st.timeInput}
            value={slot.start_time}
            onChangeText={v => onUpdate('start_time', v)}
            placeholder="09:00"
            placeholderTextColor="#cbd5e1"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
        <Text style={st.timeArrow}>→</Text>
        <View style={st.timeField}>
          <Text style={st.timeLabel}>End</Text>
          <TextInput
            style={st.timeInput}
            value={slot.end_time}
            onChangeText={v => onUpdate('end_time', v)}
            placeholder="10:00"
            placeholderTextColor="#cbd5e1"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
        {!!slot.start_time && !!slot.end_time && (
          <Text style={[st.timePreview, { color: colors.text }]}>
            {formatTimeDisplay(slot.start_time)} –{' '}
            {formatTimeDisplay(slot.end_time)}
          </Text>
        )}
      </View>
    </View>
  );
}
