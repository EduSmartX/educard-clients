/**
 * Input for one product attribute: chips for choices, a text box otherwise.
 */
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPE,
  type ProductAttribute,
} from '@educard/shared';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { getMediaUrl } from '@/constants/config';

import { storeStyles as s } from './store-styles';

interface AttributeInputProps {
  attribute: ProductAttribute;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  /** Class overrides: a leading "Same as school" chip that clears the value. */
  inheritLabel?: string;
  placeholder?: string;
}

export function AttributeInput({
  attribute,
  value,
  onChange,
  compact = false,
  inheritLabel,
  placeholder,
}: AttributeInputProps) {
  if (attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.SELECT) {
    const chip = (
      key: string,
      label: string,
      active: boolean,
      image?: string,
    ) => (
      <TouchableOpacity
        key={key}
        style={[s.option, compact && s.optionSmall, active && s.optionActive]}
        onPress={() => onChange(key)}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
      >
        {image ? (
          <Image source={{ uri: getMediaUrl(image) }} style={s.optionImage} />
        ) : null}
        <Text style={[s.optionText, active && s.optionTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
    return (
      <View style={s.optionRow}>
        {inheritLabel !== undefined && chip('', inheritLabel, !value)}
        {attribute.options.map(option =>
          chip(
            option.value,
            option.display_label,
            value === option.value,
            compact ? undefined : option.image_url,
          ),
        )}
      </View>
    );
  }
  return (
    <TextInput
      style={[s.input, compact && s.inputSmall]}
      value={value}
      placeholder={placeholder}
      accessibilityLabel={attribute.display_name}
      keyboardType={
        attribute.input_type === PRODUCT_ATTRIBUTE_INPUT_TYPE.NUMBER
          ? 'numeric'
          : 'default'
      }
      onChangeText={onChange}
    />
  );
}
