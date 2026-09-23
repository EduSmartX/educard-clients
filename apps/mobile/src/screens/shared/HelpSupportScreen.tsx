/**
 * Help & Support Screen
 * Provides FAQs, contact information, and support options
 */

import { useNavigation } from '@react-navigation/native';
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
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { USER_ROLES } from '@/constants/config';
import { useAppInfo } from '@/hooks/use-app-info';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import { openAttachmentExternally } from '@/utils/attachment-utils';
import { isAdminRole, isTeacherRole } from '@/utils/role-utils';
import type { SharedStackNavigation } from '@/navigation/types';

interface FAQItem {
  question: string;
  answer: string;
}

const COMMON_FAQS: FAQItem[] = [
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings > Change Password. Enter your current password and the new password, then confirm to save.',
  },
  {
    question: 'How can I update my profile picture?',
    answer:
      'Go to Settings > Edit Profile and tap your profile picture. Upload a photo from your gallery or take a new one with the camera.',
  },
  {
    question: 'What should I do if I forgot my password?',
    answer:
      'On the login screen, tap "Forgot Password", enter your registered email to receive an OTP, then use the OTP to set a new password.',
  },
  {
    question: 'Where do I see notifications and announcements?',
    answer:
      'Tap the bell icon in the top bar to see notifications and announcements. Turn on notifications in Settings to also get push alerts on your device.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'Use the Email Support or Phone Support options at the top of this screen. You can also download the user manual for detailed guidance.',
  },
];

const ADMIN_FAQS: FAQItem[] = [
  {
    question: 'How do I add students?',
    answer:
      'Go to Manage > Students > Add Student for one student, or use Bulk Upload to import many students at once from a template.',
  },
  {
    question: 'How do I add teachers or staff?',
    answer:
      'Go to Manage > Teachers > Add Teacher, fill in their details, and assign a role. They can be made class teachers later.',
  },
  {
    question: 'How do I create classes and assign a class teacher?',
    answer:
      "Go to Manage > Classes, create a class, then assign a class teacher who can manage that class's students, subjects, and attendance.",
  },
  {
    question: 'How do I add subjects to a class?',
    answer:
      'Go to Manage > Subjects > Add Subject, then choose the subject, the class, and the teacher who will handle it.',
  },
  {
    question: 'How do I reset the passwords for a class?',
    answer:
      'Go to Manage > Students, open the class actions, and choose Reset Passwords. A default password is pre-filled from your organization settings, and you get an Excel file of the new credentials to share.',
  },
  {
    question: 'How do I review and approve leave requests?',
    answer:
      'Go to Manage > Leave > Requests, review each request, and Approve or Reject it. The applicant is notified of the decision.',
  },
  {
    question: 'How do I manage fees and view payments?',
    answer:
      'Go to Manage > Fees to set up fee structures and view student payment transactions and statuses.',
  },
  {
    question: 'How do I update my organization details?',
    answer:
      'Go to Settings > Organization to update the name, contact information, and address shown across the app.',
  },
  {
    question: 'How do I view attendance across classes?',
    answer:
      'Go to Manage > Attendance to review attendance for any class and date, with daily and monthly summaries.',
  },
  {
    question: 'How do I set up exams and track results?',
    answer:
      'Go to Manage > Exams to create exam sessions for classes, then track the marks teachers enter for each subject.',
  },
  {
    question: 'How do I manage the timetable?',
    answer:
      'Go to Manage > Timetable to set the periods, subjects, and teachers for each day of the week.',
  },
  {
    question: 'How do I keep track of homework?',
    answer:
      'Go to Manage > Homework to see homework assigned across classes, along with due dates and submission progress.',
  },
  {
    question: 'How do I send announcements or notifications?',
    answer:
      'Use Notifications / Announcements to send an update to teachers, students, or parents; they receive it under the bell icon.',
  },
];

