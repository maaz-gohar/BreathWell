import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AppScreenHeader from '../../../components/ui/AppScreenHeader';
import Card from '../../../components/ui/Card';
import { COLORS } from '../../../constants/Colors';
import { LAYOUT, RADIUS, SPACING, TYPOGRAPHY } from '../../../constants/theme';
import { moodService } from '../../../services/mood.service';

interface MoodAnalytics {
  weeklyAverages: Array<{ week: string; average: number }>;
  distribution: Record<string, number>;
  totalMoods: number;
  averageMood: number;
}

const MOOD_EMOJI_LABELS: Record<string, string> = {
  '😊': 'Excellent',
  '🙂': 'Good',
  '😐': 'Okay',
  '😔': 'Poor',
  '😢': 'Terrible'
};

export default function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState<MoodAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await moodService.getMoodAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Failed to load analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="stats-chart-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const distributionEntries = analytics?.distribution
    ? Object.entries(analytics.distribution).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppScreenHeader title="Mood Analytics" subtitle="Insights from your mood journey" />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="calendar" size={28} color={COLORS.primary} />
            <Text style={styles.statValue}>{analytics?.totalMoods ?? 0}</Text>
            <Text style={styles.statLabel}>Total Moods</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="trending-up" size={28} color={COLORS.success} />
            <Text style={styles.statValue}>
              {(analytics?.averageMood ?? 0).toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </Card>
        </View>
      </View>

      {distributionEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Distribution</Text>
          <Card style={styles.distributionCard}>
            {distributionEntries.map(([emoji, count]) => (
              <View key={emoji} style={styles.distributionRow}>
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={styles.moodLabel}>
                  {MOOD_EMOJI_LABELS[emoji] || 'Other'}
                </Text>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${(count / (analytics?.totalMoods || 1)) * 100}%`,
                        backgroundColor: COLORS.primary
                      }
                    ]}
                  />
                </View>
                <Text style={styles.count}>{count}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {analytics?.weeklyAverages && analytics.weeklyAverages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Averages</Text>
          <Card style={styles.weeklyCard}>
            {analytics.weeklyAverages.map((item, index) => (
              <View key={item.week} style={styles.weeklyRow}>
                <Text style={styles.weekLabel}>Week {index + 1}</Text>
                <Text style={styles.weekValue}>
                  {item.average.toFixed(1)} / 10
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      {(!analytics || analytics.totalMoods === 0) && !loading && (
        <Card style={styles.emptyCard}>
          <Ionicons name="happy-outline" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No mood data yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking your mood to see analytics here
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    paddingBottom: 40
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 30
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  section: {
    paddingHorizontal: LAYOUT.screenPaddingHorizontal,
    paddingTop: LAYOUT.sectionSpacingVertical,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4
  },
  distributionCard: {
    padding: 16
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  emoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center'
  },
  moodLabel: {
    width: 80,
    fontSize: 14,
    color: COLORS.text
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 12
  },
  bar: {
    height: '100%',
    borderRadius: 10
  },
  count: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right'
  },
  weeklyCard: {
    padding: 16
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  weekLabel: {
    fontSize: 16,
    color: COLORS.text
  },
  weekValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary
  },
  emptyCard: {
    margin: 20,
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8
  }
});
