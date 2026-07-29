/**
 * Attendance Screen with Tabs
 * Combines Summary and Report views in a single screen with tabs
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { ChevronLeft, TrendingUp, BarChart3 } from '@/lib/lucide-shim';

import { ReportTab } from './ReportTab';
import { styles } from './styles';
import { SummaryTab } from './SummaryTab';

export default function AttendanceScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'summary' | 'report'>('summary');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#0d9488', '#14b8a6', '#2dd4bf']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Attendance</Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'summary' ? 'Daily Overview' : 'Class Reports'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
            onPress={() => setActiveTab('summary')}
          >
            <TrendingUp
              size={18}
              color={activeTab === 'summary' ? '#0d9488' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
              Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'report' && styles.tabActive]}
            onPress={() => setActiveTab('report')}
          >
            <BarChart3
              size={18}
              color={activeTab === 'report' ? '#0d9488' : 'rgba(255,255,255,0.7)'}
            />
            <Text style={[styles.tabText, activeTab === 'report' && styles.tabTextActive]}>
              Report
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tab Content */}
      <View style={styles.content}>{activeTab === 'summary' ? <SummaryTab /> : <ReportTab />}</View>
    </View>
  );
}
