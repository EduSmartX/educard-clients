/**
 * Help & Support Screen
 * Provides FAQs, contact information, and support options
 */

import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  HelpCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How do I mark attendance for my class?',
    answer:
      "Go to Dashboard > My Work > Attendance. Select your class and date, then mark each student as Present, Absent, or Late. Don't forget to submit the attendance.",
  },
  {
    question: 'How can I view my class timetable?',
    answer:
      'Navigate to Dashboard > Manage > Timetable. You can view your weekly schedule and see all your assigned periods.',
  },
  {
    question: 'How do I apply for leave?',
    answer:
      'Go to My Work > Leave > Apply Leave. Fill in the leave type, dates, and reason, then submit your application for approval.',
  },
  {
    question: 'How can I enter marks for exams?',
    answer:
      'Go to Manage > Exams > Select the exam session > Select the subject. You can then enter marks for each student and save them.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings > Change Password. Enter your current password and new password, then confirm the change.',
  },
  {
    question: 'How can I update my profile picture?',
    answer:
      'Go to Settings > Edit Profile. Tap on your profile picture to upload a new photo from your gallery or take a new one.',
  },
  {
    question: 'What should I do if I forgot my password?',
    answer:
      'On the login screen, tap "Forgot Password". Enter your registered email to receive an OTP. Use the OTP to reset your password.',
  },
  {
    question: 'How do I view student details?',
    answer:
      'Go to Manage > Students. You can search for students by name or ID and tap on any student to view their detailed information.',
  },
];

const SUPPORT_EMAIL = 'support@educard.com';
const SUPPORT_PHONE = '+91 80-4567-8900';

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=EduCard Support Request`);
  };

  const handleCallSupport = () => {
    void Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`);
  };

  const handleOpenDocs = () => {
    void Linking.openURL('https://educard.com/docs');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#64748b', '#475569']} style={styles.header}>
        <Animated.View entering={FadeInUp.delay(100)} style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSubtitle}>FAQs and contact information</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Support Section */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity style={styles.contactItem} onPress={handleEmailSupport}>
              <View style={[styles.contactIcon, { backgroundColor: '#dbeafe' }]}>
                <Mail size={20} color="#2563eb" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
              </View>
              <ExternalLink size={18} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity style={styles.contactItem} onPress={handleCallSupport}>
              <View style={[styles.contactIcon, { backgroundColor: '#dcfce7' }]}>
                <Phone size={20} color="#16a34a" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>{SUPPORT_PHONE}</Text>
              </View>
              <ExternalLink size={18} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity style={styles.contactItem} onPress={handleOpenDocs}>
              <View style={[styles.contactIcon, { backgroundColor: '#fef3c7' }]}>
                <FileText size={20} color="#d97706" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Documentation</Text>
                <Text style={styles.contactValue}>View user guides</Text>
              </View>
              <ExternalLink size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {FAQ_DATA.map((faq, index) => (
              <Animated.View key={faq.question} entering={FadeInDown.delay(250 + index * 50)}>
                <TouchableOpacity
                  style={[styles.faqItem, expandedIndex === index && styles.faqItemExpanded]}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqQuestion}>
                      <HelpCircle size={18} color="#6366f1" style={styles.faqIcon} />
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    </View>
                    {expandedIndex === index ? (
                      <ChevronUp size={20} color="#6b7280" />
                    ) : (
                      <ChevronDown size={20} color="#6b7280" />
                    )}
                  </View>
                  {expandedIndex === index && (
                    <Animated.View entering={FadeInDown.duration(200)}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.appInfo}>
          <Text style={styles.appInfoText}>EduCard v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>© 2026 EduCard. All rights reserved.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    color: '#6b7280',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  faqContainer: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  faqItemExpanded: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 12,
  },
  faqIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: 12,
    marginLeft: 28,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  appInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
