/**
 * Student Academics menu — opens Timetable, Homework and Exams as separate pages.
 */

import { useNavigation } from '@react-navigation/native';
import { CalendarOff } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Screen } from '@/components/layout';
import { ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/lib/auth-store';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';

import {
  ACADEMIC_GRADIENTS,
  ACADEMIC_SUBTITLES,
  STUDENT_EXTRA_TABS,
  TABS,
  type Tab,
} from './academics/academics-constants';
import { ExamsSection } from './academics/ExamsSection';
import { HomeworkSection } from './academics/HomeworkSection';
import { MarksSection } from './academics/MarksSection';
import { TimetableSection } from './academics/TimetableSection';

export default function ParentAcademicsScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const isStudent = useAuthStore(s => s.user?.role) === 'student';
  const tabs = isStudent ? [...TABS, ...STUDENT_EXTRA_TABS] : TABS;

  return (
    <Screen safeArea={false} statusBarStyle="light" backgroundColor="#f0fdf4">
      <ScreenHeader
        title="Academics"
        subtitle="Learning and class activities"
        showBack={false}
        right={
          isStudent ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('StudentLeave')}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
            >
              <CalendarOff size={20} color="#fff" />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={menuStyles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={menuStyles.grid}>
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <Animated.View
                key={tab.key}
                entering={ZoomIn.delay(index * 70)
                  .springify()
                  .damping(13)}
                style={menuStyles.gridItem}
              >
                <TouchableOpacity
                  style={menuStyles.iconCard}
                  onPress={() => {
                    if (tab.key === 'holidays') {
                      navigation.navigate('Holidays');
                      return;
                    }
                    if (tab.key === 'exceptional-work') {
                      navigation.navigate('ExceptionalWork');
                      return;
                    }
                    if (tab.key === 'announcements') {
                      navigation.navigate('Announcements');
                      return;
                    }
                    navigation.navigate('StudentAcademicsTask', {
                      task: tab.key,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={ACADEMIC_GRADIENTS[tab.key]}
                    style={menuStyles.iconCircle}
                  >
                    <Icon size={28} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  <Text style={menuStyles.iconLabel}>{tab.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

export function ParentAcademicsTaskScreen({
  route,
}: {
  route: { params?: { task?: Tab } };
}) {
  const task: Tab = route?.params?.task ?? 'timetable';
  const title = TABS.find(tab => tab.key === task)?.label ?? 'Academics';

  return (
    <Screen safeArea={false} statusBarStyle="light" backgroundColor="#f8fafc">
      <ScreenHeader title={title} subtitle={ACADEMIC_SUBTITLES[task]} />
      {task === 'timetable' && <TimetableSection />}
      {task === 'homework' && <HomeworkSection />}
      {task === 'exams' && <ExamsSection />}
      {task === 'marks' && <MarksSection />}
    </Screen>
  );
}

const menuStyles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '33.33%', padding: 5 },
  iconCard: {
    minHeight: 142,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconLabel: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
});
