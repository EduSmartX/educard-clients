/**
 * Help & Support Screen
 * FAQs and contact information
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Globe,
  MessageCircle,
  HelpCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  headerStyles,
  layoutStyles,
  bodyStyles,
  sectionTitleStyles,
  cardStyles,
  dividerStyles,
} from '@/styles';

const adminGradient = getRoleGradient('admin');

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How do I manage leave allocations?',
    answer:
      'Go to Management > Leave Allocations. You can create, edit, and delete allocations for different leave types and roles.',
  },
  {
    question: 'How do I mark attendance?',
    answer:
      'Navigate to Attendance from the home screen. Select a class, then mark each student as present, absent, or late.',
  },
  {
    question: 'How do I set up the timetable?',
    answer:
      'Go to Timetable, tap the settings icon to manage class groups and time slots, then assign subjects to each slot.',
  },
  {
    question: 'How do I create exams and enter marks?',
    answer:
      'Go to Exams, create an exam session, add exams with subjects, then enter marks for each student.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings > Security to change your password. You need your current password to set a new one.',
  },
  {
    question: 'How do I update organization details?',
    answer:
      'Organization details can be updated from the web dashboard. The mobile app shows a read-only view under Settings > Organization Info.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Help & Support</Text>
              <Text style={headerStyles.subtitle}>FAQs & contact us</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={bodyStyles.scroll} contentContainerStyle={bodyStyles.content}>
        {/* FAQs */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={sectionTitleStyles.label}>FREQUENTLY ASKED QUESTIONS</Text>
          <View style={cardStyles.cardLarge}>
            {faqs.map((faq, idx) => (
              <View key={idx}>
                {idx > 0 && <View style={dividerStyles.spaced} />}
                <TouchableOpacity
                  style={s.faqRow}
                  onPress={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                  activeOpacity={0.7}
                >
                  <HelpCircle size={16} color="#7c3aed" />
                  <Text style={s.faqQuestion}>{faq.question}</Text>
                  {expandedIndex === idx ? (
                    <ChevronUp size={16} color="#94a3b8" />
                  ) : (
                    <ChevronDown size={16} color="#94a3b8" />
                  )}
                </TouchableOpacity>
                {expandedIndex === idx && (
                  <Animated.View entering={FadeInDown.duration(200)}>
                    <Text style={s.faqAnswer}>{faq.answer}</Text>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Contact */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={sectionTitleStyles.label}>CONTACT SUPPORT</Text>
          <View style={cardStyles.cardLarge}>
            <TouchableOpacity
              style={s.contactRow}
              onPress={() => Linking.openURL('mailto:support@educard.in')}
            >
              <View style={[s.contactIcon, { backgroundColor: '#eff6ff' }]}>
                <Mail size={16} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>Email Support</Text>
                <Text style={s.contactValue}>support@educard.in</Text>
              </View>
            </TouchableOpacity>
            <View style={dividerStyles.spaced} />
            <TouchableOpacity
              style={s.contactRow}
              onPress={() => Linking.openURL('tel:+919876543210')}
            >
              <View style={[s.contactIcon, { backgroundColor: '#dcfce7' }]}>
                <Phone size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.contactLabel}>Phone Support</Text>
                <Text style={s.contactValue}>+91 98765 43210</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={s.version}>
          <Text style={s.versionText}>EduCard v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  faqAnswer: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginTop: 8,
    marginLeft: 26,
    paddingBottom: 4,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  contactValue: { fontSize: 12, color: '#64748b', marginTop: 2 },
  version: { alignItems: 'center', marginTop: 30 },
  versionText: { fontSize: 12, color: '#cbd5e1' },
});
