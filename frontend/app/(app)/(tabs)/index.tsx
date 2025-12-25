import { Entypo, FontAwesome5, Ionicons } from '@expo/vector-icons';
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
import Card from '../../../components/ui/Card';
import { API_CONFIG } from '../../../constants/API';
import { COLORS } from '../../../constants/Colors';
import { useAuth } from '../../../context/AuthContext';
import { moodService } from '../../../services/mood.service';
import { wellnessService } from '../../../services/wellness.service';
import type { WellnessPlan } from '../../../types';

// Helper function for avatar URL
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
  const { user } = useAuth();
  const router = useRouter();
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
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
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

      {/* Today's Mood */}
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

      {/* Daily Wellness Plan */}
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

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/breath')}
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
            onPress={() => router.push('/ai-therapist')}
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
            onPress={() => router.push('/ai-therapist')}
          >
            <LinearGradient
              colors={['#8B5CF6', '#A78BFA']}
              style={styles.actionIcon}
            >
              <FontAwesome5 name="brain" size={24} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>Your Ai Therapist</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Motivation Quote */}
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
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
  },
  moodCard: {
    marginBottom: 0,
  },
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
    marginRight: 15,
  },
  moodInfo: {
    flex: 1,
  },
  moodText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  moodNote: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 5,
  },
  addMoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addMoodText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 10,
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskCheckbox: {
    marginRight: 15,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  quoteCard: {
    margin: 20,
    marginTop: 0,
  },
  quoteContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quoteText: {
    flex: 1,
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.text,
    marginLeft: 10,
  },
});