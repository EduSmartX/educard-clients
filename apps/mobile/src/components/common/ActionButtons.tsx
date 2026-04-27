/**
 * ActionButtons Component
 * Reusable action buttons (View, Edit, Delete) for list items
 */

import { Colors } from '@educard/shared';
import { Eye, Edit3, Trash2, MoreVertical, LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

interface ActionButton {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  onPress: () => void;
  disabled?: boolean;
}

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  size?: 'small' | 'medium' | 'large';
  direction?: 'row' | 'column';
}

const SIZES = {
  small: { button: 28, icon: 14, gap: 4 },
  medium: { button: 34, icon: 16, gap: 6 },
  large: { button: 40, icon: 18, gap: 8 },
};

export function ActionButtons({
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
  size = 'medium',
  direction = 'column',
}: ActionButtonsProps) {
  const sizeConfig = SIZES[size];

  const actions: { key: string; show: boolean; button: ActionButton }[] = [
    {
      key: 'view',
      show: showView && !!onView,
      button: {
        icon: Eye,
        color: Colors.info[600],
        bgColor: Colors.info[50],
        hoverBgColor: Colors.info[100],
        onPress: onView!,
      },
    },
    {
      key: 'edit',
      show: showEdit && !!onEdit,
      button: {
        icon: Edit3,
        color: Colors.success[600],
        bgColor: Colors.success[50],
        hoverBgColor: Colors.success[100],
        onPress: onEdit!,
      },
    },
    {
      key: 'delete',
      show: showDelete && !!onDelete,
      button: {
        icon: Trash2,
        color: Colors.error[600],
        bgColor: Colors.error[50],
        hoverBgColor: Colors.error[100],
        onPress: onDelete!,
      },
    },
  ];

  return (
    <View
      style={[
        styles.container,
        direction === 'row' ? styles.row : styles.column,
        { gap: sizeConfig.gap },
      ]}
    >
      {actions
        .filter((a) => a.show)
        .map(({ key, button }) => (
          <ActionButton key={key} {...button} size={sizeConfig.button} iconSize={sizeConfig.icon} />
        ))}
    </View>
  );
}

interface ActionButtonItemProps {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBgColor: string;
  onPress: () => void;
  size: number;
  iconSize: number;
  disabled?: boolean;
}

function ActionButton({
  icon: Icon,
  color,
  bgColor,
  hoverBgColor,
  onPress,
  size,
  iconSize,
  disabled = false,
}: ActionButtonItemProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isPressed ? hoverBgColor : bgColor,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Icon size={iconSize} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ActionButtons;
