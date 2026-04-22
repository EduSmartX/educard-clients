/**
 * EntityActions — Shared View / Edit / Delete icon buttons rendered as a bottom bar
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, Edit3, Trash2 } from 'lucide-react-native';
import { Colors } from '@educard/shared';

interface EntityActionsProps {
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EntityActions({ onView, onEdit, onDelete }: EntityActionsProps) {
  return (
    <View style={s.bar}>
      <TouchableOpacity style={[s.btn, s.viewBtn]} onPress={onView} activeOpacity={0.7}>
        <Eye size={16} color={Colors.info[600]} />
      </TouchableOpacity>
      {onEdit && (
        <TouchableOpacity style={[s.btn, s.editBtn]} onPress={onEdit} activeOpacity={0.7}>
          <Edit3 size={16} color={Colors.success[600]} />
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity style={[s.btn, s.deleteBtn]} onPress={onDelete} activeOpacity={0.7}>
          <Trash2 size={16} color={Colors.error[600]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    marginTop: 10,
    paddingTop: 10,
    gap: 8,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewBtn: { backgroundColor: Colors.info[50] },
  editBtn: { backgroundColor: Colors.success[50] },
  deleteBtn: { backgroundColor: Colors.error[50] },
});
