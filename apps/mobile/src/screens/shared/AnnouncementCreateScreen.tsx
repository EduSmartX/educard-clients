import { getRoleGradient } from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  ANNOUNCEMENT_DELIVERY_METHODS,
  ANNOUNCEMENT_RECIPIENT_TYPES,
  useCreateAnnouncement,
  type CreateAnnouncementPayload,
} from '@/features/announcements';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { headerStyles, layoutStyles } from '@/styles';
import { isAdminRole } from '@/utils/role-utils';
import { useToast } from '@/lib/toast-context';

const adminGradient = getRoleGradient('admin');
const deliveryOptions: Array<{
  value: CreateAnnouncementPayload['delivery_methods'];
  label: string;
}> = [
  { value: ANNOUNCEMENT_DELIVERY_METHODS.EMAIL, label: 'Email' },
  { value: ANNOUNCEMENT_DELIVERY_METHODS.SMS, label: 'SMS' },
];
const recipientOptions: Array<{
  value: CreateAnnouncementPayload['recipient_type'];
  label: string;
}> = [
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS, label: 'All users' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_STUDENTS, label: 'All students' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_TEACHERS, label: 'All teachers' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.ALL_PARENTS, label: 'All parents' },
  { value: ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS, label: 'Email list' },
];

export default function AnnouncementCreateScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const role = useAuthStore(state => state.user?.role);
  const isAdmin = useMemo(() => isAdminRole(role), [role]);
  const mutation = useCreateAnnouncement();
  const [delivery, setDelivery] = useState<
    CreateAnnouncementPayload['delivery_methods']
  >(ANNOUNCEMENT_DELIVERY_METHODS.EMAIL);
  const [recipient, setRecipient] = useState<
    CreateAnnouncementPayload['recipient_type']
  >(ANNOUNCEMENT_RECIPIENT_TYPES.ALL_USERS);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventNote, setEventNote] = useState('');
  const [manualEmails, setManualEmails] = useState('');

  const submit = () => {
    if (!isAdmin) return;
    if (!subject.trim() || !message.trim()) {
      showToast({
        type: 'error',
        title: 'Required fields',
        message: 'Subject and message are required.',
      });
      return;
    }
    if (delivery === ANNOUNCEMENT_DELIVERY_METHODS.SMS && !eventName.trim()) {
      showToast({
        type: 'error',
        title: 'Required field',
        message: 'Event name is required for SMS announcements.',
      });
      return;
    }
    if (
      recipient === ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS &&
      !manualEmails.trim()
    ) {
      showToast({
        type: 'error',
        title: 'Required field',
        message: 'Enter at least one email address.',
      });
      return;
    }

    mutation.mutate(
      {
        subject: subject.trim(),
        body_html: message.trim(),
        delivery_methods: delivery,
        recipient_type: recipient,
        event_name: eventName.trim(),
        event_date: eventDate.trim(),
        event_note: eventNote.trim(),
        manual_emails: manualEmails.trim(),
      },
      {
        onSuccess: () => {
          showToast({
            type: 'success',
            title: 'Announcement queued',
            message: 'Delivery has been queued.',
          });
          navigation.goBack();
        },
        onError: () => {
          showToast({
            type: 'error',
            title: 'Could not send',
            message: 'Please check the fields and try again.',
          });
        },
      },
    );
  };

  if (!isAdmin) {
    return (
      <View style={layoutStyles.container}>
        <Text style={s.denied}>
          Only administrators can send announcements.
        </Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity
              style={headerStyles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>New announcement</Text>
              <Text style={headerStyles.subtitle}>
                Choose delivery and recipients
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="Delivery type">
            <View style={s.optionRow}>
              {deliveryOptions.map(option => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={delivery === option.value}
                  onPress={() => setDelivery(option.value)}
                />
              ))}
            </View>
          </Field>

          <Field label="Recipients">
            <View style={s.optionWrap}>
              {recipientOptions.map(option => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  selected={recipient === option.value}
                  onPress={() => setRecipient(option.value)}
                />
              ))}
            </View>
          </Field>

          {recipient === ANNOUNCEMENT_RECIPIENT_TYPES.MANUAL_EMAILS && (
            <Field label="Email addresses">
              <TextInput
                style={s.input}
                value={manualEmails}
                onChangeText={setManualEmails}
                placeholder="person@example.com, another@example.com"
                placeholderTextColor="#94a3b8"
                multiline
                autoCapitalize="none"
              />
            </Field>
          )}

          <Field label="Subject">
            <TextInput
              style={s.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Announcement subject"
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Message">
            <TextInput
              style={[s.input, s.message]}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your announcement"
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
            />
          </Field>

          {delivery === ANNOUNCEMENT_DELIVERY_METHODS.SMS && (
            <Field label="Event name">
              <TextInput
                style={s.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="Event name"
                placeholderTextColor="#94a3b8"
              />
            </Field>
          )}

          <Field label="Event date (optional)">
            <TextInput
              style={s.input}
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94a3b8"
            />
          </Field>
          <Field label="Note (optional)">
            <TextInput
              style={[s.input, s.note]}
              value={eventNote}
              onChangeText={setEventNote}
              placeholder="Additional details"
              placeholderTextColor="#94a3b8"
              multiline
            />
          </Field>

          <TouchableOpacity
            style={s.submit}
            onPress={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Send size={17} color="#fff" />
            )}
            <Text style={s.submitText}>
              {mutation.isPending ? 'Sending...' : 'Send announcement'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

function OptionButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.option, selected && s.optionSelected]}
      onPress={onPress}
    >
      <Text style={[s.optionText, selected && s.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  field: { gap: 7 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#0f172a',
    fontSize: 14,
  },
  message: { minHeight: 130 },
  note: { minHeight: 80 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  optionSelected: { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  optionText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  optionTextSelected: { color: '#4338ca' },
  submit: {
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  denied: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#64748b',
    padding: 24,
  },
});
