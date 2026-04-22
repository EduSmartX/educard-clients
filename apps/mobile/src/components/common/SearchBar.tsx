/**
 * SearchBar Component
 * Reusable search bar with filter button
 *
 * Features:
 * - Only triggers search on submit/blur (not every keystroke)
 * - Clear button when text is present
 * - Optional filter button with badge
 */

import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Filter, X } from 'lucide-react-native';
import { Colors } from '@educard/shared';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
  activeFilterCount?: number;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search...',
  onFilterPress,
  showFilter = true,
  activeFilterCount = 0,
}: SearchBarProps) {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={18} color={Colors.gray[400]} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onSubmit}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <X size={16} color={Colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>
      {showFilter && onFilterPress && (
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={onFilterPress}
        >
          <Filter size={18} color={activeFilterCount > 0 ? '#fff' : Colors.gray[600]} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
});
