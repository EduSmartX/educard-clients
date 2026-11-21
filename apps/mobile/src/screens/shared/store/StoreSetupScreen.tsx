/**
 * Store Setup Screen - the school's product looks and ID card designs (org admin)
 */
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { storeStyles as s } from '@/features/store/components/store-styles';
import type { SharedStackNavigation } from '@/navigation/types';
import { layoutStyles } from '@/styles';

import { IdCardSetup } from './setup/IdCardSetup';
import { ProductLooksSetup } from './setup/ProductLooksSetup';

type SetupTab = 'products' | 'id-cards';

const TABS: { value: SetupTab; label: string }[] = [
  { value: 'products', label: 'Products' },
  { value: 'id-cards', label: 'ID cards' },
];

export default function StoreSetupScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<SetupTab>('products');

  return (
    <View style={[layoutStyles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store setup</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map(item => {
          const selected = item.value === tab;
          return (
            <TouchableOpacity
              key={item.value}
              style={[s.pill, selected && s.pillActive]}
              onPress={() => setTab(item.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <Text style={[s.pillText, selected && s.pillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'products' ? <ProductLooksSetup /> : <IdCardSetup />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerSpacer: { width: 24 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  content: { padding: 16 },
});
