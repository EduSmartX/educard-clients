/**
 * ContactPickerModal - bottom-sheet modal that lists the device's contacts (one row per
 * phone number), with search. Selecting a row returns the normalized number to the caller.
 * Handles permission-denied and load errors inline.
 */

import { AlertCircle, Search, User, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  CONTACTS_PERMISSION_DENIED,
  loadContactPhones,
  type ContactPhone,
} from '@/lib/contacts';

interface ContactPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (phoneNumber: string) => void;
}

export function ContactPickerModal({
  visible,
  onClose,
  onSelect,
}: ContactPickerModalProps) {
  const [contacts, setContacts] = useState<ContactPhone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) {
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    loadContactPhones()
      .then(list => {
        if (active) {
          setContacts(list);
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        if (
          err instanceof Error &&
          err.message === CONTACTS_PERMISSION_DENIED
        ) {
          setPermissionDenied(true);
        } else {
          setError('Unable to load contacts. Please try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [visible]);

  const filtered = search
    ? contacts.filter(
        c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.number.includes(search),
      )
    : contacts;

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleSelect = (number: string) => {
    onSelect(number);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose a contact</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {!loading && !error && !permissionDenied && (
            <View style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search name or number"
                placeholderTextColor="#94a3b8"
              />
            </View>
          )}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#7c3aed" />
              <Text style={styles.centerText}>Loading contacts...</Text>
            </View>
          ) : permissionDenied ? (
            <View style={styles.center}>
              <AlertCircle size={28} color="#ef4444" />
              <Text style={styles.centerText}>
                Contacts permission is denied. Enable it in Settings to pick a
                number.
              </Text>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.settingsText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <AlertCircle size={28} color="#ef4444" />
              <Text style={styles.centerText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleSelect(item.normalized)}
                >
                  <View style={styles.avatar}>
                    <User size={16} color="#7c3aed" />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <Text style={styles.optionNumber}>{item.number}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No contacts found</Text>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionName: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  optionNumber: { fontSize: 13, color: '#64748b', marginTop: 2 },
  empty: { padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 15 },
  center: { padding: 32, alignItems: 'center', gap: 12 },
  centerText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  settingsBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f3ff',
  },
  settingsText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },
});