const TEACHER_FAQS: FAQItem[] = [
  {
    question: 'How do I mark attendance for my class?',
    answer:
      'Go to My Work > Attendance, select your class and date, mark each student Present, Absent, or Late, then submit the attendance.',
  },
  {
    question: 'How can I view my timetable?',
    answer:
      'Go to Manage > Timetable to see your weekly schedule and all your assigned periods.',
  },
  {
    question: 'How can I enter marks for exams?',
    answer:
      'Go to Manage > Exams, choose the exam session and subject, then enter and save marks for each student.',
  },
  {
    question: 'How do I assign or manage homework?',
    answer:
      'Go to Manage > Homework > Add Homework, select the class and subject, add the details and due date, then publish it.',
  },
  {
    question: 'How do I apply for leave?',
    answer:
      'Go to My Work > Leave > Apply Leave, fill in the leave type, dates, and reason, then submit for approval.',
  },
  {
    question: 'How do I view student details?',
    answer:
      'Go to Manage > Students, search by name or ID, and tap a student to see their full profile.',
  },
  {
    question: 'How do I review homework submissions?',
    answer:
      'Open a homework item under Manage > Homework to see who submitted, view their work, and track pending submissions.',
  },
  {
    question: 'How do I manage subjects for my class?',
    answer:
      'Go to Manage > Subjects to add or edit the subjects for the class you are the class teacher of.',
  },
  {
    question: 'Where do I see announcements?',
    answer:
      'Tap the bell icon to see announcements and notifications sent by the school administration.',
  },
];

const STUDENT_FAQS: FAQItem[] = [
  {
    question: 'How do I view my attendance?',
    answer:
      'Open the Attendance section from your dashboard to see your day-by-day attendance and overall percentage.',
  },
  {
    question: 'How can I view my timetable?',
    answer:
      'Open the Timetable section to see your weekly class schedule and periods.',
  },
  {
    question: 'How do I check my homework?',
    answer:
      'Open the Homework section to see assigned homework, due dates, and any attachments from your teachers.',
  },
  {
    question: 'How do I view my exam results?',
    answer:
      'Open the Exams section to see your marks for each subject once your teacher has published them.',
  },
  {
    question: 'How do I apply for leave?',
    answer:
      "Go to Leave > Apply Leave, fill in the type, dates, and reason, then submit it for your teacher's approval.",
  },
  {
    question: 'How do I view my fees?',
    answer:
      'Open the Fees section to see your fee details, due amounts, and payment status.',
  },
  {
    question: 'Where do I see announcements and notices?',
    answer:
      'Tap the bell icon to see announcements and notices from your teachers and school.',
  },
];

const PARENT_FAQS: FAQItem[] = [
  {
    question: "How do I view my child's attendance?",
    answer:
      "Open the Attendance section to see your child's day-by-day attendance and overall percentage. If you have more than one child, switch between them from the top of the dashboard.",
  },
  {
    question: "How do I view my child's timetable?",
    answer:
      "Open the Timetable section to see your child's weekly class schedule and periods.",
  },
  {
    question: "How do I apply for leave on my child's behalf?",
    answer:
      'Go to Leave > Apply Leave, choose your child, fill in the type, dates, and reason, then submit it for approval.',
  },
  {
    question: "How do I check my child's homework?",
    answer:
      "Open the Homework section to see your child's assigned homework, due dates, and attachments.",
  },
  {
    question: "How do I view my child's exam results?",
    answer:
      "Open the Exams section to see your child's marks for each subject once teachers publish them.",
  },
  {
    question: 'How do I view and pay fees?',
    answer:
      "Open the Fees section to see your child's fee details, due amounts, and payment status.",
  },
  {
    question: 'How do I switch between my children?',
    answer:
      'If more than one child is linked to your account, use the child selector at the top of the dashboard to switch whose information you are viewing.',
  },
];

function getFaqsForRole(role?: string | null): FAQItem[] {
  if (isAdminRole(role)) {
    return [...ADMIN_FAQS, ...COMMON_FAQS];
  }
  if (isTeacherRole(role)) {
    return [...TEACHER_FAQS, ...COMMON_FAQS];
  }
  if (role?.toLowerCase() === USER_ROLES.STUDENT) {
    return [...STUDENT_FAQS, ...COMMON_FAQS];
  }
  if (role?.toLowerCase() === USER_ROLES.PARENT) {
    return [...PARENT_FAQS, ...COMMON_FAQS];
  }
  return COMMON_FAQS;
}

