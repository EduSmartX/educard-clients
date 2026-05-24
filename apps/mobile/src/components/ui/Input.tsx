/**
 * Input Component with floating label and icons
 */

import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';

import { Colors } from '@/constants/colors';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: LucideIcon;
  leftIcon?: React.ReactNode;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  icon: LeftIconComponent,
  leftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  containerClassName,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasValue = value && value.length > 0;
  const isFloating = isFocused || hasValue;
  const isPassword = secureTextEntry !== undefined;

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const getBorderColor = () => {
    if (error) return 'border-danger-500';
    if (isFocused) return 'border-primary-500';
    return 'border-secondary-300';
  };

  // Support both icon (LucideIcon component) and leftIcon (rendered React element)
  const LeftIcon = LeftIconComponent;

  let labelColorClass = 'text-secondary-400';
  if (isFocused) labelColorClass = 'text-primary-500';
  else if (error) labelColorClass = 'text-danger-500';

  return (
    <View className={`mb-4 ${containerClassName ?? ''}`}>
      <View
        className={`relative flex-row items-center rounded-xl border-2 bg-white ${getBorderColor()} px-4 py-3`}
      >
        {/* Left Icon - either as component or rendered element */}
        {leftIcon}
        {LeftIcon && (
          <LeftIcon
            size={20}
            color={isFocused ? Colors.primary[500] : Colors.secondary[400]}
            style={{ marginRight: 12 }}
          />
        )}

        {/* Input Container */}
        <View className="flex-1">
          {/* Floating Label */}
          <Text
            className={`absolute left-0 ${
              isFloating ? '-top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
            } ${labelColorClass} transition-all duration-200`}
          >
            {label}
          </Text>

          {/* Text Input */}
          <TextInput
            className={`text-base text-secondary-900 ${isFloating ? 'pt-2' : ''} `}
            placeholderTextColor={Colors.secondary[400]}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            secureTextEntry={isPassword && !isPasswordVisible}
            {...props}
          />
        </View>

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility} className="p-1">
            {isPasswordVisible ? (
              <EyeOff size={20} color={Colors.secondary[400]} />
            ) : (
              <Eye size={20} color={Colors.secondary[400]} />
            )}
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {RightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} className="p-1" disabled={!onRightIconPress}>
            <RightIcon size={20} color={Colors.secondary[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && <Text className="ml-1 mt-1 text-sm text-danger-500">{error}</Text>}
    </View>
  );
}

export default Input;
