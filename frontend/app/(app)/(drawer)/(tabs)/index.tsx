import { Entypo, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../../../../components/ui/Card';
import { API_CONFIG } from '../../../../constants/API';
import { COLORS } from '../../../../constants/Colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../../../constants/theme';
import { useOpenDrawer } from '../../../../hooks/useOpenDrawer';
import { useAuth } from '../../../../context/AuthContext';
import { moodService } from '../../../../services/mood.service';
import { wellnessService } from '../../../../services/wellness.service';
import type { WellnessPlan } from '../../../../types';

const getFullAvatarUrl = (avatarPath: string | undefined): string => {
  if (!avatarPath || avatarPath.trim() === '') {
    return 'https://via.placeholder.com/50';
  }
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  const baseUrl = API_CONFIG.BASE_URL.replace('/api', '');
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${baseUrl}${cleanPath}`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const openDrawer = useOpenDrawer();
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [todayMood, setTodayMood] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plan, mood] = await Promise.all([
        wellnessService.getWellnessPlan(),
        moodService.getTodayMood(),
      ]);
      setWellnessPlan(plan);
      setTodayMood(mood);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      excellent: COLORS.mood.excellent,
      good: COLORS.mood.good,
      okay: COLORS.mood.okay,
      poor: COLORS.mood.poor,
      terrible: COLORS.mood.terrible,
    };
    return moodColors[mood] || COLORS.textLight;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={[styles.header, { paddingTop: insets.top + SPACING.xxl }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={openDrawer}
            style={styles.menuButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>Assalamu Alaikum,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <Image
              source={{ uri: getFullAvatarUrl(user?.avatar) }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Mood</Text>
        {todayMood ? (
          <Card style={styles.moodCard}>
            <View style={styles.moodCardContent}>
              <View
                style={[
                  styles.moodIcon,
                  { backgroundColor: getMoodColor(todayMood.mood) },
                ]}
              >
                <Ionicons name="happy" size={32} color="#fff" />
              </View>
              <View style={styles.moodInfo}>
                <Text style={styles.moodText}>
                  You're feeling {todayMood.mood}
                </Text>
                <Text style={styles.moodNote}>{todayMood.note}</Text>
              </View>
            </View>
          </Card>
        ) : (
          <TouchableOpacity
            style={styles.addMoodButton}
            onPress={() => router.push('/mood')}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
            <Text style={styles.addMoodText}>Add Today's Mood</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Wellness Plan</Text>
        {wellnessPlan?.dailyTasks?.slice(0, 3).map((task, index) => (
          <Card key={index} style={styles.taskCard}>
            <View style={styles.taskCheckbox}>
              {task.completed ? (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              ) : (
                <Ionicons name="ellipse-outline" size={24} color={COLORS.textLight} />
              )}
            </View>
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>
              <Text style={styles.taskTime}>{task.time}</Text>
            </View>
          </Card>
        ))}
        {wellnessPlan?.dailyTasks && wellnessPlan.dailyTasks.length > 3 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Tasks</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(drawer)/(tabs)/breath')}
          >
            <LinearGradient
              colors={[COLORS.secondary, '#34D399']}
              style={styles.actionIcon}
            >
              <Ionicons name="fitness" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Breathing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/journal')}
          >
            <LinearGradient
              colors={[COLORS.accent, '#FBBF24']}
              style={styles.actionIcon}
            >
              <Ionicons name="journal" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Journal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(drawer)/(tabs)/ai-therapist')}
          >
            <LinearGradient
              colors={[COLORS.primary, '#818CF8']}
              style={styles.actionIcon}
            >
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>AI Therapist</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/heal-well')}
          >
            <LinearGradient
              colors={['#1E3A5F', '#2E5077']}
              style={styles.actionIcon}
            >
              <Ionicons name="moon" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Heal Well</Text>
          </TouchableOpacity>
        </View>
      </View>

      {wellnessPlan?.motivationalQuote && (
        <Card style={styles.quoteCard}>
          <View style={styles.quoteContent}>
            <Entypo name="quote" size={24} color={COLORS.primary} />
            <Text style={styles.quoteText}>{wellnessPlan.motivationalQuote}</Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    borderBottomLeftRadius: RADIUS.xl + 4,
    borderBottomRightRadius: RADIUS.xl + 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  greeting: {
    ...TYPOGRAPHY.caption,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    ...TYPOGRAPHY.heading1,
    color: '#fff',
    marginTop: SPACING.xs,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading3,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  moodCard: { marginBottom: 0 },
  moodCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  moodInfo: { flex: 1 },
  moodText: {
    ...TYPOGRAPHY.bodyMedium,
    fontSize: 18,
    color: COLORS.text,
  },
  moodNote: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  addMoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addMoodText: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  taskCheckbox: { marginRight: SPACING.lg },
  taskContent: { flex: 1 },
  taskTitle: {
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  taskDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  taskTime: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  viewAllText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.text,
  },
  quoteCard: { margin: SPACING.xl, marginTop: 0 },
  quoteContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quoteText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontStyle: 'italic',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
});