function getRoleLabel(role?: string | null): string {
  if (isAdminRole(role)) {
    return 'Admins';
  }
  if (isTeacherRole(role)) {
    return 'Teachers';
  }
  if (role?.toLowerCase() === USER_ROLES.STUDENT) {
    return 'Students';
  }
  if (role?.toLowerCase() === USER_ROLES.PARENT) {
    return 'Parents';
  }
  return '';
}

const SUPPORT_EMAIL = 'support@educard.com';
const SUPPORT_PHONE = '+91 80-4567-8900';

export default function HelpSupportScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { data: appInfo } = useAppInfo();
  const user = useAuthStore(state => state.user);
  const faqs = useMemo(() => getFaqsForRole(user?.role), [user?.role]);
  const roleLabel = getRoleLabel(user?.role);

  const supportEmail = appInfo?.support_email || SUPPORT_EMAIL;
  const supportPhone = appInfo?.support_phone || SUPPORT_PHONE;
  const userManualUrl = appInfo?.user_manual_url || appInfo?.website_url || '';
  const companyName = appInfo?.company_name || 'EduCard';

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    void Linking.openURL(
      `mailto:${supportEmail}?subject=EduCard Support Request`,
    );
  };

  const handleCallSupport = () => {
    void Linking.openURL(`tel:${supportPhone.replace(/\s/g, '')}`);
  };

  const handleOpenDocs = () => {
    // The user manual is a document: download and open it natively, not the browser.
    if (appInfo?.user_manual_url) {
      void openAttachmentExternally(appInfo.user_manual_url).catch(() => {
        if (userManualUrl) void Linking.openURL(userManualUrl);
      });
      return;
    }
    if (userManualUrl) {
      void Linking.openURL(userManualUrl);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#64748b', '#475569']} style={styles.header}>
        <Animated.View
          entering={FadeInUp.delay(100)}
          style={styles.headerContent}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSubtitle}>
              FAQs and contact information
            </Text>
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
            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailSupport}
            >
              <View style={[styles.contactIcon, styles.contactIconBlue]}>
                <Mail size={20} color="#2563eb" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>{supportEmail}</Text>
              </View>
              <ExternalLink size={18} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleCallSupport}
            >
              <View style={[styles.contactIcon, styles.contactIconGreen]}>
                <Phone size={20} color="#16a34a" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>{supportPhone}</Text>
              </View>
              <ExternalLink size={18} color="#9ca3af" />
            </TouchableOpacity>

            {!!userManualUrl && (
              <>
                <View style={styles.contactDivider} />

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={handleOpenDocs}
                >
                  <View style={[styles.contactIcon, styles.contactIconAmber]}>
                    <FileText size={20} color="#d97706" />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>User Manual</Text>
                    <Text style={styles.contactValue}>Download user guide</Text>
                  </View>
                  <ExternalLink size={18} color="#9ca3af" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {!!roleLabel && (
            <Text style={styles.sectionSubtitle}>for {roleLabel}</Text>
          )}
          <View style={styles.faqContainer}>
            {faqs.map((faq, index) => (
              <Animated.View
                key={faq.question}
                entering={FadeInDown.delay(250 + index * 50)}
              >
                <TouchableOpacity
                  style={[
                    styles.faqItem,
                    expandedIndex === index && styles.faqItemExpanded,
                  ]}
                  onPress={() => toggleFAQ(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqQuestion}>
                      <HelpCircle
                        size={18}
                        color="#6366f1"
                        style={styles.faqIcon}
                      />
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
          <Text style={styles.appInfoText}>{companyName} v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>
            © 2026 {companyName}. All rights reserved.
          </Text>
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
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: -8,
    marginBottom: 12,
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
  contactIconBlue: { backgroundColor: '#dbeafe' },
  contactIconGreen: { backgroundColor: '#dcfce7' },
  contactIconAmber: { backgroundColor: '#fef3c7' },
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
